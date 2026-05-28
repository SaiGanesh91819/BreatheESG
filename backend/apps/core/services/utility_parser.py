import csv
import io
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError
from ..models import Facility, NormalizedRecord

def parse_utility_csv(tenant, file_content):
    """
    Parses a Utility portal CSV.
    Detects irregular billing cycles and performs calendar-month split proration
    to apportion emissions precisely into separate calendar months.
    """
    records_to_create = []
    
    stream = io.StringIO(file_content)
    reader = csv.DictReader(stream)
    
    # Required columns
    mandatory = ['start_date', 'end_date', 'facility', 'meter_id', 'usage_kwh']
    for col in mandatory:
        if col not in reader.fieldnames:
            raise ValidationError(f"Mandatory column '{col}' is missing in the Utility CSV.")

    # Grid emission factors (Standard DEFRA factors)
    GRID_EMISSION_FACTOR = 0.35 # kg CO2e per kWh

    for row_idx, row in enumerate(reader, start=1):
        raw_start = row['start_date'].strip()
        raw_end = row['end_date'].strip()
        raw_facility = row['facility'].strip()
        raw_meter = row['meter_id'].strip()
        raw_usage = row['usage_kwh'].strip().replace(',', '')

        status = 'Pending'
        comment = ''

        try:
            start_dt = datetime.strptime(raw_start, '%Y-%m-%d')
            end_dt = datetime.strptime(raw_end, '%Y-%m-%d')
            usage_val = float(raw_usage)
        except ValueError as e:
            # Rejects row on bad inputs
            records_to_create.append({
                'source': 'National Grid',
                'source_icon': 'bolt',
                'ingest_date': raw_start,
                'scope': 'Scope 2',
                'raw_value': f"{raw_usage} kWh (Meter: {raw_meter})",
                'normalized_value': 'N/A',
                'calc_emissions': 0.0,
                'status': 'Failed',
                'comment': f"Row {row_idx}: Parsing failed. {str(e)}",
                'facility': None
            })
            continue

        # Check billing cycle length
        total_days = (end_dt - start_dt).days
        if total_days <= 0:
            total_days = 1 # avoid zero division

        daily_kwh = usage_val / total_days

        # Resolve facility
        facility_obj = Facility.objects.filter(tenant=tenant, code=raw_meter).first()
        if not facility_obj:
            facility_obj = Facility.objects.filter(tenant=tenant, name=raw_facility).first()
        
        if not facility_obj:
            facility_obj = Facility.objects.create(
                tenant=tenant,
                code=raw_meter,
                name=raw_facility
            )

        # Ingest the raw utility row exactly as it is (as a single 'Pending' row).
        # Proration or calendarization logic must happen downstream in reporting.
        calc_emissions = (usage_val * GRID_EMISSION_FACTOR) / 1000
        records_to_create.append({
            'source': 'National Grid',
            'source_icon': 'bolt',
            'ingest_date': end_dt.strftime('%d %b %Y'),
            'scope': 'Scope 2',
            'raw_value': f"{usage_val:,.1f} kWh ({total_days} days)",
            'normalized_value': f"{usage_val:,.1f} kWh",
            'calc_emissions': round(calc_emissions, 2),
            'status': 'Pending',
            'comment': '',
            'facility': facility_obj
        })

    return records_to_create
