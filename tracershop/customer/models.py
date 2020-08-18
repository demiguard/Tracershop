from django.db import models
from django.db.models import Model

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# Create your models here.

class User(AbstractBaseUser):
  id = models.AutoField(primary_key=True)
  username = models.CharField(max_length=120, unique=True)
  password = models.CharField(max_length=256)
  is_staff = models.BooleanField(default=False)
  is_admin = models.BooleanField(default=False)

  USERNAME_FIELD = 'username'
  REQUIRED_FIELDS = ['password']

  def __str__(self):
    return self.username

class ServerConfiguration(Model):
  pass

