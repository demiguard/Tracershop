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

# There is some problems regarding what the difference is between a JSON_ var and a WEBSOCKET_DATA_ constant

JSON_ACTIVITY_ORDER = "orders"
JSON_ACTIVE_DATABASE = "active_database"
JSON_ADDRESS  = "address"
JSON_AMOUNT   = "amount"
JSON_CUSTOMER  = "customer"
JSON_DATABASE = "database"
JSON_DELIVERTIMES = "deliverTimes"
JSON_EMPLOYEE = "employee"
JSON_EMPLOYEES = "employees"
JSON_FIELD_TO_UPDATE = "FieldToUpdate"
JSON_GHOST_ORDER = "ghostOrder"
JSON_GREAT_STATE = "GREATSTATE"
JSON_INJECTION_ORDERS = "t_orders"
JSON_ISOTOPE = "isotopes"
JSON_ORDERS  = "orders"
JSON_PRODUCTION = "production"
JSON_PRODUCTIONS = "productions"
JSON_RUN = "run"
JSON_RUNS = "runs"
JSON_TRACER = "tracers"
JSON_TRACER_MAPPING = "tracer_mapping"
JSON_SERVER_CONFIG = "server_config"
JSON_VIALS = "vials"

JSON_VIAL_MAPPING = "vial_mapping"


# WEBSOCKET MESSAGES
WEBSOCKET_DATA                 = "data"
WEBSOCKET_DATATYPE             = "datatype"
WEBSOCKET_DATA_ID              = "dataID"
WEBSOCKET_DATA_CREATE_ORDER    = "createOrder"
WEBSOCKET_DATA_DEAD_ORDERS     = "deadOrders"
WEBSOCKET_DATA_ORDER           = "order"
WEBSOCKET_DATA_ORDERS          = "orders"
WEBSOCKET_DATA_VIAL            = "vial"
WEBSOCKET_DATA_VIALS           = "vials"
WEBSOCKET_DATA_TRACER          = "tracerID"
WEBSOCKET_DATA_T_ORDERS        = "t_orders"
WEBSOCKET_DATE                 = "date"
WEBSOCKET_MESSAGETYPE          = "messageType"
WEBSOCKET_MESSAGE_CREATE_VIAL  = "createVial"
WEBSOCKET_MESSAGE_CREATE_ORDER = "createOrder"
WEBSOCKET_MESSAGE_CREATE_T_ORDER = "createTOrder"
WEBSOCKET_MESSAGE_EDIT_CUSTOMER = "editCustomer"
WEBSOCKET_MESSAGE_EDIT_TRACER  = "editTracer"
WEBSOCKET_MESSAGE_EDIT_VIAL    = "editVial"
WEBSOCKET_MESSAGE_FREE_ORDER   = "freeOrder"
WEBSOCKET_MESSAGE_UPDATEORDERS = "updateOrder"
WEBSOCKET_MESSAGE_GREAT_STATE  = "getGREATState"
WEBSOCKET_MESSAGE_RECIEVE_VIAL = "recieveVial"
WEBSOCKET_MESSAGE_EDIT_STATE   = "editState"
WEBSOCKET_SEND_EVENT           = "sendEvent"
WEBSOCKET_EVENT_TYPE           = "type"
WEBSOCKET_MESSAGE_MOVE_ORDERS  = "moveOrder"
WEBSOCKET_MESSAGE_ECHO         = "echo"
WEBSOCKET_MESSAGE_GET_ORDERS   = "getOrders"
WEBSOCKET_UPDATE_SERVERCONFIG  = "updateServerConfig"