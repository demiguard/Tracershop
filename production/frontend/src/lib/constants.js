export const JAVASCRIPT_VERSION = "1.0.1";

export const TRACER_TYPE_ACTIVITY = 1;
export const TRACER_TYPE_DOSE = 2;
export const DAYS_PER_WEEK = 7;
// Note that to correct day from date.getDay -> (date.getDate() + 6) % 7
export const DAYS = { // So in the modern part of the world, aka the ones that use metric units, the first day of the week is Monday
  MONDAY : 0,
  TUESDAY : 1,
  WENDSDAY : 2,
  THURSDAY : 3,
  FRIDAY : 4,
  SATURDAY : 5,
  SUNDAY : 6,
}
export const DAYS_OBJECTS = [ // THIS IS THE SERVER SIDE REPRESENTATION OF DAYS
  {name : "Mandag", day : 1}, // YES IT'S FUCKING WRONG
  {name : "Tirsdag", day : 2},
  {name : "Onsdag", day : 3},
  {name : "Torsdag", day : 4},
  {name : "Fredag", day : 5},
  {name : "Lørdag", day : 6},
  {name : "Søndag", day : 7},
]

export const DEADLINE_TYPES = {
  DAILY : 0,
  WEEKLY : 1,
}


export const USER_GROUPS = {
  ANON : 0,
  ADMIN : 1,
  PRODUCTION_ADMIN : 2,
  PRODUCTION_USER : 3,
  SHOP_ADMIN : 4,
  SHOP_USER : 5,
  SHOP_EXTERNAL : 6
}

export const WEEKLY_REPEAT_CHOICES = {
  ALL : 0,
  EVEN : 1,
  ODD : 2,
}

/**
 * Enum describing options of an Injections order usage field
 * @enum {string}
 */
export const INJECTION_USAGE = {
  "1" : "Human",
  "2" : "Dyr",
  "3" : "Andet",
}


export const ERROR_BACKGROUND_COLOR = "#FF4422";
export const cssCenter = {
  display : "block",
  margin: 'auto',
  alignItems: 'center',
  textAlign: 'center'
}


// Shared Constants
export const AUTH_USERNAME         = "username";
export const AUTH_PASSWORD         = "password";
export const AUTH_DETAIL           = "detail";
export const AUTH_IS_AUTHENTICATED = "isAuthenticated";
export const AUTH_USER_ID = "user_id";

// Error strings
export const ERROR_INVALID_AUTH = "InvalidAuth"
export const ERROR_INVALID_DATACLASS_TYPE = "NoDataClass"
export const ERROR_INVALID_JAVASCRIPT_VERSION = "InvalidJavascriptVersion"
export const ERROR_INVALID_MESSAGE = "InvalidMessage"
export const ERROR_INVALID_MESSAGE_TYPE = "InvalidMessageType"
export const ERROR_OBJECT_NOT_FOUND = "objectNotFound"
export const ERROR_NO_JAVASCRIPT_VERSION = "NoJavaScriptVersion"
export const ERROR_NO_MESSAGE_ID = "NoMessageID"
export const ERROR_NO_MESSAGE_STATUS = "NoMessageStatus";
export const ERROR_NO_MESSAGE_TYPE = "NoMessageType"
export const ERROR_INSUFFICIENT_PERMISSIONS = "InsufficientPermissions"
export const ERROR_INSUFFICIENT_DATA = "InsufficientData";
export const ERROR_UNKNOWN_FAILURE = "unknownError";
export const ERROR_UNHANDLED_USER_GROUP = "UnhandledUserGroup";



// JSON - refers to a keyword in a json object
export const JSON_ACTIVITY_ORDER = "orders";
export const JSON_ACTIVE_DATABASE = "active_database";
export const JSON_ADDRESS  = "address";
export const JSON_AUTH = "auth";
export const JSON_CLOSED_DATE = "closeddate";
export const JSON_CUSTOMER  = "customer";
export const JSON_DATABASE = "database";
export const JSON_DEADLINE = "deadline"
export const JSON_DELIVER_TIME = "deliverTimes";
export const JSON_EMPLOYEE = "employee";
export const JSON_FIELD_TO_UPDATE = "FieldToUpdate";
export const JSON_GHOST_ORDER = "ghostOrder";
export const JSON_GREAT_STATE = "GREATSTATE";
export const JSON_INJECTION_ORDER = "t_orders";
export const JSON_ISOTOPE = "isotopes";
export const JSON_ORDERS  = "orders";
export const JSON_PRODUCTION = "production";
export const JSON_RUN = "run";
export const JSON_TRACER = "tracer";
export const JSON_TRACER_MAPPING = "tracer_mapping";
export const JSON_SERVER_CONFIG = "server_config";
export const JSON_VIAL = "vial";
export const JSON_SECONDARY_EMAIL = "secondaryEmail";
export const JSON_PROCEDURE = "procedure";
export const JSON_USER = "user";
export const JSON_USER_ASSIGNMENT = "userAssignment";
export const JSON_MESSAGE = "message";
export const JSON_MESSAGE_ASSIGNMENT = "messageAssignment";
export const JSON_ENDPOINT = "deliveryEndpoint";
export const JSON_LOCATION = "location";
export const JSON_BOOKING = "booking";


