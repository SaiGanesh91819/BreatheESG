import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.core.models import Tenant, Facility
from django.contrib.auth import get_user_model

User = get_user_model()

def seed():
    print("Starting database seeding (Clean Schema Mode)...")
    
    # 1. Create superuser/default analyst user
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@breatheesg.com', 'admin123')
        print("Created superuser: admin (password: admin123)")
    
    # 2. Create Tenants (Enables multi-tenancy headers switcher in top-bar)
    tenants_data = [
        {'slug': 'uk', 'name': 'Global Retail Corp - UK Facility'},
        {'slug': 'de', 'name': 'Global Retail Corp - Germany Plant'},
        {'slug': 'us', 'name': 'Global Retail Corp - US HQ'}
    ]
    
    tenants = {}
    for td in tenants_data:
        tenant, created = Tenant.objects.get_or_create(slug=td['slug'], defaults={'name': td['name']})
        tenants[td['slug']] = tenant
        if created:
            print(f"Created Tenant: {tenant.name}")

    # 3. Create Facilities for UK (Pre-configures plant resolvers for your uploads)
    facilities_data = [
        {'tenant_slug': 'uk', 'code': 'Werk-MUC', 'name': 'München-01 Plant'},
        {'tenant_slug': 'uk', 'code': 'Werk-BER', 'name': 'Berlin-HQ Office'},
        {'tenant_slug': 'uk', 'code': 'Meter-UK-04', 'name': 'National Grid UK Meter'},
        {'tenant_slug': 'uk', 'code': 'Concur-Travel', 'name': 'Corporate Travel Account'},
    ]
    
    for fd in facilities_data:
        tenant = tenants[fd['tenant_slug']]
        facility, created = Facility.objects.get_or_create(
            tenant=tenant,
            code=fd['code'],
            defaults={'name': fd['name']}
        )
        if created:
            print(f"Created Facility: {facility.name}")

    print("Database seeding completed. SQLite database is 100% clean of all records and ready for upload!")

if __name__ == '__main__':
    seed()
