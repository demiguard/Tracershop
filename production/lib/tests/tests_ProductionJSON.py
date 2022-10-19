from doctest import testmod
from django.test import TestCase
from django.http import HttpResponse, JsonResponse
from django.db import models

from datetime import time

from lib import ProductionJSON as PJSON
from lib import ProductionDataClasses as DC
from typing import Dict


# Very lackluster testing :(

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
      self.json_kw_1 : DC.RunsDataClass(1, timeInstance, 1, 123)
    })


  def test_RunDataClassEncoding(self):
    timeInstance = time(11,33,22)

    dataClass = DC.RunsDataClass(1, timeInstance, 1,123)

    datastring = PJSON.encode(dataClass)
    self.assertEqual(datastring, "\"{\\n  \\\"day\\\": 1,\\n  \\\"ptime\\\": \\\"11:33:22\\\",\\n  \\\"run\\\": 1,\\n  \\\"PTID\\\": 123\\n}\"")

  def test_DecodingToDict(self):
    jsonStr = "\"{\\n  \\\"day\\\": 1,\\n  \\\"ptime\\\": \\\"11:33:22\\\",\\n  \\\"run\\\": 1,\\n  \\\"PTID\\\": 123\\n}\""
    dataDict = PJSON.decode(jsonStr)
    self.assertEqual(type(dataDict), dict)
    self.assertIn("day", dataDict)
    self.assertIn("ptime", dataDict)
    self.assertIn("run", dataDict)

    self.assertEqual(dataDict["day"], 1)
    self.assertEqual(dataDict["ptime"], "11:33:22")
    self.assertEqual(dataDict["run"], 1)

    # Final step is in tests_ProductionDataClasses

  def test_model_encoding(self):
    # This is a sharp edge of program, see when a program sends a message to the server
    # There's a regis database layer. Now this database can only accept, standard dict or objects.
    # Which these model classes are too complicated for. Therefore this test is kinda pointless
    # Since in any case where this code runs, the regis layer is gonna throw an error.
    # Never the less, this is a shortcomming of regis not my program.
    # No shade, Regis is an amazing piece of software
    class testModel(models.Model):
      ID = models.IntegerField(primary_key=True)

    tm = testModel(ID=3)

    self.assertEqual(PJSON.encode(tm), '\"{\\\"model\\\": \\\"lib.testmodel\\\", \\\"pk\\\": 3, \\\"fields\\\": {}}\"')

