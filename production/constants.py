from enum import Enum, unique


TRACERSHOPDATABASENAME = 'TS_test'

NO_TORDER_FOUND = 50
NO_ORDER_FOUND = 5

FDG_GROUP_NAME = "fdg"

SPECIAL_TRACER_GROUP_NAME = "special"

EMAIL_SENDER_ADDRESS = "no-reply-production@regionh.dk"

DATE_FORMAT = "%Y-%m-%d"
TIME_FORMAT = "%H:%M:%S"
DATETIME_FORMAT = f"{DATE_FORMAT} {TIME_FORMAT}"
JSON_DATETIME_FORMAT =f"{DATE_FORMAT}T{TIME_FORMAT}"

@unique
class EmailEvents(Enum):
  #Note that due to this being database ID, we are 1 indexed instead of 0 indexed
  STATUS_SET_TO_3 = 1
  STATUS_SET_TO_0 = 2

# Long list JSON key word used in Json messsages
# These should have great overlap with production/frontend/src/lib/constants.js

AUTH_USERNAME         = "username"
AUTH_PASSWORD         = "password"
AUTH_DETAIL           = "detail"
AUTH_IS_AUTHENTICATED = "isAuthenticated"

JSON_AMOUNT   = "amount"
JSON_CUSTOMER  = "customer"
JSON_CUSTOMERS = "customers"
JSON_DELIVERTIMES = "deliverTimes"
JSON_EMPLOYEE = "employee"
JSON_ISOTOPE = "isotopes"
JSON_ORDERS  = "orders"
JSON_PRODUCTION = "production"
JSON_PRODUCTIONS = "productions"
JSON_RUNS = "runs"
JSON_TRACER = "tracers"
JSON_TRACER_MAPPING = "tracer_mapping"
JSON_VIALS = "vials"
JSON_VIAL_MAPPING = "vial_mapping"
JSON_ACTIVE_DATABASE = "active_database"
JSON_DATABASE = "database"
JSON_FIELD_TO_UPDATE = "FieldToUpdate"


# WEBSOCKET MESSAGES
WEBSOCKET_DATA_CREATE_ORDER    = "createOrder"
WEBSOCKET_DATA_ORDER           = "order"
WEBSOCKET_DATA_ORDERS          = "orders"
WEBSOCKET_DATA_VIAL            = "vial"
WEBSOCKET_DATA_VIALS           = "vials"
WEBSOCKET_DATA_TRACER          = "tracerID" 
WEBSOCKET_DATE                 = "date"
WEBSOCKET_MESSAGETYPE          = "messageType"
WEBSOCKET_MESSAGE_CREATE_VIAL  = "createVial"  
WEBSOCKET_MESSAGE_CREATE_ORDER = "createOrder"
WEBSOCKET_MESSAGE_EDIT_VIAL    = "editVial"
WEBSOCKET_MESSAGE_FREE_ORDER   = "freeOrder"
WEBSOCKET_MESSAGE_UPDATEORDERS = "updateOrder"
WEBSOCKET_MESSAGE_RECIEVE_VIAL = "recieveVial"
WEBSOCKET_SEND_EVENT           = "sendEvent"
WEBSOCKET_EVENT_TYPE           = "type"