/* GENERATED FILE, DO NOT EDIT, if this file needs to be changed edit
generate_shared_javascript_constants.py

This file contains the shard constants between the frontend and the backend
Note that, these constants are also used for database indexes */

export const AUTH_DETAIL = "detail";
export const AUTH_IS_AUTHENTICATED = "isAuthenticated";
export const AUTH_PASSWORD = "password";
export const AUTH_USER = "auth_user";
export const AUTH_USERNAME = "username";

export const BookingStatus = {
  Initial : 0,
  Ordered : 1,
  Rejected : 2,
  Released : 3,
};

export const DATA_ACTIVITY_ORDER = "activity_orders";
export const DATA_ADDRESS = "address";
export const DATA_AUTH = "auth";
export const DATA_BOOKING = "booking";
export const DATA_CLOSED_DATE = "closed_date";
export const DATA_CUSTOMER = "customer";
export const DATA_DATABASE = "database";
export const DATA_DEADLINE = "deadline";
export const DATA_DELIVER_TIME = "deliver_times";
export const DATA_DICOM_ENDPOINT = "dicom_endpoint";
export const DATA_ENDPOINT = "delivery_endpoint";
export const DATA_INJECTION_ORDER = "injection_orders";
export const DATA_ISOTOPE = "isotopes";
export const DATA_ISOTOPE_DELIVERY = "isotope_delivery";
export const DATA_ISOTOPE_ORDER = "isotope_order";
export const DATA_ISOTOPE_PRODUCTION = "isotope_production";
export const DATA_ISOTOPE_VIAL = "isotope_vial";
export const DATA_LEGACY_ACTIVITY_ORDER = "legacy_activity_order";
export const DATA_LEGACY_INJECTION_ORDER = "legacy_injection_order";
export const DATA_LEGACY_PRODUCTION_MEMBER = "legacy_production_member";
export const DATA_LOCATION = "location";
export const DATA_MESSAGE = "message";
export const DATA_MESSAGE_ASSIGNMENT = "message_assignment";
export const DATA_ORDERS = "orders";
export const DATA_PRINTER = "printer";
export const DATA_PROCEDURE = "procedure";
export const DATA_PROCEDURE_IDENTIFIER = "procedure_identifier";
export const DATA_PRODUCTION = "production";
export const DATA_RELEASE_RIGHT = "release_right";
export const DATA_RUN = "run";
export const DATA_SECONDARY_EMAIL = "secondary_email";
export const DATA_SERVER_CONFIG = "server_config";
export const DATA_SERVER_LOG = "server_log";
export const DATA_TELEMETRY_RECORD = "telemetry_record";
export const DATA_TELEMETRY_REQUEST = "telemetry_request";
export const DATA_TRACER = "tracer";
export const DATA_TRACER_MAPPING = "tracer_mapping";
export const DATA_USER = "user";
export const DATA_USER_ASSIGNMENT = "user_assignment";
export const DATA_VIAL = "vial";

export const ERROR_EARLY_BOOKING_TIME = "BOOKING_TIME";
export const ERROR_EARLY_TIME_SLOT = "EARLIEST_ORDER_TIME";
export const ERROR_INSUFFICIENT_DATA = "InsufficientData";
export const ERROR_INSUFFICIENT_PERMISSIONS = "InsufficientPermissions";
export const ERROR_INVALID_AUTH = "InvalidAuth";
export const ERROR_INVALID_DATACLASS_TYPE = "NoDataClass";
export const ERROR_INVALID_JAVASCRIPT_VERSION = "InvalidJavascriptVersion";
export const ERROR_INVALID_MESSAGE = "InvalidMessage";
export const ERROR_INVALID_MESSAGE_TYPE = "InvalidMessageType";
export const ERROR_NO_JAVASCRIPT_VERSION = "NoJavaScriptVersion";
export const ERROR_NO_MESSAGE_ID = "NoMessageID";
export const ERROR_NO_MESSAGE_TYPE = "NoMessageType";
export const ERROR_NO_VALID_TIME_SLOTS = "no_valid_time_slot";
export const ERROR_OBJECT_NOT_FOUND = "objectNotFound";
export const ERROR_TYPE = "error_type";
export const ERROR_UNKNOWN_FAILURE = "unknownError";

export const EXCLUDED_STATE_MODELS = [
  "booking",
  "telemetry_record",
  "telemetry_request",
]

export const JAVASCRIPT_VERSION = "2.3.0";

export const NO_ERROR = "";

