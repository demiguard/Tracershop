
# Python standard library

# Third party package
from django.test import SimpleTestCase

# Tracershop packages
from tracerauth.types import AuthActions

class AuthActionTestCases(SimpleTestCase):
  def test_auth_action_logic(self):

    accept = AuthActions.ACCEPT
    reject = AuthActions.REJECT

    accept_log = AuthActions.ACCEPT_LOG
    reject_log = AuthActions.REJECT_LOG

    self.assertEqual(AuthActions.REJECT, accept & reject)
    self.assertEqual(AuthActions.REJECT, accept & reject)

    self.assertEqual(AuthActions.REJECT_LOG, accept_log & reject)
    self.assertEqual(AuthActions.ACCEPT_LOG, accept_log & accept)
    self.assertEqual(AuthActions.REJECT_LOG, reject_log & accept & accept_log & reject)
