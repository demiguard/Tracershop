export {
  DAYS, DAYS_PER_WEEK, TRACER_TYPE_ACTIVITY, TRACER_TYPE_DOSE,

  JSON_CUSTOMER, JSON_DELIVERTIMES, JSON_EMPLOYEE, JSON_ISOTOPE, JSON_ORDERS, JSON_PRODUCTIONS,
  JSON_RUNS, JSON_TRACER, JSON_TRACER_MAPPING, JSON_VIALS, JSON_VIAL_MAPPING, JSON_ACTIVE_DATABASE, 
  JSON_DATABASE, JSON_FIELD_TO_UPDATE,

  WEBSOCKET_DATA_ORDER, WEBSOCKET_DATA_ORDERS, WEBSOCKET_DATA_VIAL, WEBSOCKET_DATA_VIALS, 
  WEBSOCKET_DATA_TRACER, WEBSOCKET_DATE, WEBSOCKET_MESSAGETYPE, WEBSOCKET_MESSAGE_CREATE_VIAL, 
  WEBSOCKET_MESSAGE_EDIT_VIAL, WEBSOCKET_MESSAGE_FREE_ORDER, WEBSOCKET_MESSAGE_RECIEVE_VIAL, 
  WEBSOCKET_MESSAGE_UPDATEORDERS, WEBSOCKET_SEND_EVENT, WEBSOCKET_EVENT_TYPE, 
  
}
const TRACER_TYPE_ACTIVITY = 1
const TRACER_TYPE_DOSE     = 2


const DAYS_PER_WEEK = 7
const DAYS = {
  MONDAY : 0,
  TUESDAY : 1,
  WENDSDAY : 2,
  THURSDAY : 3,
  FRIDAY : 4,
  SATURDAY : 5,
  SUNDAY : 6,
}

// This is JSON key word used in all communication between the server and client.
// you shound find these in production/constants.py
const JSON_CUSTOMER = "customers";
const JSON_DELIVERTIMES = "deliverTimes";
const JSON_EMPLOYEE = "employee";
const JSON_ISOTOPE = "isotopes";
const JSON_ORDERS  = "orders";
const JSON_PRODUCTIONS = "productions";
const JSON_RUNS = "runs";
const JSON_TRACER = "tracers";
const JSON_TRACER_MAPPING = "tracer_mapping";
const JSON_VIALS = "vials";
const JSON_VIAL_MAPPING = "vial_mapping";
const JSON_ACTIVE_DATABASE = "active_database";
const JSON_DATABASE = "database";
const JSON_FIELD_TO_UPDATE = "FieldToUpdate";

const WEBSOCKET_DATA_ORDER           = "order";
const WEBSOCKET_DATA_ORDERS          = "orders";
const WEBSOCKET_DATA_VIAL            = "vial";
const WEBSOCKET_DATA_VIALS           = "vials";
const WEBSOCKET_DATA_TRACER          = "tracerID" ;
const WEBSOCKET_DATE                 = "date";
const WEBSOCKET_MESSAGETYPE          = "messageType";
const WEBSOCKET_MESSAGE_CREATE_VIAL  = "createVial"  ;
const WEBSOCKET_MESSAGE_EDIT_VIAL    = "editVial";
const WEBSOCKET_MESSAGE_FREE_ORDER   = "freeOrder";
const WEBSOCKET_MESSAGE_RECIEVE_VIAL = "recieveVial";
const WEBSOCKET_MESSAGE_UPDATEORDERS = "updateOrder";
const WEBSOCKET_SEND_EVENT           = "sendEvent";
const WEBSOCKET_EVENT_TYPE           = "type";