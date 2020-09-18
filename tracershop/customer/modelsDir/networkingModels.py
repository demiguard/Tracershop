from django.db import models
from django.db.models import Model

class Address(Model):
  ID   = models.AutoField(primary_key=True)
  ip   = models.CharField(max_length=30, null=True)
  port = models.CharField(max_length=6, null=True) 
  description = models.CharField(max_length=120,null=True)

  def __str__(self):
    if self.description:
      return self.description
    else:
      return "This Address does not have a description please fix"

class Database(Model):
  databaseName = models.CharField(max_length=32, primary_key=True)
  username = models.CharField(max_length=32)
  password = models.CharField(max_length=32, null=True)
  address  = models.ForeignKey(
    Address,
    on_delete=models.SET_NULL,
    null=True
  )

  def __str__(self):
    return self.databaseName

class AET(Model):
  AET = models.CharField(primary_key=True, max_length=16)
  address = models.ForeignKey(
    Address,
    on_delete=models.SET_NULL,
    null=True
  )
  def __str__(self):
    self.AET