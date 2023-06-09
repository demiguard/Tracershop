from unittest import skip

from django.test import TestCase
from django.conf import settings

from database.production_database.SQLExecuter import ExecuteQuery, Fetching
from database.production_database.SQLFactory import tupleInsertQuery
from tests.helpers import cleanTable


from tracerauth.backend import TracershopAuthenticationBackend, validString
from database.models import User, UserGroups


class TracerAuthBackendTestCase(TestCase):
  OldUserName = "OldUser"
  OldPassword = "OldPassword"

  UserInsertQuery = tupleInsertQuery([
    ("Username", OldUserName),
    ("Id", 751),
    ("Password", OldPassword)
  ], "Users")

  def setUp(self) -> None:
    self.basicUserName = "basicUser"
    self.basicPassword = "basicPassword"

    self.basicUser = User(username=self.basicUserName, UserGroup=UserGroups.ShopUser, OldTracerBaseID=321)
    self.basicUser.set_password(self.basicPassword)
    self.basicUser.save()
    self.backend = TracershopAuthenticationBackend()

  def tearDown(self) -> None:
    self.basicUser.delete()



  # Test Valid Password / usernames
  def test_validString(self):
    self.assertTrue(validString("Helloworld"))
    self.assertTrue(validString("DanskNavnæøå"))

    self.assertFalse(validString("Hello world"))
    self.assertFalse(validString("Something\"; DROP DATABASE DATABASE"))

  def test_Authenticatation_basic(self):
    user = self.backend.authenticate(None, self.basicUserName, self.basicPassword)
    self.assertEqual(user, self.basicUser)

  def test_Authentication_UserDoenstExists(self):
    self.assertIsNone(self.backend.authenticate(None, "JohnDoe", "JohnDoesPW"))

  def test_Authentication_missingPW(self):
    self.assertIsNone(self.backend.authenticate(None, self.basicUserName, ""))

  def test_Authentication_wrongPassword(self):
    self.assertIsNone(self.backend.authenticate(None, self.basicUserName, "WrongPassword"))

  @skip
  def test_Authenticate_OldDatabaseUserMigration(self):
    ExecuteQuery(self.UserInsertQuery, Fetching.NONE)

    user = self.backend.authenticate(None, self.OldUserName, self.OldPassword)
    userFromDB = User.objects.get(username=self.OldUserName)
    self.assertEqual(user, userFromDB)

    # Clean up
    user.delete()
    ExecuteQuery("""DELETE FROM Users WHERE Id=751""", Fetching.NONE )

  def test_GetNoUser(self):
    self.assertIsNone(self.backend.get_user(2340598))