export const SUCCESS_STATUS_CRUD = {
  SUCCESS : 0,
  UNSPECIFIED_REJECT : 1,
  ARCHIVED_OBJECT : 2,
  MISSING_RIGHTS : 3,
  CONSTRAINTS_VIOLATED : 4,
  VALIDATION_FAILED : 5,
  NO_LDAP_USERNAME : 6,
  INCORRECT_GROUPS : 7,
  MISSING_CUSTOMER : 8,
  NO_GROUPS : 9,
  DUPLICATE_ASSIGNMENT : 10,
  UNABLE_TO_CREATE_USER_ASSIGNMENT : 11,
};

export const TRACER_USAGE = {
  human : 0,
  animal : 1,
  other : 2,
};

export const URL_ACTIVITY_PDF_BASE_PATH = "activtity_pdfs";
export const URL_INDEX = "";
export const URL_INJECTION_PDF_BASE_PATH = "injection_pdfs";
export const URL_SHOP_MANUAL = "shop_manual";

export const WARNING_DUPLICATED_BOOKINGS = "duplicated_bookings";

export const WEBSOCKET_DATA = "data";
export const WEBSOCKET_DATATYPE = "datatype";
export const WEBSOCKET_DATA_ID = "dataID";
export const WEBSOCKET_DATE = "date";
export const WEBSOCKET_DEAD_ORDERS = "deadOrders";
export const WEBSOCKET_ERROR = "error";
export const WEBSOCKET_EVENT_TYPE = "type";
export const WEBSOCKET_JAVASCRIPT_VERSION = "javascriptVersion";
export const WEBSOCKET_MESSAGE_AUTH_LOGIN = "login";
export const WEBSOCKET_MESSAGE_AUTH_LOGOUT = "logout";
export const WEBSOCKET_MESSAGE_AUTH_RESPONSE = "authResponse";
export const WEBSOCKET_MESSAGE_AUTH_WHOAMI = "whoami";
export const WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD = "changeExternalPassword";
export const WEBSOCKET_MESSAGE_CORRECT_ORDER = "correctOrder";
export const WEBSOCKET_MESSAGE_CREATE_BOOKING = "delete_booking";
export const WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER = "createExternalUser";
export const WEBSOCKET_MESSAGE_CREATE_INJECTION_ORDER = "createInjectionOrder";
export const WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT = "createUserAssignment";
export const WEBSOCKET_MESSAGE_DEBUG_MESSAGE = "debugMessage";
export const WEBSOCKET_MESSAGE_DELETE_BOOKING = "create_booking";
export const WEBSOCKET_MESSAGE_DELETE_STATE = "deleteState";
export const WEBSOCKET_MESSAGE_ERROR = "error";
export const WEBSOCKET_MESSAGE_FREE_ACTIVITY = "freeActivity";
export const WEBSOCKET_MESSAGE_FREE_INJECTION = "freeInjection";
export const WEBSOCKET_MESSAGE_GET_HISTORY = "history";
export const WEBSOCKET_MESSAGE_GET_ORDERS = "getOrders";
export const WEBSOCKET_MESSAGE_ID = "message_id";
export const WEBSOCKET_MESSAGE_LOG_ERROR = "logError";
export const WEBSOCKET_MESSAGE_MASS_ORDER = "massOrder";
export const WEBSOCKET_MESSAGE_MODEL_CREATE = "createModel";
export const WEBSOCKET_MESSAGE_MODEL_DELETE = "deleteModel";
export const WEBSOCKET_MESSAGE_MODEL_EDIT = "editModel";
export const WEBSOCKET_MESSAGE_MOVE_ORDERS = "moveOrder";
export const WEBSOCKET_MESSAGE_ORDER_INJECTION = "OrderInjection";
export const WEBSOCKET_MESSAGE_READ_BOOKINGS = "readBookings";
export const WEBSOCKET_MESSAGE_READ_STATE = "readState";
export const WEBSOCKET_MESSAGE_READ_TELEMETRY = "readTelemetry";
export const WEBSOCKET_MESSAGE_RELEASE_MULTI = "releaseMulti";
export const WEBSOCKET_MESSAGE_RESTART_VIAL_DOG = "restartVialDog";
export const WEBSOCKET_MESSAGE_RESTORE_ORDERS = "restoreOrders";
export const WEBSOCKET_MESSAGE_STATUS = "status";
export const WEBSOCKET_MESSAGE_SUCCESS = "success";
export const WEBSOCKET_MESSAGE_TEST_PRINTER = "testPrinter";
export const WEBSOCKET_MESSAGE_TYPE = "messageType";
export const WEBSOCKET_MESSAGE_TYPES = {
  WEBSOCKET_MESSAGE_AUTH_LOGIN : WEBSOCKET_MESSAGE_AUTH_LOGIN,
  WEBSOCKET_MESSAGE_AUTH_LOGOUT : WEBSOCKET_MESSAGE_AUTH_LOGOUT,
  WEBSOCKET_MESSAGE_AUTH_WHOAMI : WEBSOCKET_MESSAGE_AUTH_WHOAMI,
  WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT : WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT,
  WEBSOCKET_MESSAGE_DEBUG_MESSAGE : WEBSOCKET_MESSAGE_DEBUG_MESSAGE,
  WEBSOCKET_MESSAGE_GET_ORDERS : WEBSOCKET_MESSAGE_GET_ORDERS,
  WEBSOCKET_MESSAGE_READ_STATE : WEBSOCKET_MESSAGE_READ_STATE,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
  WEBSOCKET_MESSAGE_FREE_INJECTION : WEBSOCKET_MESSAGE_FREE_INJECTION,
  WEBSOCKET_MESSAGE_MODEL_CREATE : WEBSOCKET_MESSAGE_MODEL_CREATE,
  WEBSOCKET_MESSAGE_MODEL_DELETE : WEBSOCKET_MESSAGE_MODEL_DELETE,
  WEBSOCKET_MESSAGE_MODEL_EDIT : WEBSOCKET_MESSAGE_MODEL_EDIT,
  WEBSOCKET_MESSAGE_MASS_ORDER : WEBSOCKET_MESSAGE_MASS_ORDER,
  WEBSOCKET_MESSAGE_READ_BOOKINGS : WEBSOCKET_MESSAGE_READ_BOOKINGS,
  WEBSOCKET_MESSAGE_READ_TELEMETRY : WEBSOCKET_MESSAGE_READ_TELEMETRY,
  WEBSOCKET_MESSAGE_MOVE_ORDERS : WEBSOCKET_MESSAGE_MOVE_ORDERS,
  WEBSOCKET_MESSAGE_RESTORE_ORDERS : WEBSOCKET_MESSAGE_RESTORE_ORDERS,
  WEBSOCKET_MESSAGE_LOG_ERROR : WEBSOCKET_MESSAGE_LOG_ERROR,
  WEBSOCKET_MESSAGE_RESTART_VIAL_DOG : WEBSOCKET_MESSAGE_RESTART_VIAL_DOG,
  WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD : WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
  WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER : WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,
  WEBSOCKET_MESSAGE_TEST_PRINTER : WEBSOCKET_MESSAGE_TEST_PRINTER,
  WEBSOCKET_MESSAGE_RELEASE_MULTI : WEBSOCKET_MESSAGE_RELEASE_MULTI,
  WEBSOCKET_MESSAGE_CORRECT_ORDER : WEBSOCKET_MESSAGE_CORRECT_ORDER,
};
export const WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE = "updatePrivilegedState";
export const WEBSOCKET_MESSAGE_UPDATE_STATE = "updateState";
export const WEBSOCKET_OBJECT_DOES_NOT_EXISTS = "objectDoesNotExists";
export const WEBSOCKET_REFRESH = "refresh";
export const WEBSOCKET_SEND_EVENT = "sendEvent";
export const WEBSOCKET_SERVER_MESSAGES = {
  WEBSOCKET_MESSAGE_CREATE_BOOKING : WEBSOCKET_MESSAGE_CREATE_BOOKING,
  WEBSOCKET_MESSAGE_DELETE_BOOKING : WEBSOCKET_MESSAGE_DELETE_BOOKING,
  WEBSOCKET_MESSAGE_AUTH_RESPONSE : WEBSOCKET_MESSAGE_AUTH_RESPONSE,
  WEBSOCKET_MESSAGE_AUTH_LOGOUT : WEBSOCKET_MESSAGE_AUTH_LOGOUT,
  WEBSOCKET_MESSAGE_ERROR : WEBSOCKET_MESSAGE_ERROR,
  WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE : WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,
  WEBSOCKET_MESSAGE_UPDATE_STATE : WEBSOCKET_MESSAGE_UPDATE_STATE,
  WEBSOCKET_MESSAGE_READ_TELEMETRY : WEBSOCKET_MESSAGE_READ_TELEMETRY,
  WEBSOCKET_MESSAGE_READ_BOOKINGS : WEBSOCKET_MESSAGE_READ_BOOKINGS,
  WEBSOCKET_MESSAGE_READ_STATE : WEBSOCKET_MESSAGE_READ_STATE,
  WEBSOCKET_MESSAGE_DELETE_STATE : WEBSOCKET_MESSAGE_DELETE_STATE,
};
export const WEBSOCKET_SESSION_ID = "session_id";
export const WEBSOCKET_UPDATE_SERVER_CONFIG = "updateServerConfig";
