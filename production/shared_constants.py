"""These constants are shared between the frontend and the backend.
They are keywords in json objects transferred back and forth by the websocket.
It's important that there's no constants which overlap unless they are intended.

There's a script synchronizing the frontend and backend in 'generate_derived_javascript.js'
"""

from enum import Enum as __Enum

# This is the variable the version of the javascript that server matches with
# This is used ensure that users get newer javascripts version and doesn't
# Work on older (And maybe bug prone) versions
JAVASCRIPT_VERSION = "1.2.3" # Remember to update this to catch bugs

# The Auth key words are members in a Auth data object with is parsed back and
# forth regrading authentication. This object is placed in the root message with
# the keyword DATA_AUTH
AUTH_USERNAME = "username"
AUTH_PASSWORD = "password"
AUTH_DETAIL = "detail"
AUTH_IS_AUTHENTICATED = "isAuthenticated"
AUTH_USER = "auth_user"

# Errors string

# Errors are an enum index with error type. When a backend error happens then
# the WEBSOCKET_MESSAGE_SUCCESS is set with WEBSOCKET_MESSAGE_ERROR and
# ERROR_TYPE is with an error. Note that in production, it is a sign of a bug.
# The frontend doesn't have any relevant error handling, for these errors.
ERROR_TYPE = "error_type"
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
NO_ERROR = ""

# Data

DATA_ACTIVITY_ORDER = "activity_orders"
DATA_ADDRESS  = "address"
DATA_AUTH = "auth"
DATA_BOOKING = "booking"
DATA_CLOSED_DATE = "closed_date"
DATA_CUSTOMER  = "customer"
DATA_DATABASE = "database"
DATA_DEADLINE = "deadline"
DATA_DELIVER_TIME = "deliver_times"
DATA_DICOM_ENDPOINT = "dicom_endpoint"
DATA_ENDPOINT = "delivery_endpoint"
DATA_INJECTION_ORDER = "injection_orders"
DATA_ISOTOPE = "isotopes"
DATA_LOCATION = "location"
DATA_MESSAGE = "message"
DATA_MESSAGE_ASSIGNMENT = "message_assignment"
DATA_ORDERS  = "orders"
DATA_PROCEDURE = "procedure"
DATA_PRODUCTION = "production"
DATA_PROCEDURE_IDENTIFIER = "procedure_identifier"
DATA_RUN = "run"
DATA_TRACER = "tracer"
DATA_TRACER_MAPPING = "tracer_mapping"
DATA_RELEASE_RIGHT = "release_right"
DATA_SERVER_CONFIG = "server_config"
DATA_SERVER_LOG = "server_log"
DATA_SECONDARY_EMAIL = "secondary_email"
DATA_VIAL = "vial"
DATA_USER = "user"
DATA_USER_ASSIGNMENT = "user_assignment"
DATA_LEGACY_PRODUCTION_MEMBER = "legacy_production_member"
DATA_LEGACY_INJECTION_ORDER = "legacy_injection_order"
DATA_LEGACY_ACTIVITY_ORDER = "legacy_activity_order"

URL_INDEX = ""
URL_ACTIVITY_PDF_BASE_PATH = "activtity_pdfs"
URL_INJECTION_PDF_BASE_PATH = "injection_pdfs"


