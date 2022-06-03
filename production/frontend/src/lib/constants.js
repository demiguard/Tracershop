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

export const AUTH_USERNAME         = "username";
export const AUTH_PASSWORD         = "password";
export const AUTH_DETAIL           = "detail";
export const AUTH_IS_AUTHENTICATED = "isAuthenticated";

// This is JSON key word used in all communication between the server and client.
// you shound find these in production/constants.py
export const JSON_ACTIVITY_ORDER = "orders";
export const JSON_ACTIVE_DATABASE = "active_database";
export const JSON_ADDRESS  = "address";
export const JSON_AMOUNT   = "amount";
export const JSON_CUSTOMER  = "customer";
export const JSON_DATABASE = "database";
export const JSON_DELIVERTIMES = "deliverTimes";
export const JSON_EMPLOYEE = "employee";
export const JSON_EMPLOYEES = "employees";
export const JSON_FIELD_TO_UPDATE = "FieldToUpdate";
export const JSON_GHOST_ORDER = "ghostOrder";
export const JSON_GREAT_STATE = "GREATSTATE";
export const JSON_ISOTOPE = "isotopes";
export const JSON_ORDERS  = "orders";
export const JSON_PRODUCTION = "production";
export const JSON_PRODUCTIONS = "productions";
export const JSON_RUN = "run";
export const JSON_RUNS = "runs";
export const JSON_TRACER = "tracers";
export const JSON_TRACER_MAPPING = "tracer_mapping";
export const JSON_INJECTION_ORDERS = "t_orders";
export const JSON_SERVER_CONFIG = "server_config";
export const JSON_VIALS = "vials";
export const JSON_VIAL_MAPPING = "vial_mapping";

export const WEBSOCKET_DATA                 = "data";
export const WEBSOCKET_DATATYPE             = "datatype";
export const WEBSOCKET_DATA_ID              = "dataID"
export const WEBSOCKET_DATE                 = "date";
export const WEBSOCKET_DATA_DEAD_ORDERS     = "deadOrders"
export const WEBSOCKET_MESSAGETYPE          = "messageType";
export const WEBSOCKET_MESSAGE_CREATE_VIAL  = "createVial";
export const WEBSOCKET_MESSAGE_CREATE_ORDER = "createOrder";
export const WEBSOCKET_MESSAGE_CREATE_T_ORDER = "createTOrder"
export const WEBSOCKET_MESSAGE_CREATE_DATA_CLASS = "createDataClass";
export const WEBSOCKET_MESSAGE_DELETE_DATA_CLASS = "deleteDataClass";
export const WEBSOCKET_MESSAGE_ECHO         = "echo";
export const WEBSOCKET_MESSAGE_EDIT_STATE   = "editState";
export const WEBSOCKET_MESSAGE_FREE_ORDER   = "freeOrder";
export const WEBSOCKET_MESSAGE_RECIEVE_VIAL = "recieveVial";
export const WEBSOCKET_MESSAGE_GREAT_STATE  = "getGREATState";
export const WEBSOCKET_MESSAGE_UPDATEORDERS = "updateOrder";
export const WEBSOCKET_MESSAGE_MOVE_ORDERS  = "moveOrder";
export const WEBSOCKET_MESSAGE_GET_ORDERS   = "getOrders";
export const WEBSOCKET_SEND_EVENT           = "sendEvent";
export const WEBSOCKET_EVENT_TYPE           = "type";
export const WEBSOCKET_UPDATE_SERVERCONFIG  = "updateServerConfig";