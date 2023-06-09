#!/usr/bin/env python
import os
import sys

import django
from django.conf import settings
from django.test.utils import get_runner, setup_databases, teardown_databases
from django.test.runner import DiscoverRunner

import traceback


if __name__ == "__main__":
    os.environ['DJANGO_SETTINGS_MODULE'] = 'tests.test_settings'
    django.setup()
    # Create test database
    from tests import helpers
    try:
        old_config = setup_databases(1, True)
        test_legacy_database_name = helpers.CreateTestDatabase(settings.DATABASES["default"])
        helpers.InitializeDjangoDatabase(settings.DATABASES["default"], test_legacy_database_name)
        TestRunner = get_runner(settings)
        test_runner = TestRunner()
        failures = test_runner.run_tests()
    #Destroy Test database
    except Exception as E:
        print(f"Failed to do the thing  because of {E}")
        traceback.print_exc()
    finally:
        teardown_databases(old_config, 1)
        helpers.DestroyTestDatabase(settings.DATABASES["default"])
    if "failures" in locals():
        sys.exit(bool(failures))
    else:
        sys.exit(1)