import csv
import io
import re
from datetime import datetime
from django.core.exceptions import ValidationError
from ..models import Facility, NormalizedRecord

def parse_sap_csv(tenant, file_content):
    """
    Parses an SAP CSV file containing raw fuel and procurement transactions.
    Resolves German/English headers, maps facilities, handles unit conversions,
    applies fuel density factors, and computes final carbon emissions (t CO2e).
    """
    records_to_create = []
    
    # Read the content as CSV
    stream = io.StringIO(file_content)
    reader = csv.DictReader(stream)
    
    # Standardize column mappings (German & English aliases)
    header_mappings = {
        'date': ['datum', 'date', 'billing date', 'buchungsdatum'],
        'facility': ['werk', 'plant', 'facility', 'betriebsstätte'],
        'fuel': ['kraftstoffart', 'fuel type', 'fuel', 'kraftstoff'],
        'volume': ['kraftstoffmenge', 'volume', 'quantity', 'menge'],
        'unit': ['einheit', 'unit', 'mengeneinheit']
    }

    # Find the actual headers present in the file
    file_headers = reader.fieldnames
    mapped_headers = {}

    for standard_key, aliases in header_mappings.items():
        for header in file_headers:
            if header.strip().lower() in aliases:
                mapped_headers[standard_key] = header
                break
    
    # Ensure mandatory columns exist
    mandatory = ['date', 'facility', 'fuel', 'volume', 'unit']
    for col in mandatory:
        if col not in mapped_headers:
            raise ValidationError(f"Mandatory column matching '{col}' was not found in the CSV.")

    # Density & emission factors (Industrial standards)
    DENSITY_FACTORS = {
        'diesel': 0.84,      # kg/L
        'benzin': 0.74,      # kg/L (Petrol)
        'strom': 1.0,        # Electricity (no density)
    }

    EMISSION_FACTORS = {
        'diesel': 3.15,      # kg CO2e / kg fuel
        'benzin': 3.10,      # kg CO2e / kg fuel
        'strom': 0.35        # kg CO2e / kWh
    }

    for row_idx, row in enumerate(reader, start=1):
        raw_date = row[mapped_headers['date']].strip()
        raw_facility = row[mapped_headers['facility']].strip()
        raw_fuel = row[mapped_headers['fuel']].strip()
        raw_volume = row[mapped_headers['volume']].strip().replace(',', '')
        raw_unit = row[mapped_headers['unit']].strip()

        # Initialize base model variables
        status = 'Pending'
        comment = ''
        calc_emissions = 0.0
        normalized_val = 'N/A'

        # 1. Validate Date format (Matches the Stitch design dirty row rejection!)
        parsed_date_str = raw_date
        try:
            # Check YYYY-MM-DD format
            parts = [int(p) for p in re.findall(r'\d+', raw_date)]
            if len(parts) >= 3:
                year, month, day = parts[0], parts[1], parts[2]
                if month > 12 or month < 1 or day > 31 or day < 1:
                    raise ValueError("Invalid month or day range")
                datetime(year, month, day)
            else:
                raise ValueError("Incomplete date segment")
        except ValueError:
            status = 'Failed'
            comment = f"Row {row_idx}: Invalid date format '{raw_date}' rejected."

        # 2. Parse volume to float
        try:
            volume_val = float(raw_volume)
        except ValueError:
            status = 'Failed'
            comment += f" Row {row_idx}: Volume value '{raw_volume}' is not numeric."
            volume_val = 0.0

        # 3. Lookup facility plant mapping
        facility_obj = None
        if status != 'Failed':
            # Search both by code (e.g. Werk-MUC) or by name
            facility_obj = Facility.objects.filter(tenant=tenant, code=raw_facility).first()
            if not facility_obj:
                facility_obj = Facility.objects.filter(tenant=tenant, name=raw_facility).first()
            
            if not facility_obj:
                # Implicitly create or link it
                facility_obj = Facility.objects.create(
                    tenant=tenant,
                    code=f"Werk-{raw_facility[:4].upper()}",
                    name=raw_facility
                )

        # 4. Perform carbon accounting equations
        fuel_key = raw_fuel.lower()
        matched_fuel = None
        for key in EMISSION_FACTORS.keys():
            if key in fuel_key:
                matched_fuel = key
                break

        valid_units = ['l', 'liter', 'liters', 'kg', 'kilo', 'kwh']
        if raw_unit.lower() not in valid_units:
            status = 'Failed'
            comment += f" Row {row_idx}: Unknown or invalid unit '{raw_unit}' rejected."

        if status != 'Failed':
            if matched_fuel:
                density = DENSITY_FACTORS.get(matched_fuel, 1.0)
                factor = EMISSION_FACTORS[matched_fuel]

                if matched_fuel == 'strom': # Electricity
                    normalized_val = f"{volume_val} kWh"
                    # emissions = kWh * factor / 1000 (tonnes CO2)
                    calc_emissions = (volume_val * factor) / 1000
                else: # Fuel density calculations
                    mass_kg = volume_val * density
                    normalized_val = f"{mass_kg:,.2f} kg"
                    calc_emissions = (mass_kg * factor) / 1000
            else:
                status = 'Failed'
                comment += f" Row {row_idx}: Unrecognized fuel type '{raw_fuel}'. Cannot apply general combustion defaults safely."
                calc_emissions = 0.0

        # Construct database record dict
        records_to_create.append({
            'source': 'SAP ERP',
            'source_icon': 'database',
            'ingest_date': parsed_date_str,
            'scope': 'Scope 1' if matched_fuel != 'strom' else 'Scope 2',
            'raw_value': f"{volume_val:,.1f} {raw_unit} {raw_fuel}",
            'normalized_value': normalized_val,
            'calc_emissions': round(calc_emissions, 2),
            'status': status,
            'comment': comment,
            'facility': facility_obj
        })

    return records_to_create
