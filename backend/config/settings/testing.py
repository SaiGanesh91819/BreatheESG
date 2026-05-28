from .base import *

SECRET_KEY = 'django-insecure-testing-secret-key-for-continuous-integration-verification'
DEBUG = False

# Fast in-memory SQLite database for test performance
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable password hashing during test execution to speed up runner
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]
