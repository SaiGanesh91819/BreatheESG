# pyrefly: ignore [missing-import]
from rest_framework import viewsets, views, status, response
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404
from .models import Tenant, Facility, NormalizedRecord, AuditTrail, RawIngestionLog
from .serializers import TenantSerializer, FacilitySerializer, NormalizedRecordSerializer, RawIngestionLogSerializer
from .services.normalizer import ingest_sustainability_file

class RawIngestionLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RawIngestionLogSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Strict multi-tenancy filtering
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            return RawIngestionLog.objects.filter(tenant=tenant).order_by('-id')
        return RawIngestionLog.objects.none()

class TenantViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [AllowAny]

class FacilityViewSet(viewsets.ModelViewSet):
    serializer_class = FacilitySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Strict multi-tenancy filtering
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            return Facility.objects.filter(tenant=tenant).order_by('-id')
        return Facility.objects.none()

    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            serializer.save(tenant=tenant)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("X-Tenant-Slug header is required to resolve context.")

class NormalizedRecordViewSet(viewsets.ModelViewSet):
    serializer_class = NormalizedRecordSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Strict multi-tenancy filtering based on middleware resolved request.tenant
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            return NormalizedRecord.objects.filter(tenant=tenant).order_by('-id')
        return NormalizedRecord.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Action endpoint to manually approve and lock a record for auditing."""
        record = self.get_object()
        record.status = 'Approved'
        record.save()

        # Log action to transaction audit log
        AuditTrail.objects.create(
            record=record,
            user_id="Sai Ganesh",
            action_taken="Approved and locked record manually"
        )

        return response.Response(NormalizedRecordSerializer(record).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Action endpoint to manually flag a record as an anomaly."""
        record = self.get_object()
        record.status = 'Suspicious'
        record.comment = 'Anomalous deviation in volumes detected. Under engineering review.'
        record.save()

        # Log action to transaction audit log
        AuditTrail.objects.create(
            record=record,
            user_id="Sai Ganesh",
            action_taken="Flagged as suspicious anomaly manually"
        )

        return response.Response(NormalizedRecordSerializer(record).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def edit_raw(self, request, pk=None):
        """Action endpoint to forcefully edit raw values, dynamically re-calculating carbon accounting."""
        new_val = request.data.get('raw_value')
        if not new_val:
            return response.Response({"detail": "raw_value is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        record = self.get_object()
        
        # Immuntability guard on already approved entries
        if record.status == 'Approved':
            return response.Response({"detail": "Immutable Error: Cannot modify fields of an Approved and locked record in the ledger."}, status=status.HTTP_400_BAD_REQUEST)

        old_val = record.raw_value
        old_emissions = record.calc_emissions
        old_normalized = record.normalized_value

        record.raw_value = new_val

        import re
        
        # Default fallback
        emissions = record.calc_emissions
        normalized = record.normalized_value
        comment = record.comment
        status_val = record.status
        
        try:
            # Clean and parse the first number in the edited raw input
            nums = re.findall(r'[\d\.\,]+', new_val)
            if nums:
                val = float(nums[0].replace(',', ''))
                
                source_lower = record.source.lower()
                icon_lower = record.source_icon.lower() if record.source_icon else ''
                
                if 'sap' in source_lower:
                    DENSITY_FACTORS = {
                        'diesel': 0.84,
                        'benzin': 0.74,
                        'strom': 1.0,
                    }
                    EMISSION_FACTORS = {
                        'diesel': 3.15,
                        'benzin': 3.10,
                        'strom': 0.35
                    }
                    
                    matched_fuel = None
                    for key in EMISSION_FACTORS.keys():
                        if key in new_val.lower():
                            matched_fuel = key
                            break
                    if not matched_fuel:
                        matched_fuel = 'strom' if record.scope == 'Scope 2' else 'diesel'
                        
                    density = DENSITY_FACTORS.get(matched_fuel, 1.0)
                    factor = EMISSION_FACTORS.get(matched_fuel, 3.15)
                    
                    if matched_fuel == 'strom':
                        normalized = f"{val:,.1f} kWh"
                        emissions = (val * factor) / 1000
                    else:
                        mass_kg = val * density
                        normalized = f"{mass_kg:,.2f} kg"
                        emissions = (mass_kg * factor) / 1000
                        
                elif 'national' in source_lower or 'grid' in source_lower or icon_lower == 'bolt' or 'utility' in source_lower:
                    factor = 0.35 # GRID_EMISSION_FACTOR
                    normalized = f"{val:,.1f} kWh"
                    emissions = (val * factor) / 1000
                    
                elif 'concur' in source_lower or 'travel' in source_lower or icon_lower in ['flight', 'hotel', 'directions_car']:
                    if icon_lower == 'hotel' or 'hotel' in new_val.lower():
                        emissions = (val * 15.0) / 1000
                        normalized = f"{val} nights"
                    elif icon_lower == 'directions_car' or 'ground' in new_val.lower() or 'transport' in new_val.lower():
                        emissions = (val * 0.1) / 1000
                        normalized = f"{val:,.1f} km"
                    else: # Flight
                        CLASS_MULTIPLIERS = {
                            'economy': 0.15,
                            'premium': 0.22,
                            'business': 0.29,
                            'first': 0.38,
                        }
                        matched_class = 'economy'
                        for k in CLASS_MULTIPLIERS.keys():
                            if k in new_val.lower():
                                matched_class = k
                                break
                        factor = CLASS_MULTIPLIERS[matched_class]
                        emissions = (val * factor) / 1000
                        normalized = f"{val:,.1f} km"
            
            emissions = round(emissions, 2)
            
            # Execute Real-Time Anomaly Detection checks
            if emissions > 50.0:
                comment = 'Auto-flagged: Emissions volume unusually high (> 50t) after manual edit.'
                status_val = 'Pending'
            elif emissions <= 0.0:
                comment = 'Auto-flagged: Suspiciously low or zero emissions calculated after manual edit.'
                status_val = 'Pending'
            else:
                comment = 'Valid record recalculated after manual raw value update.'
                status_val = 'Pending' # Stays pending until re-approved in review hub
                
        except Exception as e:
            comment = f"Calculation failed during edit normalization: {str(e)}"
            status_val = 'Failed'
            
        record.calc_emissions = emissions
        record.normalized_value = normalized
        record.comment = comment
        record.status = status_val
        record.save()

        # Log change delta in the immutable Audit Trail
        AuditTrail.objects.create(
            record=record,
            user_id="Sai Ganesh",
            action_taken=f"Edited raw value from '{old_val}' to '{new_val}' (Carbon dynamically recalculated).",
            delta={
                "old_raw": old_val,
                "new_raw": new_val,
                "old_normalized": old_normalized,
                "new_normalized": normalized,
                "old_calc_emissions": old_emissions,
                "new_calc_emissions": emissions
            }
        )

        return response.Response(NormalizedRecordSerializer(record).data, status=status.HTTP_200_OK)

class IngestionAPIView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return response.Response(
                {"detail": "X-Tenant-Slug header is required to resolve context."},
                status=status.HTTP_400_BAD_REQUEST
            )

        source_type = request.data.get('source_type')
        uploaded_file = request.FILES.get('file')

        if not source_type or not uploaded_file:
            return response.Response(
                {"detail": "Mandatory parameters 'source_type' and 'file' are missing."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Read bytes to string
            file_content = uploaded_file.read().decode('utf-8')
            uploaded_file.seek(0) # Reset stream pointer so Django can save the file properly
            saved_records = ingest_sustainability_file(
                tenant=tenant,
                file_name=uploaded_file.name,
                source_type=source_type,
                file_content=file_content,
                raw_file=uploaded_file
            )
            return response.Response(
                NormalizedRecordSerializer(saved_records, many=True).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return response.Response(
                {"detail": f"Processing failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class LedgerSummaryAPIView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return response.Response(
                {"detail": "Active tenant context could not be resolved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_records = NormalizedRecord.objects.filter(tenant=tenant, status__in=['Approved', 'Pending'])
        
        # Calculate aggregates
        total = sum(rec.calc_emissions for rec in valid_records)
        scope1 = sum(rec.calc_emissions for rec in valid_records if rec.scope == 'Scope 1')
        scope2 = sum(rec.calc_emissions for rec in valid_records if rec.scope == 'Scope 2')
        scope3 = sum(rec.calc_emissions for rec in valid_records if rec.scope == 'Scope 3')

        return response.Response({
            'total': round(total, 2),
            'scope1': round(scope1, 2),
            'scope2': round(scope2, 2),
            'scope3': round(scope3, 2),
        }, status=status.HTTP_200_OK)
