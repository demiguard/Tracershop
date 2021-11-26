from django.test import TestCase
from django.http import HttpResponse, JsonResponse

from datetime import time

from lib import ProductionJSON as PJSON
from lib import ProductionDataClasses as DC

class ProductionJSONResponseTestCase(TestCase):
  json_kw_1 = "kw_1"
  
  def setUp(self):
    pass

  def test_createEmptyJsonResponse(self):
    response = PJSON.ProductionJSONResponse({})
    self.assertTrue(True) # Trivial assertion since what we test if the create the Response

  def test_CorrectSubClassAssignment(self):
    self.assertTrue(issubclass(PJSON.ProductionJSONResponse, JsonResponse))
    self.assertTrue(issubclass(PJSON.ProductionJSONResponse, HttpResponse))
  
  def test_CustomDataClass(self):
    timeInstance = time(11,55,33,12345)

    response = PJSON.ProductionJSONResponse({
      self.json_kw_1 : DC.RunsDataClass(1, timeInstance, 1)
    })
