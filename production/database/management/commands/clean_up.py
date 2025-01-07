# Python Standard library
from datetime import datetime, timedelta
from time import sleep

# Third Party Packages

# Django packages
from django.core.management.base import BaseCommand

# Tracershop modules
from database.models import Booking

def get_expired_bookings(now: datetime):
  deadline = now - timedelta(days=7)

  return Booking.objects.filter(start_date__lte=deadline.date())


def next_clean_date(now: datetime):
  tomorrow = now + timedelta(days=1)
  return datetime(tomorrow.year, tomorrow.month, tomorrow.day,0,1,0)

class Command(BaseCommand):
  def handle(self, *args, **options):
    while True:
      now = datetime.now()

      bookings = get_expired_bookings(now)
      bookings.delete()

      sleep_time = next_clean_date(now) - now

      sleep(sleep_time.seconds)
