from enum import Enum, unique

##### Python Specific constants #####
# These constants are note shared with the frontend


TRACERSHOPDATABASENAME = 'TS_test'

USAGE = {
  1 : "Human",
  2 : "Dyr",
  3 : "Andet"
}

NO_TORDER_FOUND = 50
NO_ORDER_FOUND = 5

FDG_GROUP_NAME = "fdg"

SPECIAL_TRACER_GROUP_NAME = "special"

EMAIL_SENDER_ADDRESS = "no-reply-production@regionh.dk"

DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M:%S"
DATETIME_FORMAT = f"{DATE_FORMAT} {TIME_FORMAT}"
JSON_DATETIME_FORMAT =f"{DATE_FORMAT}T{TIME_FORMAT}"

TIME_REGULAR_EXPRESSION = "(2[0-3]|[01]?[0-9]):([0-5][0-9]):([0-5][0-9])"
DATE_REGULAR_EXPRESSION = "\d{4}-(1[0-2]|0[1-9])-(0[1-9]|[12][0-9]|3[01])"

DATETIME_REGULAR_EXPRESSION = f"{DATE_REGULAR_EXPRESSION} {TIME_REGULAR_EXPRESSION}"
DATETIME_REGULAR_EXPRESSION_JS = f"{DATE_REGULAR_EXPRESSION}T{TIME_REGULAR_EXPRESSION}"

SQL_TABLE_REGULAR_EXPRESSION = "^[A-z0-9]+(\.[A-z0-9]+)?$"

##### Test specific Constants #####
# These keywords are only used in tests

LEGACY_TABLES = {
  "Roles",
  "TracerCustomer",
  "Tracers",
  "UserRoles",
  "Users",
  "VAL",
  "blockDeliverDate",
  "deliverTimes",
  "isotopes",
  "orders",
  "productionTimes",
  "t_orders",
  "tracer_types"
}

JAVASCRIPT_VERSION = "1.0.1" # Remember to update this to catch bugs


# Long list JSON key word used in Json messsages
# These should have great overlap with the constants in production/frontend/src/lib/constants.js

AUTH_USERNAME         = "username"
AUTH_PASSWORD         = "password"
AUTH_DETAIL           = "detail"
AUTH_IS_AUTHENTICATED = "isAuthenticated"

# Errors string

ERROR_INVALID_AUTH = "InvalidAuth"
ERROR_INVALID_DATACLASS_TYPE = "NoDataClass"
ERROR_INVALID_JAVASCRIPT_VERSION = "InvalidJavascriptVersion"
ERROR_INVALID_MESSAGE = "InvalidMessage"
ERROR_INVALID_MESSAGE_TYPE = "InvalidMessageType"
ERROR_OBJECT_NOT_FOUND = "objectNotFound"
ERROR_NO_JAVASCRIPT_VERSION = "NoJavaScriptVersion"
ERROR_NO_MESSAGE_ID = "NoMessageID"
ERROR_NO_MESSAGE_TYPE = "NoMessageType"
ERROR_INSUFFICIENT_PERMISSIONS = "InsufficientPermissions"
ERROR_INSUFFICIENT_DATA = "InsufficientData"
ERROR_UNKNOWN_FAILURE = "unknownError"

# There is some problems regarding what the difference is between a JSON_ var and a WEBSOCKET_DATA_ constant

JSON_ACTIVITY_ORDER = "orders"
JSON_ACTIVE_DATABASE = "active_database"
JSON_AUTH = "auth"
JSON_ADDRESS  = "address"
JSON_CUSTOMER  = "customer"
JSON_CLOSEDDATE = "closeddate"
JSON_DATABASE = "database"
JSON_DELIVERTIME = "deliverTimes"
JSON_EMPLOYEE = "employee"
JSON_FIELD_TO_UPDATE = "FieldToUpdate"
JSON_GHOST_ORDER = "ghostOrder"
JSON_GREAT_STATE = "GREATSTATE"
JSON_INJECTION_ORDER = "t_orders"
JSON_ISOTOPE = "isotopes"
JSON_ORDERS  = "orders"
JSON_PRODUCTION = "production"
JSON_RUN = "run"
JSON_TRACER = "tracer"
JSON_TRACER_MAPPING = "tracer_mapping"
JSON_SERVER_CONFIG = "server_config"
JSON_VIAL = "vial"
JSON_VIAL_MAPPING = "vial_mapping"

