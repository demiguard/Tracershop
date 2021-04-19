from django.db import models
from customer.modelsDir.BaseModels import SubscribeableModel

from customer.modelsDir.networkingModels import Database

class ServerConfiguration(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  ExternalDatabase = models.ForeignKey(Database, on_delete=models.SET_NULL, blank=True, null=True)