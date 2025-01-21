"""As Ldap have some pretty heavy decencies on external services this is
difficult"""

# Python standard library
from unittest.mock import MagicMock, patch

# Third party packages
from django.test import TestCase, TransactionTestCase

# Tracershop packages
from constants import ERROR_LOGGER, DEBUG_LOGGER
from database.models import UserGroups, Customer, User, UserAssignment
from tracerauth import ldap

# Mocks
from tracerauth.tests.mocks import mocks_ldap

class LDAPTestCases(TestCase):
  def setUp(self):
    pass

  @classmethod
  def setUpTestData(cls):
    cls.user = User.objects.create(
      username='test', user_group = UserGroups.Admin
    )
    cls.customer = Customer.objects.create(
      short_name="test_customer",
      billing_address="customer_1_billing_address"
    )

  @patch('tracerauth.ldap.LDAPConnection', mocks_ldap.LDAPConnection)
  def test_check_if_mocking_works(self):
    with ldap.LDAPConnection() as conn:
      res = conn.search_s()

    self.assertEqual(res[0][0], mocks_ldap.FAKE_LDAP_CN)

  @patch('tracerauth.ldap.LDAPConnection', mocks_ldap.LDAPConnection)
  def test_query_username(self):
    # Because of mock input username doesn't matter
    res = ldap._query_username("test_username")
    self.assertEqual(res[0][0], mocks_ldap.FAKE_LDAP_CN)

  @patch('tracerauth.ldap.LDAPConnection', mocks_ldap.LDAPConnection)
  def test_query_username_with_conn(self):
    with ldap.LDAPConnection() as conn:
      # Because of mock input username doesn't matter
      res = ldap._query_username("test_username", conn)
    self.assertEqual(res[0][0], mocks_ldap.FAKE_LDAP_CN)

  @patch('tracerauth.ldap.LDAPConnection', mocks_ldap.LDAPConnection)
  def test_checkUserGroupMemberShip(self):
    status, user_group = ldap.checkUserGroupMembership("Test")
    self.assertEqual(status, ldap.LDAPSearchResult.SUCCESS)
    self.assertEqual(user_group, UserGroups.Admin)

  @patch('tracerauth.ldap.LDAPConnection', mocks_ldap.EmptyLDAPConnection)
  def test_checkUserGroupMembership_no_response(self):
    status, user_group = ldap.checkUserGroupMembership('test')
    self.assertIsNone(user_group)

  @patch('tracerauth.ldap.LDAPConnection', mocks_ldap.AlteredLDAPConnection)
  def test_checkUserGroupMembership_missing_key(self):
    status, user_group = ldap.checkUserGroupMembership('test')

    self.assertEqual(status, ldap.LDAPSearchResult.MISSING_USER_GROUP)
    self.assertIsNone(user_group)