#Keywords
KEYWORD_ACTIVITY = "activity"
KEYWORD_ADDRESS_1 = "addr1"
KEYWORD_ADDRESS_2 = "addr2"
KEYWORD_ADDRESS_3 = "addr3"
KEYWORD_ADDRESS_4 = "addr4"
KEYWORD_AMOUNT = "amount"
KEYWORD_AMOUNT_O = "amount_o"
KEYWORD_BID = "BID"
KEYWORD_BATCHNR = "batchnr"
KEYWORD_CHARGE = "charge"
KEYWORD_COID = "COID"
KEYWORD_COMMENT = "comment"
KEYWORD_CONTACT = "contact"
KEYWORD_CUSTOMER = "customer"
KEYWORD_CUSTOMER_NUMBER = "kundenr"
KEYWORD_CUSTOMER_USERNAME = "UserName" # This exists because legacy reasons
KEYWORD_DAY = "day"
KEYWORD_DDATE = "ddate"
KEYWORD_DELIVER_DATETIME = "deliver_datetime"
KEYWORD_DELIVER_TIME = "dtime"
KEYWORD_DELIVER_TIME_ID = "DTID"
KEYWORD_EMAIL_1 = "email"
KEYWORD_EMAIL_2 = "email2"
KEYWORD_EMAIL_3 = "email3"
KEYWORD_EMAIL_4 = "email4"
KEYWORD_FILLDATE = "filldate"
KEYWORD_FILLTIME = "filltime"
KEYWORD_FREED_BY = "frigivet_af"
KEYWORD_FREED_AMOUNT = "frigivet_amount"
KEYWORD_FREED_DATETIME = "frigivet_datetime"
KEYWORD_HALFLIFE = "halflife"
KEYWORD_SMALL_ID = "id"
KEYWORD_ID = "ID"
KEYWORD_INJECTIONS = "n_injections"
KEYWORD_IN_USE = "in_use"
KEYWORD_ISOTOPE = "isotope"
KEYWORD_LONG_NAME = "longName"
KEYWORD_NAME = "name"
KEYWORD_OID = "oid"
KEYWORD_ORDER_ID = "order_id"
KEYWORD_ORDER_BLOCK = "order_block"
KEYWORD_OVERHEAD = "overhead"
KEYWORD_PRODUCTION_ID = "PTID"
KEYWORD_PRODUCTION_TIME = "ptime"
KEYWORD_REAL_NAME = "Realname"
KEYWORD_REPEAT = "repeat_t"
KEYWORD_RUN = "run"
KEYWORD_STATUS = "status"
KEYWORD_TELEFON_NUMBER = "tlf"
KEYWORD_TOTAL_AMOUNT = "total_amount"
KEYWORD_TOTAL_AMOUNT_O = "total_amount_o"
KEYWORD_TRACER = "tracer"
KEYWORD_TRACER_TYPE = "tracer_type"
KEYWORD_USAGE = "anvendelse"
KEYWORD_USERNAME = "UserName"
KEYWORD_USERNAME_ORDERS = "username"
KEYWORD_USERGROUP = "usergroup"
KEYWORD_VOLUME = "volume"

# WEBSOCKET MESSAGES
WEBSOCKET_DATA                 = "data"
WEBSOCKET_DATATYPE             = "datatype"
WEBSOCKET_DATA_ID              = "dataID"
WEBSOCKET_DATE                 = "date"
WEBSOCKET_DEAD_ORDERS          = "deadOrders"
WEBSOCKET_ERROR                = "error"
WEBSOCKET_JAVASCRIPT_VERSION   = "javascriptVersion"
WEBSOCKET_MESSAGE_ANSWER       = "answer"
WEBSOCKET_MESSAGE_AUTH_LOGIN   = "login"
WEBSOCKET_MESSAGE_AUTH_LOGOUT  = "logout"
WEBSOCKET_MESSAGE_AUTH_WHOAMI  = "whoami"
WEBSOCKET_MESSAGE_CREATE_DATA_CLASS = "createDataClass"
WEBSOCKET_MESSAGE_DELETE_DATA_CLASS = "deleteDataClass"
WEBSOCKET_MESSAGE_ECHO         = "echo"
WEBSOCKET_MESSAGE_EDIT_STATE   = "editState"
WEBSOCKET_MESSAGE_FREE_ACTIVITY = "freeActivity"
WEBSOCKET_MESSAGE_FREE_INJECTION = "freeInjection"
WEBSOCKET_MESSAGE_GET_HISTORY  = "history"
WEBSOCKET_MESSAGE_GET_ORDERS   = "getOrders"
WEBSOCKET_MESSAGE_GREAT_STATE  = "getGREATState"
WEBSOCKET_MESSAGE_ID           = "messageID"
WEBSOCKET_MESSAGE_MOVE_ORDERS  = "moveOrder"
WEBSOCKET_MESSAGE_SUCCESS      = "success"
WEBSOCKET_MESSAGE_TYPE         = "messageType"
WEBSOCKET_SEND_EVENT           = "sendEvent"
WEBSOCKET_SESSION_ID           = "sessionid"
WEBSOCKET_EVENT_TYPE           = "type"
WEBSOCKET_UPDATE_SERVERCONFIG  = "updateServerConfig"

WEBSOCKET_MESSAGE_TYPES = [
  WEBSOCKET_MESSAGE_AUTH_LOGIN,
  WEBSOCKET_MESSAGE_AUTH_LOGOUT,
  WEBSOCKET_MESSAGE_AUTH_WHOAMI,
  WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
  WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,
  WEBSOCKET_MESSAGE_ECHO,
  WEBSOCKET_MESSAGE_EDIT_STATE,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY,
  WEBSOCKET_MESSAGE_FREE_INJECTION,
  WEBSOCKET_MESSAGE_GET_HISTORY,
  WEBSOCKET_MESSAGE_GET_ORDERS,
  WEBSOCKET_MESSAGE_GREAT_STATE,
  WEBSOCKET_MESSAGE_MOVE_ORDERS,
]