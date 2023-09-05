from datetime import date
##### Python Specific constants #####
# These constants are note shared with the frontend

EMAIL_SENDER_ADDRESS = "no-reply-production@regionh.dk"

DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M:%S"
DATETIME_FORMAT = f"{DATE_FORMAT} {TIME_FORMAT}"
JSON_DATETIME_FORMAT =f"{DATE_FORMAT}T{TIME_FORMAT}"

TIME_REGULAR_EXPRESSION = r"(2[0-3]|[01]?[0-9]):([0-5][0-9]):([0-5][0-9])"
DATE_REGULAR_EXPRESSION = r"\d{4}-(1[0-2]|0[1-9])-(0[1-9]|[12][0-9]|3[01])"

DATETIME_REGULAR_EXPRESSION = f"{DATE_REGULAR_EXPRESSION} {TIME_REGULAR_EXPRESSION}"
DATETIME_REGULAR_EXPRESSION_JS = f"{DATE_REGULAR_EXPRESSION}T{TIME_REGULAR_EXPRESSION}"

SQL_TABLE_REGULAR_EXPRESSION = r"^[A-z0-9]+(\.[A-z0-9]+)?$"

LEGACY_ENTRIES = date(2023,9,1)

# Loggers

DEBUG_LOGGER = "DebugLogger"
ERROR_LOGGER = "ErrorLogger"
AUDIT_LOGGER = "AuditLogger"
PING_SERVICE_LOGGER = "PingServiceLogger"
