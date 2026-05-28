import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.core.models import RawIngestionLog, NormalizedRecord, AuditTrail

# Delete Audit Trails
AuditTrail.objects.all().delete()
print("Deleted all AuditTrails")

# Delete Normalized Records
NormalizedRecord.objects.all().delete()
print("Deleted all NormalizedRecords")

# Delete Raw Ingestion Logs
RawIngestionLog.objects.all().delete()
print("Deleted all RawIngestionLogs")
