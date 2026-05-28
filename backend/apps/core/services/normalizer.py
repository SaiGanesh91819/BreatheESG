from django.db import transaction
from django.core.exceptions import ValidationError
from ..models import RawIngestionLog, NormalizedRecord, AuditTrail
from .sap_parser import parse_sap_csv
from .utility_parser import parse_utility_csv
from .travel_parser import parse_travel_csv

@transaction.atomic
def ingest_sustainability_file(tenant, file_name, source_type, file_content, raw_file=None):
    """
    Core orchestrator service. Ingests raw files, dispatches to sub-parsers,
    creates database NormalizedRecords, and registers initial audit timelines.
    """
    # 1. Log the Raw Ingestion file receipt
    ingest_log = RawIngestionLog.objects.create(
        tenant=tenant,
        file_name=file_name,
        source_type=source_type,
        raw_file=raw_file
    )

    # 2. Dispatch to dedicated parsing algorithms based on source type
    parsed_records = []
    
    if source_type == 'SAP':
        parsed_records = parse_sap_csv(tenant, file_content)
    elif source_type == 'UTILITY':
        parsed_records = parse_utility_csv(tenant, file_content)
    elif source_type == 'TRAVEL':
        parsed_records = parse_travel_csv(tenant, file_content)
    else:
        raise ValidationError(f"Unsupported source type '{source_type}' provided.")

    saved_records = []

    # 3. Create database entries and transaction audit logs
    for item in parsed_records:
        # Auto-Anomaly Detection (Assigns Probable Status in UI, but keeps Pending in DB)
        if item['calc_emissions'] > 50.0:
            item['comment'] = 'Auto-flagged: Emissions volume unusually high (> 50t).'
        elif item['calc_emissions'] <= 0.0 and item['status'] != 'Failed':
            item['comment'] = 'Auto-flagged: Suspiciously low or zero emissions calculated.'

        record_obj = NormalizedRecord.objects.create(
            tenant=tenant,
            facility=item['facility'],
            raw_log=ingest_log,
            source=item['source'],
            source_icon=item['source_icon'],
            ingest_date=item['ingest_date'],
            scope=item['scope'],
            raw_value=item['raw_value'],
            normalized_value=item['normalized_value'],
            calc_emissions=item['calc_emissions'],
            status=item['status'],
            comment=item['comment']
        )
        
        # Log initial Ingestion timelines in compliance with ESG standards
        AuditTrail.objects.create(
            record=record_obj,
            user_id="Sai Ganesh",
            action_taken=f"Raw data parsed from {source_type} file '{file_name}'"
        )

        if record_obj.status == 'Failed':
            AuditTrail.objects.create(
                record=record_obj,
                user_id="System normalizer",
                action_taken=f"Processing failed: {record_obj.comment}"
            )
        elif record_obj.status == 'Suspicious':
            AuditTrail.objects.create(
                record=record_obj,
                user_id="System normalizer",
                action_taken=f"Flagged: {record_obj.comment}"
            )
        elif record_obj.status == 'Pending':
            AuditTrail.objects.create(
                record=record_obj,
                user_id="System normalizer",
                action_taken="Ingested successfully. Pending manual verification in Data Review Hub."
            )
        else: # Standard approved
            AuditTrail.objects.create(
                record=record_obj,
                user_id="Sai Ganesh",
                action_taken="Approved and committed to ledger segment."
            )

        saved_records.append(record_obj)

    return saved_records
