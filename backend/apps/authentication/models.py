from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    role = models.CharField(max_length=50, default='analyst')

    class Meta:
        db_table = 'auth_user'

    def __str__(self):
        return self.username
