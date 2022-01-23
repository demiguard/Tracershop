from django.test import TestCase

from lib import Formatting

from datetime import datetime, date, time


class ProductionFormattingUnitTests(TestCase):
  def setUp(self):
    self.test_date = date(1993,11,20)
    self.test_time = time(9,41,20)
    self.test_datetime = datetime(1993, 11, 20, 9, 41, 20)

  def test_mergeDateAndTime(self):
    mergedDateAndTime = Formatting.mergeDateAndTime(self.test_date, self.test_time)
    self.assertEqual(self.test_datetime.year, mergedDateAndTime.year)
    self.assertEqual(self.test_datetime.month, mergedDateAndTime.month)
    self.assertEqual(self.test_datetime.day, mergedDateAndTime.day)
    self.assertEqual(self.test_datetime.hour, mergedDateAndTime.hour)
    self.assertEqual(self.test_datetime.minute, mergedDateAndTime.minute)
    self.assertEqual(self.test_datetime.second, mergedDateAndTime.second)


