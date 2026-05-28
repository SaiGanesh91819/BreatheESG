from rest_framework import serializers
from .models import Tenant, Facility, NormalizedRecord, AuditTrail, RawIngestionLog

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'slug']

class FacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Facility
        fields = ['id', 'code', 'name']

class RawIngestionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawIngestionLog
        fields = ['id', 'file_name', 'source_type', 'upload_timestamp']

class AuditTrailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditTrail
        fields = ['id', 'timestamp', 'user_id', 'action_taken', 'delta']

class NormalizedRecordSerializer(serializers.ModelSerializer):
    facility = FacilitySerializer(read_only=True)
    auditTrail = AuditTrailSerializer(source='audits', many=True, read_only=True)
    rawLog = RawIngestionLogSerializer(source='raw_log', read_only=True)
    sourceIcon = serializers.CharField(source='source_icon', read_only=True)
    ingestDate = serializers.CharField(source='ingest_date', read_only=True)
    rawValue = serializers.CharField(source='raw_value', read_only=True)
    normalizedValue = serializers.CharField(source='normalized_value', read_only=True)
    calcEmissions = serializers.FloatField(source='calc_emissions', read_only=True)

    class Meta:
        model = NormalizedRecord
        fields = [
            'id',
            'source',
            'sourceIcon',
            'ingestDate',
            'scope',
            'rawValue',
            'normalizedValue',
            'calcEmissions',
            'status',
            'comment',
            'facility',
            'auditTrail',
            'rawLog'
        ]
