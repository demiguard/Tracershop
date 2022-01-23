from api.ModelsDir.BaseModels import SubscribeableModel

from django.db import models
from django.contrib.auth.models import AbstractBaseUser
# Create your models here.

class User(AbstractBaseUser):
  id = models.AutoField(primary_key=True)
  username = models.CharField(max_length=120, unique=True)
  password = models.CharField(max_length=120)
  
  # This number overlaps with Users.id field of the old database.
  # Note for user in this database and not in the other database,
  # this field is an auto incremented with an offset of 10000.
  # However it should be ensured with appilcation level code, Sorry.
  OldTracerBaseID = models.IntegerField(unique=True) 
  
  USERNAME_FIELD = 'username'
  REQUIRED_FIELDS = ['password', 'hospital']

  def __str__(self):
    return self.username