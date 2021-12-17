from django.test import TestCase
from django.http import HttpResponse, JsonResponse

from datetime import time

from lib import ProductionJSON as PJSON
from lib import ProductionDataClasses as DC
from typing import Dict


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


  def test_RunDataClassEncoding(self):
    timeInstance = time(11,33,22)

    dataClass = DC.RunsDataClass(1, timeInstance, 1)

    datastring = PJSON.encode(dataClass)
    self.assertEqual(datastring, "\"{\\n  \\\"day\\\": 1,\\n  \\\"ptime\\\": \\\"11:33:22\\\",\\n  \\\"run\\\": 1\\n}\"")
    
  def test_DecodingToDict(self):
    jsonStr = "\"{\\n  \\\"day\\\": 1,\\n  \\\"ptime\\\": \\\"11:33:22\\\",\\n  \\\"run\\\": 1\\n}\""
    dataDict = PJSON.decode(jsonStr)
    self.assertEqual(type(dataDict), dict)
    self.assertIn("day", dataDict)
    self.assertIn("ptime", dataDict)
    self.assertIn("run", dataDict)

    self.assertEqual(dataDict["day"], 1)
    self.assertEqual(dataDict["ptime"], "11:33:22")
    self.assertEqual(dataDict["run"], 1)

    # Final step is in tests_ProductionDataClasses
  

