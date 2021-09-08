from django.db import models
from api.ModelsDir.BaseModels import SubscribeableModel

from api.ModelsDir.NetworkModels import Address, Database

class EmailTemplate(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  mailtext = models.TextField(default="")
  descriptions = models.TextField(default="")

class EmailEvent(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  description = models.TextField(default="")

class EmailBoundToEvent(SubscribeableModel):
  ID    = models.AutoField(primary_key=True) 
  event = models.ForeignKey(EmailEvent, on_delete=models.CASCADE)
  email = models.ForeignKey(EmailTemplate, on_delete=models.CASCADE)

  class Meta:
    unique_together = [["event", "email"]]

class ServerConfiguration(SubscribeableModel):
  ID = models.AutoField(primary_key=True)

  ExternalDatabase = models.ForeignKey(Database, on_delete=models.SET_NULL, null=True)
  SMTPServer = models.GenericIPAddressField(default="10.140.209.2")