export const JSON_KEYWORDS = [
  JSON_ADDRESS,
  JSON_ACTIVITY_ORDER,
  JSON_BOOKING,
  JSON_CLOSED_DATE,
  JSON_CUSTOMER,
  JSON_DATABASE,
  JSON_DEADLINE,
  JSON_DELIVER_TIME,
  JSON_ENDPOINT,
  JSON_INJECTION_ORDER,
  JSON_ISOTOPE,
  JSON_LOCATION,
  JSON_MESSAGE,
  JSON_MESSAGE_ASSIGNMENT,
  JSON_TRACER,
  JSON_TRACER_MAPPING,
  JSON_PROCEDURE,
  JSON_PRODUCTION,
  JSON_SECONDARY_EMAIL,
  JSON_SERVER_CONFIG,
  JSON_USER,
  JSON_USER_ASSIGNMENT,
  JSON_VIAL,
]

//Keywords - Refers to a keyword with in a data class
export const LEGACY_KEYWORD_ACTIVITY = "activity";
export const LEGACY_KEYWORD_ADDRESS_1 = "addr1";
export const LEGACY_KEYWORD_ADDRESS_2 = "addr2";
export const LEGACY_KEYWORD_ADDRESS_3 = "addr3";
export const LEGACY_KEYWORD_ADDRESS_4 = "addr4";
export const LEGACY_KEYWORD_AMOUNT = "amount";
export const LEGACY_KEYWORD_AMOUNT_O = "amount_o";
export const LEGACY_KEYWORD_BID = "BID";
export const LEGACY_KEYWORD_BATCHNR = "batchnr";
export const LEGACY_KEYWORD_CHARGE = "charge";
export const LEGACY_KEYWORD_COID = "COID";
export const LEGACY_KEYWORD_COMMENT = "comment";
export const LEGACY_KEYWORD_CONTACT = "contact";
export const LEGACY_KEYWORD_CUSTOMER = "customer";
export const LEGACY_KEYWORD_CUSTOMER_ID = "customer_id";
export const LEGACY_KEYWORD_CUSTOMER_NUMBER = "kundenr";
export const LEGACY_KEYWORD_CUSTOMER_USERNAME = "UserName"; // This exists because legacy reasons
export const LEGACY_KEYWORD_DAY = "day";
export const LEGACY_KEYWORD_DDATE = "ddate";
export const LEGACY_KEYWORD_DELIVER_DATETIME = "deliver_datetime";
export const LEGACY_KEYWORD_DELIVER_TIME = "dtime";
export const LEGACY_KEYWORD_DELIVER_TIME_ID = "DTID";
export const LEGACY_KEYWORD_EMAIL_1 = "email";
export const LEGACY_KEYWORD_EMAIL_2 = "email2";
export const LEGACY_KEYWORD_EMAIL_3 = "email3";
export const LEGACY_KEYWORD_EMAIL_4 = "email4";
export const LEGACY_KEYWORD_FILLDATE = "filldate";
export const LEGACY_KEYWORD_FILLTIME = "filltime";
export const LEGACY_KEYWORD_FREED_BY = "frigivet_af";
export const LEGACY_KEYWORD_FREED_AMOUNT = "frigivet_amount";
export const LEGACY_KEYWORD_FREED_DATETIME = "frigivet_datetime";
export const LEGACY_KEYWORD_HALFLIFE = "halflife";
export const LEGACY_KEYWORD_ID = "ID";
export const LEGACY_KEYWORD_INJECTIONS = "n_injections";
export const LEGACY_KEYWORD_IN_USE = "in_use";
export const LEGACY_KEYWORD_ISOTOPE = "isotope";
export const LEGACY_KEYWORD_LONG_NAME = "longName";
export const LEGACY_KEYWORD_NAME = "name";
export const LEGACY_KEYWORD_OID = "oid";
export const LEGACY_KEYWORD_ORDER_ID = "order_id";
export const LEGACY_KEYWORD_ORDER_BLOCK = "order_block";
export const LEGACY_KEYWORD_OVERHEAD = "overhead";
export const LEGACY_KEYWORD_PRODUCTION_ID = "PTID";
export const LEGACY_KEYWORD_PRODUCTION_TIME = "ptime";
export const LEGACY_KEYWORD_REAL_NAME = "Realname";
export const LEGACY_KEYWORD_REPEAT = "repeat_t";
export const LEGACY_KEYWORD_RUN = "run";
export const LEGACY_KEYWORD_STATUS = "status";
export const LEGACY_KEYWORD_TELEFON_NUMBER = "tlf";
export const LEGACY_KEYWORD_TOTAL_AMOUNT = "total_amount";
export const LEGACY_KEYWORD_TOTAL_AMOUNT_O = "total_amount_o";
export const LEGACY_KEYWORD_TRACER = "tracer";
export const LEGACY_KEYWORD_TRACER_ID = "tracer_id";
export const LEGACY_KEYWORD_TRACER_TYPE = "tracer_type";
export const LEGACY_KEYWORD_USAGE = "anvendelse";
export const LEGACY_KEYWORD_USERGROUP = "usergroup"
export const LEGACY_KEYWORD_USERNAME = "username";
export const LEGACY_KEYWORD_VOLUME = "volume";

