#/usr/bin/bash
coverage run --omit=*/venv/* manage.py test
coverage report --show-missing --omit=*/venv/*,*/tests/*,runTests.py --skip-covered
[ -d coverage ] || mkdir -p coverage
#coverage-lcov --output_file_path coverage/lcov.info
