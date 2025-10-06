"""This file is a small scripts that clean up old models instances

Now this is simple enough, but when this gets too complicated, just write a
clean_up method on TracershopModel, which returns all the models to be deleted

Also please name the service tracershop_clean_up

"""

# Python Standard library
from logging import getLogger
from datetime import datetime, timedelta
from time import sleep

# Third Party Packages

# Django packages
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db.models.manager import BaseManager

# Tracershop modules
from constants import CLEAN_UP_LOGGER
from database.TracerShopModels.telemetry_models import MAX_TELEMETRY_AGE_DAYS,\
  TelemetryRecord
from database.models import Booking
from database.utils import retryDecorator

@retryDecorator
def get_expired_bookings(now: datetime) -> BaseManager[Booking]:
  deadline = now - timedelta(days=7)
  return Booking.objects.filter(start_date__lte=deadline.date())

@retryDecorator
def get_expired_telemetry(now: datetime) -> BaseManager[TelemetryRecord]:
  deadline = now - timedelta(days=MAX_TELEMETRY_AGE_DAYS)
  return TelemetryRecord.objects.filter(created__lte=deadline)

def next_clean_date(now: datetime):
  tomorrow = now + timedelta(days=1)
  return timezone.make_aware(datetime(tomorrow.year, tomorrow.month, tomorrow.day,0,1,0))

class Command(BaseCommand):
  def handle(self, *args, **options):
    logger = getLogger(CLEAN_UP_LOGGER)
    logger.info("Starting Clean up strip!")
    while True:
      now = timezone.now()

      # Bookings have person identifiable information, hence must be deleted!
      bookings: BaseManager[Booking] = get_expired_bookings(now)
      logger.info(f"Deleting {len(bookings)} Bookings")
      bookings.delete()

      # Old records don't give an up to date information on the performance of
      records: BaseManager[TelemetryRecord] = get_expired_telemetry(now)
      logger.info(f"Deleting {len(bookings)} Telemetry records!")
      records.delete()

      sleep_time = next_clean_date(now) - now

      sleep(sleep_time.seconds)
