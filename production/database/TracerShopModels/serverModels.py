# Python Standard Library
import re
import subprocess

# Third party Packages
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Index, SET_NULL
from django.utils.translation import gettext_lazy

# Tracershop Modules
from database.TracerShopModels.baseModels import TracershopModel, Days
from database.TracerShopModels.networkModels import DicomEndpoint

class DeadlineTypes(models.IntegerChoices):
  daily = 0
  weekly = 1

class Deadline(TracershopModel):
  id = models.BigAutoField(primary_key=True)
  deadline_type = models.SmallIntegerField(choices=DeadlineTypes.choices)
  deadline_time = models.TimeField(null=True, default=None)
  deadline_day = models.SmallIntegerField(choices=Days.choices, null=True, default=True)

class ServerLogLevels(models.IntegerChoices):
  warning = 1
  error = 2
  critical = 3

class ServerLog(TracershopModel):
  id = models.BigAutoField(primary_key=True)
  created = models.DateTimeField(auto_now_add=True)
  message = models.CharField(max_length=1024)
  level = models.SmallIntegerField(choices=ServerLogLevels.choices)

  class Meta:
    indexes = [
      Index(fields=['created'])
    ]

class Printer(TracershopModel):
  """This class represent a printer that can be printed from

  """
  id = models.AutoField(primary_key=True)
  name = models.CharField(max_length=48, unique=True, blank=False)
  ip = models.GenericIPAddressField()
  port = models.PositiveSmallIntegerField(default=9100)
  label_printer = models.BooleanField(default=False)

  valid_printer_names = re.compile(r'^[a-zA-Z0-9æøåÆØÅ]+$')

  def clean(self) -> None:
    if self.valid_printer_names.fullmatch(self.name) is None:
      raise ValidationError(
        {'name': gettext_lazy("Name can only consists of normal characters")}
      )

  @property
  def installed(self):
    from lib.printing import is_printer_installed
    return is_printer_installed(self)

  def save(self, *args, **kwargs):
    if self.valid_printer_names.fullmatch(self.name) is None:
      raise ValidationError(
        {'name': gettext_lazy("Name can only consists of normal characters")}
      )

    super().save(*args, **kwargs)


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
