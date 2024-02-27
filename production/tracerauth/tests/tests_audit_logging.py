"""Testing of generation of log messages"""

# Python standard library
from datetime import datetime
from logging import INFO

# Third Party Packages
from django.test import TransactionTestCase

# Tracershop Packages
from constants import AUDIT_LOGGER
from database.models import User, UserGroups

from tracerauth.types import AuthActions
from tracerauth.audit_logging import CreateModelAuditEntry, EditModelAuditEntry,\
    DeleteModelAuditEntry, logFreeInjectionOrder, logFreeActivityOrders

class ModelTestCases(TransactionTestCase):
  def setUp(self) -> None:
    self.admin_user = User(username="Admin", user_group=UserGroups.Admin)

    self.log_model = User(username="Testuser")
    self.log_model.set_password("asdfqwer")


    self.saved_log_model = User(username="Testuser")
    self.saved_log_model.set_password("asdfqwer")
    self.saved_log_model.save()

  def tearDown(self) -> None:
    self.saved_log_model.delete()

  def test_log_create(self):
    # Empty user
    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(None, self.log_model, AuthActions.ACCEPT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(None, self.log_model, AuthActions.ACCEPT_LOG)
    self.assertEqual(len(context_manager.output),1)

    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(None, self.log_model, AuthActions.REJECT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(None, self.log_model, AuthActions.REJECT_LOG)
    self.assertEqual(len(context_manager.output),1)

    # Admin user
    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(self.admin_user, self.log_model, AuthActions.ACCEPT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(self.admin_user, self.log_model, AuthActions.ACCEPT_LOG)
    self.assertEqual(len(context_manager.output),1)

    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(self.admin_user, self.log_model, AuthActions.REJECT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      CreateModelAuditEntry.log(self.admin_user, self.log_model, AuthActions.REJECT_LOG)
    self.assertEqual(len(context_manager.output),1)

  def test_log_edit(self):
    self.saved_log_model.last_login = datetime(1931,12,13,11,45,11)
    # Empty user
    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(None, self.saved_log_model, AuthActions.ACCEPT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(None, self.saved_log_model, AuthActions.ACCEPT_LOG)
    self.assertEqual(len(context_manager.output),1)

    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(None, self.saved_log_model, AuthActions.REJECT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(None, self.saved_log_model, AuthActions.REJECT_LOG)
    self.assertEqual(len(context_manager.output),1)

    # Admin user
    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.ACCEPT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.ACCEPT_LOG)
    self.assertEqual(len(context_manager.output),1)

    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.REJECT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      EditModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.REJECT_LOG)
    self.assertEqual(len(context_manager.output),1)


  def test_log_delete(self):
    # Empty user
    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(None, self.saved_log_model, AuthActions.ACCEPT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(None, self.saved_log_model, AuthActions.ACCEPT_LOG)
    self.assertEqual(len(context_manager.output),1)

    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(None, self.saved_log_model, AuthActions.REJECT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(None, self.saved_log_model, AuthActions.REJECT_LOG)
    self.assertEqual(len(context_manager.output),1)

    # Admin user
    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.ACCEPT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.ACCEPT_LOG)
    self.assertEqual(len(context_manager.output),1)

    with self.assertNoLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.REJECT)

    with self.assertLogs(AUDIT_LOGGER, INFO) as context_manager:
      DeleteModelAuditEntry.log(self.admin_user, self.saved_log_model, AuthActions.REJECT_LOG)
    self.assertEqual(len(context_manager.output),1)