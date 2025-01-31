# Setup Django
from os import environ
environ.setdefault('DJANGO_SETTINGS_MODULE', 'testing.test_settings')

from django import setup
setup()

from django.conf import settings
from django.test.utils import get_runner, setup_databases

# Note that the test setup sets the following things:
# * Test Runner found in tests.runner
# * Database to sqlite
# * Channels in memory layer
# * Backend to tests.backend

# Python standard library
import sys
import argparse

# Third party Packages
from coverage import Coverage

# Tracershop Packages

def clamp(n_min, n_max, n):
  return max(n_min, min(n_max, n))



# Setup Args
argparser = argparse.ArgumentParser(description="Test program for Tracershop backend")

argparser.add_argument("test_label", help="Label", default=None, nargs='?')
argparser.add_argument("-v", "--verbose", default=1, type=int)
argparser.add_argument("-k", '--test_name_patterns', help="bla", nargs='*', required=False)

args = argparser.parse_args()

if __name__ == "__main__":
  #cov = Coverage(config_file='.coveragerc')
  #cov.start()


  TestRunner = get_runner(settings)
  test_runner = TestRunner(
    verbosity=clamp(0, 3, args.verbose),
    test_name_patterns=args.test_name_patterns
  )

  if args.test_label is not None:
    labels = [args.test_label]
  else:
    labels = ['database','testing', 'frontend', 'lib', 'tracerauth', 'websocket']

  failures = test_runner.run_tests(test_labels=labels)

  sys.exit(bool(failures))
