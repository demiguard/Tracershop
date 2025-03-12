from datetime import date
import re
##### Python Specific constants #####
# These constants are note shared with the frontend

EMAIL_SENDER_ADDRESS = "no-reply-production@regionh.dk"

DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M:%S"
DATETIME_FORMAT = f"{DATE_FORMAT} {TIME_FORMAT}"
DATA_DATETIME_FORMAT =f"{DATE_FORMAT}T{TIME_FORMAT}Z"
DATETIMEZONE_FORMAT = f"{DATETIME_FORMAT}%z"


TIME_PATTERN = r"(2[0-3]|[01][0-9]).?([0-5][0-9]).?([0-5][0-9])"
DATE_PATTERN = r"(\d{4})[^\d]?(1[0-2]|0[1-9])[^\d]?(0[1-9]|[12][0-9]|3[01])"

DATETIME_REGULAR_EXPRESSION = re.compile(f"{DATE_PATTERN}[^\d]?{TIME_PATTERN}.*")
DATE_REGULAR_EXPRESSION = re.compile(DATE_FORMAT)
TIME_REGULAR_EXPRESSION = re.compile(TIME_PATTERN)

SQL_TABLE_REGULAR_EXPRESSION = r"^[A-z0-9]+(\.[A-z0-9]+)?$"

LEGACY_ENTRIES = date(2023,11 ,20)

# Loggers

DEBUG_LOGGER = "DebugLogger"
ERROR_LOGGER = "ErrorLogger"
AUDIT_LOGGER = "AuditLogger"
PING_SERVICE_LOGGER = "PingServiceLogger"
VIAL_LOGGER = "VialLogger"

# Environment paths

VIAL_WATCHER_FILE_PATH_ENV = "VIAL_WATCHER_FILE_PATH"

CHANNEL_GROUP_GLOBAL = "global"
CHANNEL_TARGET_KEYWORD = "type"
CHANNEL_TARGET_BROADCAST_FUNCTION = "broadcastMessage"

MESSENGER_CONSUMER = "consumer"


# Environment Variables
ENV_TEST_PDF_DIRECTORY = "TRACER_TEST_PDF"

# Environment variables defaults
ENV_TEST_PDF_DIRECTORY_DEFAULT = "test_pdf"

# LDAP Group names
LDAP_DN_SITE_ADMIN_GROUP       = 'CN=RGH-B-SE Tracershop Site-Admin,OU=Tracershop,OU=Ressource Grupper,OU=FAELLES Administration,OU=Region Hovedstaden,DC=regionh,DC=top,DC=local'
LDAP_DN_PRODUCTION_ADMIN_GROUP = 'CN=RGH-B-SE Tracershop Production-Admin,OU=Tracershop,OU=Ressource Grupper,OU=FAELLES Administration,OU=Region Hovedstaden,DC=regionh,DC=top,DC=local'
LDAP_DN_PRODUCTION_USER_GROUP  = 'CN=RGH-B-SE Tracershop Production-User,OU=Tracershop,OU=Ressource Grupper,OU=FAELLES Administration,OU=Region Hovedstaden,DC=regionh,DC=top,DC=local'
LDAP_DN_SHOP_ADMIN_GROUP       = 'CN=RGH-B-SE Tracershop Shop-Admin,OU=Tracershop,OU=Ressource Grupper,OU=FAELLES Administration,OU=Region Hovedstaden,DC=regionh,DC=top,DC=local'
LDAP_DN_SHOP_USER_GROUP        = 'CN=RGH-B-SE Tracershop Shop-User,OU=Tracershop,OU=Ressource Grupper,OU=FAELLES Administration,OU=Region Hovedstaden,DC=regionh,DC=top,DC=local'
