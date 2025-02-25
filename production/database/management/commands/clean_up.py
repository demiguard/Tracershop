# Python Standard library
from datetime import datetime, timedelta
from time import sleep

# Third Party Packages

# Django packages
from django.core.management.base import BaseCommand

# Tracershop modules
from database.TracerShopModels.telemetry_models import MAX_TELEMETRY_AGE_DAYS,\
  TelemetryRecord
from database.models import Booking

def get_expired_bookings(now: datetime):
  deadline = now - timedelta(days=7)

  return Booking.objects.filter(start_date__lte=deadline.date())

def get_expired_telemetry(now: datetime):
  deadline = now - timedelta(days=MAX_TELEMETRY_AGE_DAYS)

  return TelemetryRecord.objects.filter(created__lte=deadline)

def next_clean_date(now: datetime):
  tomorrow = now + timedelta(days=1)
  return datetime(tomorrow.year, tomorrow.month, tomorrow.day,0,1,0)

class Command(BaseCommand):
  def handle(self, *args, **options):
    while True:
      now = datetime.now()

      bookings = get_expired_bookings(now)
      bookings.delete()

      records = get_expired_telemetry(now)
      records.delete()

      sleep_time = next_clean_date(now) - now

      sleep(sleep_time.seconds)
