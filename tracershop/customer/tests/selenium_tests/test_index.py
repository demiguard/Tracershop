from django.test import TestCase
from selenium import webdriver
from customer.tests.lib import backend_database_factory


"""
  This is the test file for the index site to Tracershop


"""

class IndexTest(TestCase):

  @classmethod
  def setUpTestData(cls):
    backend_database_factory.create_test_backend()

  @classmethod
  def tearDownClass(cls):
    backend_database_factory.destroy_test_backend()

  def setUp(self):
    pass

  def tearDown(self):
    pass

  