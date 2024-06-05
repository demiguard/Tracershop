"""Tests for lib/utils.py"""

# Third party packages
from django.test import SimpleTestCase

from lib.utils import LFILTER, identity

class UtilsTests(SimpleTestCase):
  def test_identity(self):
    self.assertIs("asdf", identity("asdf"))
    x = {}
    self.assertIs(x, identity(x))

  def test_Lfilter(self):
    self.assertEqual(LFILTER(lambda x: x % 2 == 0, [1,2,3,4]), [2,4])