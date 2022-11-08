#/usr/bin/bash
coverage run runTests.py && coverage report --show-missing --omit=lib/tests/*,tests/*,runTests.py --skip-covered
