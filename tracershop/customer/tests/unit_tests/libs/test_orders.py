from django.test import TestCase

from customer.lib import orders
from customer.models import Tracer

from datetime import datetime, date, timedelta

class OrdersTestCase(TestCase):
  def setUp(self) -> None:
    #self.tracer: Tracer = Tracer(tracerName="pib")
    #self.tracer.save()
    pass

  def tearDown(self) -> None:
    pass #self.tracer.delete()

  def test_isOrderFDGAvailableForDate(self):
    closedDates = {}

    date_2023_03_15 = date(2023,3,15)
    date_2023_03_16 = date(2023,3,16)
    date_2023_03_17 = date(2023,3,17)
    date_2023_03_20 = date(2023,3,20)

    now_2023_03_17_11_30_00 = datetime(2023,3,17,11,30)
    now_2023_03_16_11_30_00 = datetime(2023,3,16,11,30)
    now_2023_03_15_11_30_00 = datetime(2023,3,15,11,30)

    now_2023_03_17_13_30_00 = datetime(2023,3,17,13,30)
    now_2023_03_16_13_30_00 = datetime(2023,3,16,13,30)
    now_2023_03_15_13_30_00 = datetime(2023,3,15,13,30)

    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_15, closedDates, [0,1,2,3,4], now=now_2023_03_15_11_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_15, closedDates, [0,1,2,3,4], now=now_2023_03_16_11_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_15, closedDates, [0,1,2,3,4], now=now_2023_03_17_11_30_00))

    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_15, closedDates, [0,1,2,3,4], now=now_2023_03_15_13_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_15, closedDates, [0,1,2,3,4], now=now_2023_03_16_13_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_15, closedDates, [0,1,2,3,4], now=now_2023_03_17_13_30_00))

    self.assertTrue(orders.isOrderFDGAvailableForDate(date_2023_03_16, closedDates, [0,1,2,3,4], now=now_2023_03_15_11_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_16, closedDates, [0,1,2,3,4], now=now_2023_03_16_11_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_16, closedDates, [0,1,2,3,4], now=now_2023_03_17_11_30_00))

    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_16, closedDates, [0,1,2,3,4], now=now_2023_03_15_13_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_16, closedDates, [0,1,2,3,4], now=now_2023_03_16_13_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_16, closedDates, [0,1,2,3,4], now=now_2023_03_17_13_30_00))

    self.assertTrue(orders.isOrderFDGAvailableForDate(date_2023_03_17, closedDates, [0,1,2,3,4], now=now_2023_03_15_11_30_00))
    self.assertTrue(orders.isOrderFDGAvailableForDate(date_2023_03_17, closedDates, [0,1,2,3,4], now=now_2023_03_16_11_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_17, closedDates, [0,1,2,3,4], now=now_2023_03_17_11_30_00))

    self.assertTrue(orders.isOrderFDGAvailableForDate(date_2023_03_17, closedDates, [0,1,2,3,4], now=now_2023_03_15_13_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_17, closedDates, [0,1,2,3,4], now=now_2023_03_16_13_30_00))
    self.assertFalse(orders.isOrderFDGAvailableForDate(date_2023_03_17, closedDates, [0,1,2,3,4], now=now_2023_03_17_13_30_00))

    self.assertTrue(orders.isOrderFDGAvailableForDate(date_2023_03_20, closedDates, [0,1,2,3,4], now=now_2023_03_15_13_30_00))
    self.assertTrue(orders.isOrderFDGAvailableForDate(date_2023_03_20, closedDates, [0,1,2,3,4], now=now_2023_03_16_13_30_00))
    self.assertTrue(orders.isOrderFDGAvailableForDate(date_2023_03_20, closedDates, [0,1,2,3,4], now=now_2023_03_17_13_30_00))

  def test_isTOrderAvailableForDate(self):
    closedDates = {}

    date_2023_03_10 = date(2023,3,10) # Friday
    date_2023_03_13 = date(2023,3,13) # Monday
    date_2023_03_16 = date(2023,3,16) # Thursday
    date_2023_03_17 = date(2023,3,17) # Friday
    date_2023_03_20 = date(2023,3,20) # Monday
    date_2023_03_25 = date(2023,3,25) # Friday

    now_2023_03_10_11_30_00 = datetime(2023,3,10,11,30)
    now_2023_03_09_11_30_00 = datetime(2023,3,9,11,30)
    now_2023_03_08_11_30_00 = datetime(2023,3,8,11,30)

    now_2023_03_09_13_30_00 = datetime(2023,3,9,13,30)

    now_2023_03_17_11_30_00 = datetime(2023,3,17,11,30)
    now_2023_03_16_11_30_00 = datetime(2023,3,16,11,30)
    now_2023_03_15_11_30_00 = datetime(2023,3,15,11,30)

    self.assertTrue(orders.isOrderTAvailableForDate(date_2023_03_16, closedDates, now=now_2023_03_08_11_30_00))
    self.assertTrue(orders.isOrderTAvailableForDate(date_2023_03_16, closedDates, now=now_2023_03_09_11_30_00))
    self.assertFalse(orders.isOrderTAvailableForDate(date_2023_03_16, closedDates, now=now_2023_03_10_11_30_00))

    self.assertFalse(orders.isOrderTAvailableForDate(date_2023_03_17, closedDates, now=now_2023_03_15_11_30_00))
    self.assertFalse(orders.isOrderTAvailableForDate(date_2023_03_17, closedDates, now=now_2023_03_16_11_30_00))
    self.assertFalse(orders.isOrderTAvailableForDate(date_2023_03_17, closedDates, now=now_2023_03_17_11_30_00))

    self.assertTrue(orders.isOrderTAvailableForDate(date_2023_03_17, closedDates, now=now_2023_03_08_11_30_00))
    self.assertTrue(orders.isOrderTAvailableForDate(date_2023_03_17, closedDates, now=now_2023_03_09_11_30_00))
    self.assertFalse(orders.isOrderTAvailableForDate(date_2023_03_17, closedDates, now=now_2023_03_09_13_30_00))
    self.assertFalse(orders.isOrderTAvailableForDate(date_2023_03_17, closedDates, now=now_2023_03_10_11_30_00))