// WEBSOCKET MESSAGES

// WEBSOCKET KEYWORD HAVE STRUCTURED NAMING
// IF THE KEYWORD IS GLOBAL TO ALL SITES, IT'S WEBSOCKET_<KW>
// A LARGE AMOUNT OF KEYWORDS ARE MESSAGE AND ARE GIVEN BY
// WEBSOCKET_MESSAGE_<SITE>_<SITE_SPECIFIC_KW>
// IF A MESSAGE GLOBAL TO ALL SITE IT'S
// WEBSOCKET_MESSAGE_<MESSAGE_KW>

export const WEBSOCKET_DATA                 = "data";
export const WEBSOCKET_DATATYPE             = "datatype";
export const WEBSOCKET_DATA_ID              = "dataID";
export const WEBSOCKET_DATE                 = "date";
export const WEBSOCKET_DEAD_ORDERS          = "deadOrders";
export const WEBSOCKET_ERROR                = "error";
export const WEBSOCKET_JAVASCRIPT_VERSION   = "javascriptVersion";
export const WEBSOCKET_MESSAGE_ANSWER       = "answer";
export const WEBSOCKET_MESSAGE_AUTH_LOGIN   = "login";
export const WEBSOCKET_MESSAGE_AUTH_LOGOUT  = "logout";
export const WEBSOCKET_MESSAGE_AUTH_WHOAMI  = "whoami";
export const WEBSOCKET_MESSAGE_CREATE_DATA_CLASS = "createDataClass";
export const WEBSOCKET_MESSAGE_DELETE_DATA_CLASS = "deleteDataClass";
export const WEBSOCKET_MESSAGE_ECHO         = "echo";
export const WEBSOCKET_MESSAGE_EDIT_STATE   = "editState";
export const WEBSOCKET_MESSAGE_EDIT_DJANGO  = "editDjango";
export const WEBSOCKET_MESSAGE_FREE_ACTIVITY = "freeActivity";
export const WEBSOCKET_MESSAGE_FREE_INJECTION = "freeInjection";
export const WEBSOCKET_MESSAGE_FREE_ORDER = "freeOrder";
export const WEBSOCKET_MESSAGE_GET_HISTORY  = "history";
export const WEBSOCKET_MESSAGE_GET_ORDERS   = "getOrders";
export const WEBSOCKET_MESSAGE_GREAT_STATE  = "getGREATState";
export const WEBSOCKET_MESSAGE_GET_STATE  = "getState";
export const WEBSOCKET_MESSAGE_ID           = "messageID";
export const WEBSOCKET_MESSAGE_MASS_ORDER   = "massOrder";
export const WEBSOCKET_MESSAGE_ORDER_ACTIVITY = "OrderActivity";
export const WEBSOCKET_MESSAGE_ORDER_INJECTION = "OrderInjection";
export const WEBSOCKET_MESSAGE_MODEL_CREATE = "createModel";
export const WEBSOCKET_MESSAGE_MODEL_DELETE = "deleteModel";
export const WEBSOCKET_MESSAGE_MODEL_EDIT   = "editModel";
export const WEBSOCKET_MESSAGE_CREATE_ACTIVITY_ORDER = "createActivityOrder";
export const WEBSOCKET_MESSAGE_CREATE_INJECTION_ORDER = "createActivityOrder";
export const WEBSOCKET_MESSAGE_MOVE_ORDERS  = "moveOrder";
export const WEBSOCKET_MESSAGE_RESTORE_ORDERS = "restoreOrders";
export const WEBSOCKET_MESSAGE_SUCCESS      = "success";
export const WEBSOCKET_MESSAGE_TYPE         = "messageType";
export const WEBSOCKET_MESSAGE_UPDATE_STATE = "updateState";
export const WEBSOCKET_REFRESH              = "refresh";
export const WEBSOCKET_SEND_EVENT           = "sendEvent";
export const WEBSOCKET_SESSION_ID           = "sessionid";
export const WEBSOCKET_EVENT_TYPE           = "type";
export const WEBSOCKET_UPDATE_SERVERCONFIG  = "updateServerConfig";


