from typing import Any, Sequence
from unittest import TestSuite
from django.test.runner import DiscoverRunner
from django.test.utils import setup_databases as _setup_databases
from django.apps import apps


from pprint import pprint

class CustomRunner(DiscoverRunner):
  def __init__(self, *args, **kwargs):
    new_kwargs = kwargs
    new_kwargs['keepdb'] = False
    new_kwargs['timing'] = True
    super().__init__(*args, **new_kwargs)


  def run_tests(self, test_labels: list[str]) -> int:
    #self.setup_databases()

    result = super().run_tests(test_labels)
    #self.teardown_databases()

    return result