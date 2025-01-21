from datetime import timedelta

from django.db import models
from django.utils.timezone import now

from database.TracerShopModels.baseModels import TracershopModel

MAX_TELEMETRY_AGE_DAYS = 60

class TelemetryRecordStatus(models.IntegerChoices):
  SUCCESS = 0
  FAILURE = 1

class TelemetryRequests(TracershopModel):
  id = models.BigAutoField(primary_key=True)
  message_key = models.CharField(max_length=120)
  display_name = models.CharField(max_length=128, default="Unnamed message type, please fix!")

class TelemetryRecord(TracershopModel):
  id = models.BigAutoField(primary_key=True)
  request_type = models.ForeignKey(TelemetryRequests, on_delete=models.RESTRICT)
  expire_datetime = models.DateTimeField(
    default= now() + timedelta(days=MAX_TELEMETRY_AGE_DAYS)
  )
  latency_ms = models.FloatField(default=None, null=True)
  status = models.IntegerField(
    choices=TelemetryRecordStatus.choices
  )