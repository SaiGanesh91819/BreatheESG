from .base import *

# Security parameters loaded from .env via load_dotenv() in manage.py
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-development-key-default-3c800be7-4568')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Development Database (SQLite for easy prototyping)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS configuration for local React development (typically runs on port 5173)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True
