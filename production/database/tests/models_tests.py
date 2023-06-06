from django.test import TestCase
from django.db.models import CharField

from database.models import User, TracershopModel, Address, Database

# Create your tests here.
class ModelTestCases(TestCase):
  def test_model_name(self):
    # Tests string conversion of models

    # Address
    test_description = "SystemNameAddressPointsAt"
    add_desc = Address(ip='127.0.0.1', port=12345, description=test_description)
    add      = Address(ip='127.0.0.1', port=12345)
    self.assertEqual(str(add_desc), test_description)
    self.assertEqual(str(add), "This Address does not have a description please fix")

    # Database
    test_databaseName = "testDatabase"
    database = Database(databaseName=test_databaseName, username="username", password="password", address=add_desc)
    self.assertEqual(str(database), test_databaseName)

    # User
    testUserName="testUser"
    user= User(username=testUserName)
    self.assertEqual(str(user), testUserName)

  def test_Subscription(self):
    class testModel(TracershopModel):
      testField = CharField(max_length=16)

    testFieldValue = "Foo"
    testFieldValue2 = "Bar"

    tm = testModel(testField=testFieldValue)
    self.assertEqual(tm["testField"], testFieldValue)
    tm["testField"] = testFieldValue2
    self.assertEqual(tm["testField"], testFieldValue2)

    self.assertRaises(KeyError, tm.__getitem__, "NotAField")
    self.assertRaises(KeyError, tm.__setitem__, "NotAField", testFieldValue2)

  def test_abstractSubscription(self):
    self.assertRaises(TypeError,TracershopModel)