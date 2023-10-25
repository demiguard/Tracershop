


from django.db import models
from database.TracerShopModels.baseModels import TracershopModel, Days
from database.TracerShopModels.networkModels import DicomEndpoint

from django.db.models import IntegerChoices, BigAutoField, SmallIntegerField, TimeField, AutoField, ForeignKey, GenericIPAddressField, PositiveIntegerField, CharField, EmailField, SET_NULL


class DeadlineTypes(models.IntegerChoices):
  daily = 0
  weekly = 1


class Deadline(TracershopModel):
  id = models.BigAutoField(primary_key=True)
  deadline_type = models.SmallIntegerField(choices=DeadlineTypes.choices)
  deadline_time = models.TimeField(null=True, default=None)
  deadline_day = models.SmallIntegerField(choices=Days.choices, null=True, default=True)


class ServerConfiguration(TracershopModel):
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
  id = models.AutoField(primary_key=True)

  SMTPServer = models.GenericIPAddressField(default="10.140.209.2")
  DateRange = models.PositiveIntegerField(default=64)
  AdminPhoneNumber = models.CharField(max_length=32, default="35454147")
  AdminEmail = models.EmailField(max_length=64, default="christoffer.vilstrup.jensen@regionh.dk")
  global_activity_deadline = models.ForeignKey(Deadline,
                                               on_delete=models.SET_NULL,
                                               default=None,
                                               null=True,
                                               related_name="global_activity_deadline")
  global_injection_deadline = models.ForeignKey(Deadline,
                                                on_delete=models.SET_NULL,
                                                default=None,
                                                null=True,
                                                related_name="global_injection_deadline")
  ping_service_ae_tile = models.CharField(max_length=16, default="RHKFATBUK561")
  ris_dicom_endpoint = models.ForeignKey(DicomEndpoint, on_delete=SET_NULL, default=None, null=True)


  @classmethod
  def get(cls):
    return cls.objects.get_or_create(pk=1)[0]