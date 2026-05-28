from .base import *

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = False

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Production Database (Prefers PostgreSQL, fallbacks gracefully to SQLite if not provided)
import sys
import urllib.parse

# Basic database setting (psycopg2 used in production.txt requirements)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

db_url = os.getenv('DATABASE_URL')
if db_url:
    try:
        # Simple parser for database URL in case database_url is provided
        url = urllib.parse.urlparse(db_url)
        DATABASES['default'] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': url.path[1:],
            'USER': url.username,
            'PASSWORD': url.password,
            'HOST': url.hostname,
            'PORT': url.port or 5432,
        }
    except Exception as e:
        print(f"Error parsing DATABASE_URL: {e}. Falling back to SQLite3.", file=sys.stderr)

# Secure header settings
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False') == 'True'
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', 0))

# CORS configs in production
CORS_ALLOW_ALL_ORIGINS = True # Or configure specific origins via ALLOWED_HOSTS
