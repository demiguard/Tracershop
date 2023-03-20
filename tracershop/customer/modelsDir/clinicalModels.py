from typing import Optional, List
import re

import datetime

from django.core.exceptions import ValidationError
from django.db import models
from customer.modelsDir.BaseModels import SubscribeableModel

class Isotope(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  atomName = models.CharField(max_length=30)
  halfTime = models.IntegerField(null=True)
  isotopeNumber = models.IntegerField(null=True) # Protons + neutrons
  symbol = models.CharField(max_length=5, null=True)

def bitmask_dates_decode(bitmask: int) -> List[int]:
  """Encodes a int

  Args:
      bitmask (int): _description_

  Returns:
      List[int]: _description_
  """
  days = []
  for i in range(6):
    if bitmask & (1 << i):
      days.append(i)
  return days

def bitmask_dates_encode(days: List[int]) -> int:
  bitmask: int = 0
  for i in days:
    bitmask |= (1 << i)
  return bitmask


def validate_timestamp(value: Optional[str]):
  if value is not None and re.match(r'\d{2}:\d{2}', value) is not None:
    raise ValidationError("field is not a valid Timestamp")

class Tracer(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  tracerName = models.CharField(max_length=30, unique=True, null=True)
  inUse      = models.BooleanField(default=False)
  isotope = models.ForeignKey(Isotope, on_delete=models.SET_NULL, null=True)

  # Bit map with 1-bit monday, 2-bit tuesday, so 0x1F is weekdays.
  produce_weekdays_dates = models.IntegerField(null=True, default=None) # Bitmap for dates
  produce_weekdays_deadline_hours = models.FloatField(null=True, default=None)

  daily_deadline = models.CharField(max_length=5, null=True, validators=[validate_timestamp], default=None)

  def __str__(self):
    if self.tracerName:
      return self.tracerName
    else:
      return f"This Tracer-{self.ID} have no name. Please fix"

  def allowed_to_order(self, date: datetime.date, closed_dates: dict, now=datetime.datetime.now()) -> bool:
    if closed_dates.get(date.strftime("%Y-%m-%d")):
      print("closed date!")
      return False

    if self.daily_deadline is not None:

      hours_str, min_str = self.daily_deadline.split(':')

      deadlineDateTime = datetime.datetime(
          date.year,
          date.month,
          date.day,
          int(hours_str),
          int(min_str)
        ) - datetime.timedelta(days=1)
      return deadlineDateTime > now

    elif self.produce_weekdays_dates is not None and self.produce_weekdays_deadline_hours is not None:
      available_days = bitmask_dates_decode(self.produce_weekdays_dates)
      if date.weekday() not in available_days:
        return False

      deadline = datetime.datetime(date.year, date.month, date.day) - datetime.timedelta(seconds=3600 * self.produce_weekdays_deadline_hours)
      return deadline > now
    return False



class Procedure(SubscribeableModel):
  ID        = models.AutoField(primary_key=True)
  title     = models.CharField(unique=True, max_length=128)
  baseDosis = models.IntegerField(null=True)
  delay     = models.IntegerField(default=0)
  inUse     = models.BooleanField(default=False)
  tracer    = models.ForeignKey(Tracer, on_delete=models.SET_NULL, null=True)

  def __str__(self):
    return self.title

  class Meta:
    verbose_name = "Procedure"
    verbose_name_plural = "Procedures"
