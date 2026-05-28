from rest_framework import viewsets, views, status, response
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
        """Action endpoint to forcefully edit raw values (overriding standard audit controls)."""
        new_val = request.data.get('raw_value')
        if not new_val:
            return response.Response({"detail": "raw_value is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        record = self.get_object()
        old_val = record.raw_value
        record.raw_value = new_val
        record.save()

        # Log action to transaction audit log
        AuditTrail.objects.create(
            record=record,
            user_id="Sai Ganesh",
            action_taken=f"Forcefully edited raw value from '{old_val}' to '{new_val}'."
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
