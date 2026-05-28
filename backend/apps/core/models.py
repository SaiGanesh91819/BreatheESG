from django.db import models

class Tenant(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = 'core_tenant'

    def __str__(self):
        return self.name

class Facility(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='facilities')
    code = models.CharField(max_length=100) # Raw import key, e.g. "Werk-MUC"
    name = models.CharField(max_length=255) # Descriptive title, e.g. "München-01 Plant"

    class Meta:
        db_table = 'core_facility'
        unique_together = ('tenant', 'code')

    def __str__(self):
        return f"{self.name} ({self.code})"

class RawIngestionLog(models.Model):
    SOURCE_TYPES = [
        ('SAP', 'SAP ERP Fuel & Procurement'),
        ('UTILITY', 'Utility Portal Electricity'),
        ('TRAVEL', 'Corporate Travel flights'),
    ]
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='ingestion_logs')
    file_name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPES)
    upload_timestamp = models.DateTimeField(auto_now_add=True)
    raw_file = models.FileField(upload_to='uploads/', null=True, blank=True)

    class Meta:
        db_table = 'core_ingestion_log'

    def __str__(self):
        return f"{self.file_name} ({self.source_type})"

class NormalizedRecord(models.Model):
    STATUS_CHOICES = [
        ('Approved', 'Approved & Locked'),
        ('Suspicious', 'Flagged as Suspicious'),
        ('Failed', 'Processing Failed'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='normalized_records')
    facility = models.ForeignKey(Facility, on_delete=models.SET_NULL, null=True, blank=True, related_name='records')
    raw_log = models.ForeignKey(RawIngestionLog, on_delete=models.SET_NULL, null=True, blank=True, related_name='records')
    
    source = models.CharField(max_length=100) # SAP ERP, National Grid etc.
    source_icon = models.CharField(max_length=100, default='database') # material icon name
    ingest_date = models.CharField(max_length=100) # E.g., "12 Feb 2024"
    scope = models.CharField(max_length=50) # Scope 1, Scope 2, Scope 3
    raw_value = models.CharField(max_length=255) # E.g., "4,500 L Diesel"
    normalized_value = models.CharField(max_length=255, default='N/A') # E.g., "3,780 kg"
    calc_emissions = models.FloatField() # Tonnes of CO2e
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Suspicious')
    comment = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'core_normalized_record'

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        if self.pk:
            original = NormalizedRecord.objects.get(pk=self.pk)
            if original.status == 'Approved' and self.status == 'Approved':
                if original.raw_value != self.raw_value or original.calc_emissions != self.calc_emissions:
                    raise ValidationError("Immutable Error: Cannot modify fields of an Approved record in the ledger.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.source} - {self.scope}: {self.calc_emissions} t CO2e"

class AuditTrail(models.Model):
    record = models.ForeignKey(NormalizedRecord, on_delete=models.CASCADE, related_name='audits')
    timestamp = models.DateTimeField(auto_now_add=True)
    user_id = models.CharField(max_length=255, default='system')
    action_taken = models.CharField(max_length=255)
    delta = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'core_audit_trail'

    def __str__(self):
        return f"{self.timestamp} - {self.action_taken} by {self.user_id}"
