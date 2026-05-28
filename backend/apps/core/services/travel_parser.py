import csv
import io
import math
from django.core.exceptions import ValidationError
from ..models import Facility, NormalizedRecord

# Offline Geodetic Coordinate Lookup Dictionary for major airport hubs
AIRPORT_COORDINATES = {
    'JFK': (40.6413, -73.7781), # New York
    'LHR': (51.4700, -0.4543),  # London Heathrow
    'MUC': (48.3538, 11.7861),  # Munich
    'CDG': (49.0097, 2.5479),   # Paris Charles de Gaulle
    'LAX': (33.9416, -118.4085),# Los Angeles
    'SIN': (1.3644, 103.9915),  # Singapore
    'DXB': (25.2532, 55.3657),  # Dubai
}

def calculate_great_circle_distance(lat1, lon1, lat2, lon2):
    """
    Computes geodetic distance in kilometers between two points on earth
    using the Haversine Great-Circle formula.
    """
    R = 6371.0 # Earth's radius in km

    # Convert coordinates to radians
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)
         
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def parse_travel_csv(tenant, file_content):
    """
    Parses a Concur/Navan flight travel CSV log.
    Extracts airport codes, computes flight route distances, and applies flight class multipliers.
    Also handles Hotel stays and Ground transport.
    """
    records_to_create = []
    
    stream = io.StringIO(file_content)
    reader = csv.DictReader(stream)
    
    # Required columns
    mandatory = ['date', 'category', 'origin', 'destination', 'details', 'metric_value', 'employee_id']
    for col in mandatory:
        if col not in reader.fieldnames:
            raise ValidationError(f"Mandatory column '{col}' is missing in the Corporate Travel CSV.")

    # Flight Class Emission Factors (kg CO2e per passenger-km)
    CLASS_MULTIPLIERS = {
        'economy': 0.15,
        'premium': 0.22,
        'business': 0.29,
        'first': 0.38,
    }

    for row_idx, row in enumerate(reader, start=1):
        raw_date = row['date'].strip()
        category = row['category'].strip().title()
        raw_origin = row['origin'].strip().upper()
        raw_destination = row['destination'].strip().upper()
        details = row['details'].strip()
        metric_value = float(row['metric_value'].strip())
        raw_employee = row['employee_id'].strip()

        status = 'Pending'
        comment = ''
        calc_emissions = 0.0
        normalized_val = 'N/A'
        source_icon = 'flight'

        if category == 'Flight':
            coord_from = AIRPORT_COORDINATES.get(raw_origin)
            coord_to = AIRPORT_COORDINATES.get(raw_destination)

            if not coord_from or not coord_to:
                status = 'Failed'
                comment = f"Missing distance calculation metric. Airport coordinates could not be resolved from raw ticket API payload for route '{raw_origin} ➔ {raw_destination}'."
                distance_km = 0.0
            else:
                distance_km = calculate_great_circle_distance(
                    coord_from[0], coord_from[1],
                    coord_to[0], coord_to[1]
                )
                normalized_val = f"{distance_km:,.1f} km"

            factor = CLASS_MULTIPLIERS.get(details.lower(), 0.15)
            if status != 'Failed':
                calc_emissions = (distance_km * factor) / 1000
            source_icon = 'flight'
            raw_val_str = f"{raw_origin} ➔ {raw_destination} ({details})"

        elif category == 'Hotel':
            # Proxy emission factor: 15.0 kg CO2e per night
            emissions_kg = metric_value * 15.0
            calc_emissions = emissions_kg / 1000
            normalized_val = f"{metric_value} nights"
            source_icon = 'hotel'
            raw_val_str = f"{raw_origin} Hotel Stay ({details})"

        elif category == 'Ground':
            # Proxy emission factor: 0.1 kg CO2e per km
            emissions_kg = metric_value * 0.1
            calc_emissions = emissions_kg / 1000
            normalized_val = f"{metric_value:,.1f} km"
            source_icon = 'directions_car'
            raw_val_str = f"{raw_origin} ➔ {raw_destination} Ground Transport ({details})"
        else:
            status = 'Failed'
            comment = f"Unknown travel category '{category}'"
            raw_val_str = f"Unknown Category: {category}"

        # Resolve facility as a general billing log segment
        facility_obj = Facility.objects.filter(tenant=tenant, code='Concur-Travel').first()
        if not facility_obj:
            facility_obj = Facility.objects.create(
                tenant=tenant,
                code='Concur-Travel',
                name='Corporate Travel Account'
            )

        records_to_create.append({
            'source': 'Concur Travel',
            'source_icon': source_icon,
            'ingest_date': raw_date,
            'scope': 'Scope 3',
            'raw_value': raw_val_str,
            'normalized_value': normalized_val,
            'calc_emissions': round(calc_emissions, 2),
            'status': status,
            'comment': comment,
            'facility': facility_obj
        })

    return records_to_create
