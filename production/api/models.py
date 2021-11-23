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
  """
    This model describe configurable fields for server oprations
    Fields:
      - ID:             AutoField ~ identifier to get this serverconfiguration, the server configuration retrived is the one with ID = 1
      - ExternalDatabase: modelsDir.networkingModels.Database ~ This is the External database, that communicate with other Tracershop modules
      - SMTPServer: GenericIPAddressField ~ This is the mail server, that handles messages to customers 
      - LegacyMode: BooleanField ~ This handles if the server should consider the legacy server for functionality
  """
  ID = models.AutoField(primary_key=True)

  LegacyMode = models.BooleanField(default=True) # This field decide if the server should take into account the legacy server is running
  ExternalDatabase = models.ForeignKey(Database, on_delete=models.SET_NULL, null=True)
  SMTPServer = models.GenericIPAddressField(default="10.140.209.2")