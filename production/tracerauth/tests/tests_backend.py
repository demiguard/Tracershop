from django.test import TestCase, TransactionTestCase


from tracerauth.backend import TracershopAuthenticationBackend, validString
from database.models import User, UserGroups


class TracerAuthBackendTestCase(TransactionTestCase):
  OldUserName = "OldUser"
  OldPassword = "OldPassword"

  def setUp(self) -> None:
    self.basicUserName = "basicUser"
    self.basicPassword = "basicPassword"

    self.basicUser = User(username=self.basicUserName, user_group=UserGroups.ShopUser)
    self.basicUser.set_password(self.basicPassword)
    self.basicUser.save()
    self.backend = TracershopAuthenticationBackend()

  def tearDown(self) -> None:
    self.basicUser.delete()

  #region Tests
  # Test Valid Password / usernames
  def test_validString(self):
    self.assertTrue(validString("Helloworld"))
    self.assertTrue(validString("DanskNavnæøå"))

    self.assertFalse(validString("Hello world"))
    self.assertFalse(validString("Something\"; DROP DATABASE DATABASE"))

  def test_Authentication_basic(self):
    user = self.backend.authenticate(None, self.basicUserName, self.basicPassword)
    self.assertEqual(user, self.basicUser)

  def test_Authentication_UserDoesNotExists(self):
    self.assertIsNone(self.backend.authenticate(None, "JohnDoe", "JohnDoesPW"))

  def test_Authentication_missingPassword(self):
    self.assertIsNone(self.backend.authenticate(None, self.basicUserName, ""))

  def test_Authentication_wrongPassword(self):
    self.assertIsNone(self.backend.authenticate(None, self.basicUserName, "WrongPassword"))

  def test_GetNoUser(self):
    self.assertIsNone(self.backend.get_user(2340598))