// BETTER MESSAGE CONSTANTS

//export const WEBSOCKET_MESSAGE_SHOP_CREATE_ORDER = "shopCreateOrder"
// Remember to add these to local_storage_driver -> types
// Javascript unique constants
export const DATABASE_ACTIVE_TRACER = "activeTracer";
export const DATABASE_ACTIVITY_ORDER = JSON_ACTIVITY_ORDER;
export const DATABASE_ADMIN_PAGE = "adminPage";
export const DATABASE_ADDRESS = JSON_ADDRESS;
export const DATABASE_CUSTOMER = JSON_CUSTOMER;
export const DATABASE_CLOSED_DATE = JSON_CLOSED_DATE;
export const DATABASE_DATABASE = JSON_DATABASE;
export const DATABASE_DELIVER_TIME = JSON_DELIVER_TIME;
export const DATABASE_EMPLOYEE = JSON_EMPLOYEE;
export const DATABASE_INJECTION_ORDER = JSON_INJECTION_ORDER
export const DATABASE_ISOTOPE = JSON_ISOTOPE;
export const DATABASE_IS_AUTH = "isAuth";
export const DATABASE_LAST_UPDATED = "lastUpdated";
export const DATABASE_PRODUCTION = JSON_RUN;
export const DATABASE_TODAY = "today";
export const DATABASE_TRACER = JSON_TRACER;
export const DATABASE_TRACER_MAPPING = JSON_TRACER_MAPPING;
export const DATABASE_SERVER_CONFIG = JSON_SERVER_CONFIG;
export const DATABASE_VIAL = JSON_VIAL;
export const DATABASE_CURRENT_USER = "current_user"

export const DATABASE_SHOP_CUSTOMER = "shopCustomer";
export const DATABASE_SHOP_ACTIVE_ENDPOINT = "shop_active_endpoint"
export const DATABASE_SHOP_ORDER_PAGE = "shop_order_page"


export const ERROR_TYPE_HINT = "hint";
export const ERROR_TYPE_WARNING = "warning";
export const ERROR_TYPE_ERROR = "error";

export const PROP_LOGOUT = "logout";
export const PROP_NAVBAR_ELEMENTS = "NavbarElements";
export const PROP_WEBSOCKET = "websocket";
export const PROP_USER = DATABASE_CURRENT_USER;
export const PROP_SET_USER = "set_user";
export const PROP_TRACERSHOP_SITE = "tracershop_site";
export const PROP_ACTIVE_CUSTOMER = "active_customer";
export const PROP_ACTIVE_DATE = "active_date";
export const PROP_ACTIVE_ENDPOINT = "active_endpoint";
export const PROP_ACTIVE_PRODUCTION = "active_production";
export const PROP_ACTIVE_TRACER = "active_tracer";
export const PROP_ACTIVE_TIME_SLOTS = "active_timeSlots";
export const PROP_MODAL_ORDER = "modal_order"
export const PROP_ON_CLICK = 'on_click';
export const PROP_TIME_SLOT_ID = 'timeSlotID';
export const PROP_ORDER_MAPPING = 'order_mapping';
export const PROP_ON_CLOSE = 'on_close';
export const PROP_TIME_SLOT_MAPPING = 'timeSlotMapping';
export const PROP_EXPIRED_ACTIVITY_DEADLINE = 'activityDeadlineExpired';
export const PROP_EXPIRED_INJECTION_DEADLINE = 'injectionDeadlineExpired';
export const PROP_ASSOCIATED_TIME_SLOTS = "associated_time_slots";
export const PROP_ASSOCIATED_ORDERS = "associated_orders";
export const PROP_OVERHEAD_MAP = "overhead_map";

export const KEYWORD_ID = 'id'

export const CALENDER_PROP_DATE = "calender_date";
export const CALENDER_PROP_GET_COLOR = "calender_get_color";
export const CALENDER_PROP_ON_DAY_CLICK = "calender_on_day_click";
export const CALENDER_PROP_ON_MONTH_CHANGE = "calender_on_month_change";

export const WEEKLY_TIME_TABLE_PROP_ENTRIES = "time_table_entries"
export const WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK = "time_table_entry_onclick"
export const WEEKLY_TIME_TABLE_PROP_DAY_GETTER = "day_function";
export const WEEKLY_TIME_TABLE_PROP_INNER_TEXT = "inner_text_function"
export const WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR = "color_function";
export const WEEKLY_TIME_TABLE_PROP_HOUR_GETTER = "hour_function";
