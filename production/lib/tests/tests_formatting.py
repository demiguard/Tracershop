from django.test import TestCase

from lib import formatting

from datetime import datetime, date, time, timezone


class ProductionFormattingUnitTests(TestCase):
  def setUp(self):
    self.test_date_with0s = date(1993,1,1)
    self.test_date = date(1993,11,20)
    self.test_time = time(9,41,20)
    self.test_datetime = datetime(1993, 11, 20, 9, 41, 20)
    self.test_DatetimeStrJS = "1993-11-20T09:41:20"
    self.test_DatetimeStr = "1993-11-20 09:41:20"

  def test_dateConverter(self):
    self.assertEqual(formatting.dateConverter(self.test_date), "1993-11-20")
    self.assertEqual(formatting.dateConverter(self.test_date, format_="%Y/%m/%d"), "1993/11/20")
    self.assertEqual(formatting.dateConverter(self.test_date_with0s, format_="%Y/%m/%d"), "1993/01/01")

  def test_toTime_success(self):
    self.assertEqual(formatting.toTime("12:11:34"), time(12,11,34))
    self.assertEqual(formatting.toTime("12.11.34"), time(12,11,34))
    self.assertEqual(formatting.toTime("121134"), time(12,11,34))

  def test_toDatetime_success(self):
    self.assertEqual(formatting.toDateTime("20250121082111"), datetime(2025,1,21,8,21,11, tzinfo=timezone.utc))
    self.assertEqual(formatting.toDateTime("2025-01-21 08:21:11"), datetime(2025,1,21,8,21,11, tzinfo=timezone.utc))
    self.assertEqual(formatting.toDateTime("2025/01/21 08:21:11"), datetime(2025,1,21,8,21,11, tzinfo=timezone.utc))
    self.assertEqual(formatting.toDateTime("2025/01/21 082111"), datetime(2025,1,21,8,21,11, tzinfo=timezone.utc))
    self.assertEqual(formatting.toDateTime("2025/01/2108:21:11"), datetime(2025,1,21,8,21,11, tzinfo=timezone.utc))

  def test_toDatetime_failure(self):
    self.assertRaises(ValueError, formatting.toDateTime, "225-01-21 08:21:11")
    self.assertRaises(ValueError, formatting.toDateTime, "225/01/21 08:21:11")
    self.assertRaises(ValueError, formatting.toDateTime, "225/01/21 082111")
    self.assertRaises(ValueError, formatting.toDateTime, "225/01/2108:21:11")
    self.assertRaises(ValueError, formatting.toDateTime, "2025/31/01 08:21:11")

  def test_to_time_raises_error(self):
    self.assertRaises(ValueError, formatting.toTime, "24:60:60")
    self.assertRaises(ValueError, formatting.toTime, "99:00:00")
