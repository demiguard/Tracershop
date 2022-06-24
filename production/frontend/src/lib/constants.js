export const TRACER_TYPE_ACTIVITY = 1
export const TRACER_TYPE_DOSE     = 2
export const DAYS_PER_WEEK = 7
export const DAYS = {
  MONDAY : 0,
  TUESDAY : 1,
  WENDSDAY : 2,
  THURSDAY : 3,
  FRIDAY : 4,
  SATURDAY : 5,
  SUNDAY : 6,
}



// Shared Constants

export const AUTH_USERNAME         = "username";
export const AUTH_PASSWORD         = "password";
export const AUTH_DETAIL           = "detail";
export const AUTH_IS_AUTHENTICATED = "isAuthenticated";

// JSON - refers to a keyword in a json object
export const JSON_ACTIVITY_ORDER = "orders";
export const JSON_ACTIVE_DATABASE = "active_database";
export const JSON_ADDRESS  = "address";
export const JSON_CUSTOMER  = "customer";
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
export const KEYWORD_CUSTOMER_NUMBER = "kundenr";
export const KEYWORD_CUSTOMER_USERNAME = "UserName"; // This exists because legacy reasons
export const KEYWORD_DAY = "day";
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
export const KEYWORD_ORDERMAP = "OrderMap";
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
export const KEYWORD_TRACER_TYPE = "tracer_type";
export const KEYWORD_USAGE = "anvendelse";
export const KEYWORD_USERNAME = "username";
export const KEYWORD_VOLUME = "volume";

// WEBSOCKET MESSAGES
export const WEBSOCKET_DATA                 = "data";
export const WEBSOCKET_DATATYPE             = "datatype";
export const WEBSOCKET_DATA_ID              = "dataID";
export const WEBSOCKET_DEAD_ORDERS     = "deadOrders";
export const WEBSOCKET_DATE                 = "date";
export const WEBSOCKET_MESSAGE_TYPE          = "messageType";
export const WEBSOCKET_MESSAGE_CREATE_DATA_CLASS = "createDataClass";
export const WEBSOCKET_MESSAGE_DELETE_DATA_CLASS = "deleteDataClass";
export const WEBSOCKET_MESSAGE_FREE_ORDER   = "freeOrder";
export const WEBSOCKET_MESSAGE_UPDATEORDERS = "updateOrder";
export const WEBSOCKET_MESSAGE_GREAT_STATE  = "getGREATState";
export const WEBSOCKET_MESSAGE_RECIEVE_VIAL = "recieveVial";
export const WEBSOCKET_MESSAGE_EDIT_STATE   = "editState";
export const WEBSOCKET_SEND_EVENT           = "sendEvent";
export const WEBSOCKET_EVENT_TYPE           = "type";
export const WEBSOCKET_MESSAGE_MOVE_ORDERS  = "moveOrder";
export const WEBSOCKET_MESSAGE_ECHO         = "echo";
export const WEBSOCKET_MESSAGE_GET_ORDERS   = "getOrders";
export const WEBSOCKET_UPDATE_SERVERCONFIG  = "updateServerConfig";

// Javascript unique constants

export const DATABASE_ACTIVE_TRACER = "activeTracer";
export const DATABASE_ACTIVITY_ORDER = JSON_ACTIVITY_ORDER;
export const DATABASE_ADDRESS = "address";
export const DATABASE_CUSTOMER = JSON_CUSTOMER;
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
export const DATABASE_SERVER_CONFIG = "serverConfig";
export const DATABASE_VIAL = JSON_VIAL;