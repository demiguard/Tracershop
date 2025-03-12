import importlib

from typing import Any, Sequence
from unittest import TestSuite
from unittest.mock import patch
from django.test.runner import DiscoverRunner
from django.test.utils import setup_databases as _setup_databases
from django.apps import apps
from tracerauth.tests.mocks import mocks_ldap


class CustomRunner(DiscoverRunner):
  def __init__(self, *args, **kwargs):
    new_kwargs = kwargs
    new_kwargs['keepdb'] = False
    new_kwargs['timing'] = True
    super().__init__(*args, **new_kwargs)

  def setup_test_environment(self, **kwargs):
    super().setup_test_environment(**kwargs)
    importlib.import_module('tracerauth')

    self.ldap_pacther = patch('tracerauth.tracer_ldap', mocks_ldap)
    self.ldap_pacther.start()

  def teardown_test_environment(self, **kwargs):
    self.ldap_pacther.stop()
    return super().teardown_test_environment(**kwargs)


  def run_tests(self, test_labels: list[str]) -> int:
    result = super().run_tests(test_labels)

    return result