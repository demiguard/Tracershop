from django.test.runner import DiscoverRunner
from django.test.utils import setup_databases as _setup_databases
from django.apps import apps

from pprint import pprint

class CustomRunner(DiscoverRunner):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)

  def setup_databases(self, aliases):
    pass

  def teardown_databases(self, old_config):
    pass

  def run_tests(self, extra_tests=None, **kwargs):
    """
    Run the unit tests for all the test labels in the provided list.

    Test labels should be dotted Python paths to test modules, test
    classes, or test methods.

    A list of 'extra' tests may also be provided; these tests
    will be added to the test suite.

    Return the number of tests that failed.
    """
    self.setup_test_environment()
    suite = self.build_suite()
    databases = self.get_databases(suite)
    run_failed = False
    try:
        self.run_checks(databases)
        result = self.run_suite(suite)
    except Exception:
        run_failed = True
        raise
    finally:
        try:
          self.teardown_test_environment()
        except Exception:
          # Silence teardown exceptions if an exception was raised during
          # runs to avoid shadowing it.
          if not run_failed:
              raise
    self.time_keeper.print_results()
    return self.suite_result(suite, result)