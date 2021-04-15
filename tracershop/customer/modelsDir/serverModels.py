from django.db import models
from django.db.models import Model

from customer.modelsDir.networkingModels import Database

class ServerConfiguration(Model):
  ID = models.AutoField(primary_key=True)
  ExternalDatabase = models.ForeignKey(Database, on_delete=models.SET_NULL, blank=True, null=True)