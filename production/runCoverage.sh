#/usr/bin/bash
coverage run runTests.py --omit=*/venv/*
coverage report --show-missing --omit=*/venv/*,*/tests/*,runTests.py --skip-covered
[ -d coverage ] || mkdir -p coverage
#coverage-lcov --output_file_path coverage/lcov.info
