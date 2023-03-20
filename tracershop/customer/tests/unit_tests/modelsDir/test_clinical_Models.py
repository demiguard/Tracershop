from django.test import TestCase

from datetime import datetime, timedelta, date, time

from customer.models import Tracer, Isotope

class ClinicalModelsTestCase(TestCase):
  def setUp(self):
    self.isotope = Isotope()
    self.tracer = Tracer(isotope=self.isotope)

  def tearDown(self) -> None:
    pass

  def test_str_tracer(self):
    self.assertEqual(str(self.tracer), "This Tracer-None have no name. Please fix")

  def test_str_id_names(self):
    tracerName = "Test-tracer"
    self.tracer.tracerName = tracerName
    self.assertEqual(str(self.tracer), tracerName)

  def test_allowed_to_order(self):
    self.tracer.produce_weekdays_dates = 0x7F
    self.tracer.produce_weekdays_deadline_hours = 36.0

    closed_days = {}

    date_order = date(2012,11,21)

    now = datetime(
      2012,11,21,11,10,11
    )

    self.assertFalse(self.tracer.allowed_to_order(date_order, closed_days, now))
    self.assertFalse(self.tracer.allowed_to_order(date_order + timedelta(days=1), closed_days, now))
    self.assertFalse(self.tracer.allowed_to_order(date_order + timedelta(days=-1), closed_days, now))
    self.assertTrue(self.tracer.allowed_to_order(date(2012, 12,1), closed_days, now=now))
    #self.assertTrue(self.tracer.allowed_to_order(date_order + timedelta(days=-2), closed_days, now))

