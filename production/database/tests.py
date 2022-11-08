from django.test import TestCase
from django.db.models import CharField

from database.models import User, SubscribableModel, Address, Database, Tracer, Booking, Location, Procedure


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

    #Tracer
    test_tracerName = "tracerName"
    namelessTracer = Tracer()
    tracer = Tracer(name=test_tracerName)
    self.assertEqual(str(namelessTracer),"Tracer object (None)")
    self.assertEqual(str(tracer), test_tracerName)

    #Procedure
    test_ProcedureTitle = "TestTitle"
    procedure = Procedure(title=test_ProcedureTitle)
    self.assertEqual(str(procedure), test_ProcedureTitle)

    #Location
    test_RoomCode = "kva-02122"
    test_LocationName = "Room 3"
    loc = Location(roomCode=test_RoomCode)
    loc_name = Location(roomCode = test_RoomCode, locName=test_LocationName)
    self.assertEqual(str(loc), test_RoomCode)
    self.assertEqual(str(loc_name), test_LocationName)

    #Booking
    test_accessionNumber = "REGH1239511"
    testBooking = Booking(accessionNumber=test_accessionNumber)
    self.assertEqual(str(testBooking), test_accessionNumber)

    # User
    testUserName="testUser"
    user= User(username=testUserName)
    self.assertEqual(str(user), testUserName)

  def test_Subscription(self):
    class testModel(SubscribableModel):
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
    self.assertRaises(TypeError,SubscribableModel)