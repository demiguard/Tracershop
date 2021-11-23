from django.db import models
from customer.modelsDir.BaseModels import SubscribeableModel

from customer.modelsDir.networkingModels import Database

class ServerConfiguration(SubscribeableModel):
  """
    This model describe configurable fields for server oprations
    Fields:
      - ID:             AutoField ~ identifier to get this serverconfiguration, the server configuration retrived is the one with ID = 1
      - ExternalDatabase: modelsDir.networkingModels.Database ~ This is the External database, that communicate with other Tracershop modules
      - SMTPServer: GenericIPAddressField ~ This is the mail server, that handles messages to customers 
      - DefaultCalculatorValue: IntegerField ~ this is the standard value for calculator
  """
  ID = models.AutoField(primary_key=True)
  ExternalDatabase = models.ForeignKey(Database, on_delete=models.SET_NULL, blank=True, null=True)
  SMTPServer = models.GenericIPAddressField(default="10.140.209.2")
  DefaultCalculatorValue = models.IntegerField(default=300)