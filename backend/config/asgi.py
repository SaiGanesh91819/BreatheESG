import os
from django.core.asgi import get_asgi_application
from dotenv import load_dotenv

# Load env variables in ASGI context
load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

application = get_asgi_application()
