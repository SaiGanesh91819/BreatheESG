import csv
import random
from datetime import datetime, timedelta

categories = ['Flight', 'Hotel', 'Ground']
airports = ['JFK', 'LHR', 'MUC', 'CDG', 'LAX', 'SIN', 'DXB']
flight_classes = ['Economy', 'Premium', 'Business', 'First']
ground_types = ['Taxi', 'Train', 'Rental Car']

start_date = datetime(2026, 5, 1)

with open('corporate_travel.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['date', 'category', 'origin', 'destination', 'details', 'metric_value', 'employee_id'])
    
    for i in range(150):
        current_date = start_date + timedelta(days=random.randint(0, 30))
        date_str = current_date.strftime('%Y-%m-%d')
        emp_id = f"EMP-{random.randint(100, 999)}"
        category = random.choice(categories)
        
        if category == 'Flight':
            origin = random.choice(airports)
            destination = random.choice([a for a in airports if a != origin])
            details = random.choice(flight_classes)
            metric_value = 1 # 1 flight
        elif category == 'Hotel':
            origin = random.choice(airports) # City proxy
            destination = origin
            details = "Standard Room"
            metric_value = random.randint(1, 5) # nights
        else:
            origin = "City Center"
            destination = "Airport"
            details = random.choice(ground_types)
            metric_value = random.randint(15, 120) # km distance
            
        writer.writerow([date_str, category, origin, destination, details, metric_value, emp_id])

print("Generated corporate_travel.csv")
