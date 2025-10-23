"""This module tests the file database/TracerShopModels/networkModels.py"""

# Python standard library

# Third party Packages
from django.test import SimpleTestCase

# Tracershop Packages
from database.TracerShopModels.networkModels import Address, DicomEndpoint

class NetworkModelTests(SimpleTestCase):
  def test_string_conversions(self):
    self.assertEqual(str(Address(ip='127.0.0.1', port="5000")), "127.0.0.1:5000")
    self.assertEqual(str(Address(ip='127.0.0.1', port="5000", description="hello world")), "hello world")
    self.assertEqual(str(
      DicomEndpoint(
        address=Address(ip='127.0.0.1', port="5000"),
        ae_title="BLABLA"
      )), "BLABLA - 127.0.0.1:5000")
