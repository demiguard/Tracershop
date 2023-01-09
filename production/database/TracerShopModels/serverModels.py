from django.db import models
from database.TracerShopModels.baseModels import SubscribableModel
from database.TracerShopModels.networkModels import Database


class ServerConfiguration(SubscribableModel):
  """
    This model describe configurable fields for server operations
    Fields:
      - ID:             AutoField ~ identifier to get this ServerConfiguration, the server configuration retrieved is the one with ID = 1
      - ExternalDatabase: modelsDir.networkingModels.Database ~ This is the External database, that communicate with other Tracershop modules
      - SMTPServer: GenericIPAddressField ~ This is the mail server, that handles messages to customers
      - LegacyMode: BooleanField ~ This handles if the server should consider the legacy server for functionality
      - DateRange: PositiveIntegerField ~ The number of days in one direction that a range should be calculated over, Ie 2*32 = 64 days in total.
      - AdminPhoneNumber: CharField ~ Field for displaying phone number to admin
      - AdminEmail: EmailField ~Field to display email to admin
  """
  ID = models.AutoField(primary_key=True)

  ExternalDatabase = models.ForeignKey(Database, on_delete=models.SET_NULL, null=True)
  SMTPServer = models.GenericIPAddressField(default="10.140.209.2")
  DateRange = models.PositiveIntegerField(default=32)
  AdminPhoneNumber = models.CharField(max_length=32, default="35454147")
  AdminEmail = models.EmailField(max_length=64, default="christoffer.vilstrup.jensen@regionh.dk")