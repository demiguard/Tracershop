from django.test import TestCase

from lib import Formatting

from datetime import datetime, date, time


class ProductionFormattingUnitTests(TestCase):
  def setUp(self):
    self.test_date_with0s = date(1993,1,1)
    self.test_date = date(1993,11,20)
    self.test_time = time(9,41,20)
    self.test_datetime = datetime(1993, 11, 20, 9, 41, 20)
    self.test_DatetimeStrJS = "1993-11-20T09:41:20"
    self.test_DatetimeStr = "1993-11-20 09:41:20"

  def test_mergeDateAndTime(self):
    mergedDateAndTime = Formatting.mergeDateAndTime(self.test_date, self.test_time)
    self.assertEqual(self.test_datetime.year, mergedDateAndTime.year)
    self.assertEqual(self.test_datetime.month, mergedDateAndTime.month)
    self.assertEqual(self.test_datetime.day, mergedDateAndTime.day)
    self.assertEqual(self.test_datetime.hour, mergedDateAndTime.hour)
    self.assertEqual(self.test_datetime.minute, mergedDateAndTime.minute)
    self.assertEqual(self.test_datetime.second, mergedDateAndTime.second)

  def test_dateConverter(self):
    self.assertEqual(Formatting.dateConverter(self.test_date), "1993-11-20")
    self.assertEqual(Formatting.dateConverter(self.test_date, Format="%Y/%m/%d"), "1993/11/20")
    self.assertEqual(Formatting.dateConverter(self.test_date_with0s, Format="%Y/%m/%d"), "1993/01/01")

  def test_toTime(self):
    self.assertEqual(Formatting.toTime("12:11:34"), time(12,11,34))

  def test_FormatJStoSQL(self):
    self.assertEqual(Formatting.FormatDateTimeJStoSQL(self.test_DatetimeStrJS), self.test_DatetimeStr)
    self.assertEqual(Formatting.FormatDateTimeJStoSQL(self.test_DatetimeStr), self.test_DatetimeStr)
    self.assertRaises(ValueError, Formatting.FormatDateTimeJStoSQL, "Not a datetime format")


  def test_ParseSQLFIELD(self):
    self.assertEqual(Formatting.ParseSQLField("field"),"field")
    self.assertEqual(Formatting.ParseSQLField("table.field"),"field")
    self.assertRaises(ValueError, Formatting.ParseSQLField, "schema.table.field") # There might be some schema.table.row but I don't use that
