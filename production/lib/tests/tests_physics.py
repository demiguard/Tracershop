"""Tests for lib/physics.py"""

# Python standard library
from datetime import time

# Third party packages
from django.test import SimpleTestCase

# Tracershop packages
from lib.physics import countMinutes, decay

class PhysicsTests(SimpleTestCase):
  def test_counting_minutes(self):
    self.assertEqual(countMinutes(time(11,30,00),
                                  time(11,30,1)), 0)
    self.assertEqual(countMinutes(time(11,30,00),
                                  time(10,30,1)), -60)
    self.assertEqual(countMinutes(time(11,30,00),
                                  time(12,30,1)), 60)
    self.assertEqual(countMinutes(time(11,30,00),
                                  time(11,35,1)), 5)
    self.assertEqual(countMinutes(time(11,35,00),
                                  time(11,30,1)), -5)

  def test_decay(self):
    self.assertEqual(decay(3600, 60, 100), 200.0)

