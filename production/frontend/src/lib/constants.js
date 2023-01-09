export const JAVASCRIPT_VERSION = "1.0.1";

export const TRACER_TYPE_ACTIVITY = 1;
export const TRACER_TYPE_DOSE = 2;
export const DAYS_PER_WEEK = 7;
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


export const USERGROUPS = {
  ANON : 0,
  ADMIN : 1,
  PRODUCTION_ADMIN : 2,
  PRODUCTION_USER : 3,
  SHOP_ADMIN : 4,
  SHOP_USER : 5,
  SHOP_EXTERNAL : 6
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


// Shared Constants
export const AUTH_USERNAME         = "username";
export const AUTH_PASSWORD         = "password";
export const AUTH_DETAIL           = "detail";
export const AUTH_IS_AUTHENTICATED = "isAuthenticated";

// Error strings
export const ERROR_INVALID_AUTH = "InvalidAuth"
export const ERROR_INVALID_DATACLASS_TYPE = "NoDataClass"
export const ERROR_INVALID_JAVASCRIPT_VERSION = "InvalidJavascriptVersion"
export const ERROR_INVALID_MESSAGE = "InvalidMessage"
export const ERROR_INVALID_MESSAGE_TYPE = "InvalidMessageType"
export const ERROR_OBJECT_NOT_FOUND = "objectNotFound"
export const ERROR_NO_JAVASCRIPT_VERSION = "NoJavaScriptVersion"
export const ERROR_NO_MESSAGE_ID = "NoMessageID"
export const ERROR_NO_MESSAGE_TYPE = "NoMessageType"
export const ERROR_INSUFFICIENT_PERMISSIONS = "InsufficientPermissions"
export const ERROR_INSUFFICIENT_DATA = "InsufficientData"
export const ERROR_UNKNOWN_FAILURE = "unknownError"



// JSON - refers to a keyword in a json object
export const JSON_ACTIVITY_ORDER = "orders";
export const JSON_ACTIVE_DATABASE = "active_database";
export const JSON_ADDRESS  = "address";
export const JSON_AUTH = "auth"
export const JSON_CUSTOMER  = "customer";
export const JSON_CLOSEDDATE = "closeddate";
export const JSON_DATABASE = "database";
export const JSON_DELIVERTIME = "deliverTimes";
export const JSON_EMPLOYEE = "employee";
export const JSON_FIELD_TO_UPDATE = "FieldToUpdate";
export const JSON_GHOST_ORDER = "ghostOrder";
export const JSON_GREAT_STATE = "GREATSTATE";
export const JSON_INJECTION_ORDER = "t_orders";
export const JSON_ISOTOPE = "isotopes";
export const JSON_PRODUCTION = "production";
export const JSON_RUN = "run";
export const JSON_TRACER = "tracer"
export const JSON_TRACER_MAPPING = "tracer_mapping";
export const JSON_SERVER_CONFIG = "server_config";
export const JSON_VIAL = "vial";
export const JSON_VIAL_MAPPING = "vial_mapping";


//Keywords - Refers to a keyword with in a data class
export const KEYWORD_ACTIVITY = "activity";
export const KEYWORD_ADDRESS_1 = "addr1";
export const KEYWORD_ADDRESS_2 = "addr2";
export const KEYWORD_ADDRESS_3 = "addr3";
export const KEYWORD_ADDRESS_4 = "addr4";
export const KEYWORD_AMOUNT = "amount";
export const KEYWORD_AMOUNT_O = "amount_o";
export const KEYWORD_BID = "BID";
export const KEYWORD_BATCHNR = "batchnr";
export const KEYWORD_CHARGE = "charge";
export const KEYWORD_COID = "COID";
export const KEYWORD_COMMENT = "comment";
export const KEYWORD_CONTACT = "contact";
export const KEYWORD_CUSTOMER = "customer";
export const KEYWORD_CUSTOMER_ID = "customer_id";
export const KEYWORD_CUSTOMER_NUMBER = "kundenr";
export const KEYWORD_CUSTOMER_USERNAME = "UserName"; // This exists because legacy reasons
export const KEYWORD_DAY = "day";
export const KEYWORD_DDATE = "ddate";
export const KEYWORD_DELIVER_DATETIME = "deliver_datetime";
export const KEYWORD_DELIVER_TIME = "dtime";
export const KEYWORD_DELIVER_TIME_ID = "DTID";
export const KEYWORD_EMAIL_1 = "email";
export const KEYWORD_EMAIL_2 = "email2";
export const KEYWORD_EMAIL_3 = "email3";
export const KEYWORD_EMAIL_4 = "email4";
export const KEYWORD_FILLDATE = "filldate";
export const KEYWORD_FILLTIME = "filltime";
export const KEYWORD_FREED_BY = "frigivet_af";
export const KEYWORD_FREED_AMOUNT = "frigivet_amount";
export const KEYWORD_FREED_DATETIME = "frigivet_datetime";
export const KEYWORD_HALFLIFE = "halflife";
export const KEYWORD_ID = "ID";
export const KEYWORD_INJECTIONS = "n_injections";
export const KEYWORD_IN_USE = "in_use";
export const KEYWORD_ISOTOPE = "isotope";
export const KEYWORD_LONG_NAME = "longName";
export const KEYWORD_NAME = "name";
export const KEYWORD_OID = "oid";
export const KEYWORD_ORDER_ID = "order_id";
export const KEYWORD_ORDER_BLOCK = "order_block";
export const KEYWORD_OVERHEAD = "overhead";
export const KEYWORD_PRODUCTION_ID = "PTID";
export const KEYWORD_PRODUCTION_TIME = "ptime";
export const KEYWORD_REAL_NAME = "Realname";
export const KEYWORD_REPEAT = "repeat_t";
export const KEYWORD_RUN = "run";
export const KEYWORD_STATUS = "status";
export const KEYWORD_TELEFON_NUMBER = "tlf";
export const KEYWORD_TOTAL_AMOUNT = "total_amount";
export const KEYWORD_TOTAL_AMOUNT_O = "total_amount_o";
export const KEYWORD_TRACER = "tracer";
export const KEYWORD_TRACER_ID = "tracer_id";
export const KEYWORD_TRACER_TYPE = "tracer_type";
export const KEYWORD_USAGE = "anvendelse";
export const KEYWORD_USERGROUP = "usergroup"
export const KEYWORD_USERNAME = "username";
export const KEYWORD_VOLUME = "volume";

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
export const WEBSOCKET_MESSAGE_GET_HISTORY  = "history";
export const WEBSOCKET_MESSAGE_GET_ORDERS   = "getOrders";
export const WEBSOCKET_MESSAGE_GREAT_STATE  = "getGREATState";
export const WEBSOCKET_MESSAGE_ID           = "messageID";
export const WEBSOCKET_MESSAGE_MOVE_ORDERS  = "moveOrder";
export const WEBSOCKET_MESSAGE_SUCCESS      = "success";
export const WEBSOCKET_MESSAGE_TYPE         = "messageType";
export const WEBSOCKET_SEND_EVENT           = "sendEvent";
export const WEBSOCKET_SESSION_ID           = "sessionid";
export const WEBSOCKET_EVENT_TYPE           = "type";
export const WEBSOCKET_UPDATE_SERVERCONFIG  = "updateServerConfig";

// BETTER MESSAGE CONSTANTS

//export const WEBSOCKET_MESSAGE_SHOP_CREATE_ORDER = "shopCreateOrder"

// Javascript unique constants
export const DATABASE_ACTIVE_TRACER = "activeTracer";
export const DATABASE_ACTIVITY_ORDER = JSON_ACTIVITY_ORDER;
export const DATABASE_ADMIN_PAGE = "adminPage";
export const DATABASE_ADDRESS = "address";
export const DATABASE_CUSTOMER = JSON_CUSTOMER;
export const DATABASE_CLOSEDDATE = JSON_CLOSEDDATE;
export const DATABASE_DATABASE = "database";
export const DATABASE_DELIVER_TIME = JSON_DELIVERTIME;
export const DATABASE_EMPLOYEE = JSON_EMPLOYEE;
export const DATABASE_INJECTION_ORDER = JSON_INJECTION_ORDER
export const DATABASE_ISOTOPE = JSON_ISOTOPE;
export const DATABASE_IS_AUTH = "isAuth";
export const DATABASE_LAST_UPDATED = "lastUpdated";
export const DATABASE_PRODUCTION = JSON_RUN;
export const DATABASE_TODAY = "today";
export const DATABASE_TRACER = JSON_TRACER;
export const DATABASE_TRACER_MAPPING = JSON_TRACER_MAPPING;
export const DATABASE_SERVER_CONFIG = "serverConfig";
export const DATABASE_SHOP_CUSTOMER = "shopCustomer";
export const DATABASE_VIAL = JSON_VIAL;
export const DATABASE_USER = "user"

export const ERROR_TYPE_HINT = "hint";
export const ERROR_TYPE_WARNING = "warning";
export const ERROR_TYPE_ERROR = "error";
