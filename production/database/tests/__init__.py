
# Python standard library
from datetime import date
from unittest.mock import MagicMock, patch

# Third party imports
from django.test import TestCase

# Tracershop imports
from database.models import ClosedDate
from database.utils import can_be_saved

class DatabaseTests(TestCase):
  """These are the tests I could not figure out where should go"""

  def test_can_be_saved_cleans_model(self):
    model = ClosedDate()

    self.assertFalse(can_be_saved(model))
    model.close_date = "38765903267" #type: ignore
    self.assertFalse(can_be_saved(model))

    model.close_date = "2025-07-07" #type: ignore
    self.assertTrue(can_be_saved(model))

    self.assertIsNone(model.id)
    self.assertEqual(model.close_date, date(2025,7,7))