# WEBSOCKET MESSAGES
WEBSOCKET_DATA                             = "data"
WEBSOCKET_DATATYPE                         = "datatype"
WEBSOCKET_DATA_ID                          = "dataID"
WEBSOCKET_DATE                             = "date"
WEBSOCKET_DEAD_ORDERS                      = "deadOrders"
WEBSOCKET_ERROR                            = "error"
WEBSOCKET_JAVASCRIPT_VERSION               = "javascriptVersion"
WEBSOCKET_MESSAGE_AUTH_LOGIN               = "login"
WEBSOCKET_MESSAGE_AUTH_LOGOUT              = "logout"
WEBSOCKET_MESSAGE_AUTH_WHOAMI              = "whoami"
WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD = "changeExternalPassword"
WEBSOCKET_MESSAGE_CREATE_DATA_CLASS        = "createDataClass"
WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER     = "createExternalUser"
WEBSOCKET_MESSAGE_CREATE_INJECTION_ORDER   = "createInjectionOrder"
WEBSOCKET_MESSAGE_DELETE_DATA_CLASS        = "deleteDataClass"
WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT   = "createUserAssignment"
WEBSOCKET_MESSAGE_ECHO                     = "echo"
WEBSOCKET_MESSAGE_ERROR                    = "error"
WEBSOCKET_MESSAGE_FREE_ACTIVITY            = "freeActivity"
WEBSOCKET_MESSAGE_FREE_INJECTION           = "freeInjection"
WEBSOCKET_MESSAGE_GET_HISTORY              = "history"
WEBSOCKET_MESSAGE_GET_ORDERS               = "getOrders"
WEBSOCKET_MESSAGE_GREAT_STATE              = "getGREATState"
WEBSOCKET_MESSAGE_GET_STATE                = "getState"
WEBSOCKET_MESSAGE_ID                       = "messageID"
WEBSOCKET_MESSAGE_MASS_ORDER               = "massOrder"
WEBSOCKET_MESSAGE_ORDER_INJECTION          = "OrderInjection"
WEBSOCKET_MESSAGE_MODEL_CREATE             = "createModel"
WEBSOCKET_MESSAGE_MODEL_DELETE             = "deleteModel"
WEBSOCKET_MESSAGE_MODEL_EDIT               = "editModel"
WEBSOCKET_MESSAGE_MOVE_ORDERS              = "moveOrder"
WEBSOCKET_MESSAGE_LOG_ERROR                = "logError"
WEBSOCKET_MESSAGE_RESTORE_ORDERS           = "restoreOrders"
WEBSOCKET_MESSAGE_RESTART_VIAL_DOG          = "restartVialDog"
WEBSOCKET_MESSAGE_STATUS                   = "status"
WEBSOCKET_MESSAGE_SUCCESS                  = "success"
WEBSOCKET_MESSAGE_TYPE                     = "messageType"
WEBSOCKET_MESSAGE_UPDATE_STATE             = "updateState"
WEBSOCKET_OBJECT_DOES_NOT_EXISTS           = "objectDoesNotExists"
WEBSOCKET_REFRESH                          = "refresh"
WEBSOCKET_SEND_EVENT                       = "sendEvent"
WEBSOCKET_SESSION_ID                       = "sessionid"
WEBSOCKET_EVENT_TYPE                       = "type"
WEBSOCKET_UPDATE_SERVER_CONFIG             = "updateServerConfig"

WEBSOCKET_MESSAGE_TYPES = [
  WEBSOCKET_MESSAGE_AUTH_LOGIN,
  WEBSOCKET_MESSAGE_AUTH_LOGOUT,
  WEBSOCKET_MESSAGE_AUTH_WHOAMI,
  WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT,
  WEBSOCKET_MESSAGE_ECHO,
  WEBSOCKET_MESSAGE_GET_ORDERS,
  WEBSOCKET_MESSAGE_GET_STATE,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY,
  WEBSOCKET_MESSAGE_FREE_INJECTION,
  WEBSOCKET_MESSAGE_MODEL_CREATE,
  WEBSOCKET_MESSAGE_MODEL_DELETE,
  WEBSOCKET_MESSAGE_MODEL_EDIT,
  WEBSOCKET_MESSAGE_MASS_ORDER,
  WEBSOCKET_MESSAGE_MOVE_ORDERS,
  WEBSOCKET_MESSAGE_RESTORE_ORDERS,
  WEBSOCKET_MESSAGE_LOG_ERROR,
  WEBSOCKET_MESSAGE_RESTART_VIAL_DOG,
  WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
  WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,
]

class TRACER_USAGE(__Enum):
  human = 0
  animal = 1
  other = 2


# Note for shared enums it very important that a value is assigned, to ensure
# a consistent view
class SUCCESS_STATUS_CREATING_USER_ASSIGNMENT(__Enum):
  SUCCESS = 0
  NO_LDAP_USERNAME = 1
  INCORRECT_GROUPS = 2
  MISSING_CUSTOMER = 3

class SUCCESS_STATUS_CRUD(__Enum):
  SUCCESS = 0
  UNSPECIFIED_REJECT = 1
  ARCHIVED_OBJECT = 2
  MISSING_RIGHTS = 3