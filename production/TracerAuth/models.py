from api.ModelsDir.BaseModels import SubscribeableModel

from django.db import models
from django.contrib.auth.models import AbstractBaseUser
# Create your models here.

class User(AbstractBaseUser):
  id = models.AutoField(primary_key=True)
  username = models.CharField(max_length=120, unique=True)
  password = models.CharField(max_length=120)
  
  USERNAME_FIELD = 'username'
  REQUIRED_FIELDS = ['password', 'hospital']

  def __str__(self):
    return self.username