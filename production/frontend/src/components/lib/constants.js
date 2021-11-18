export {
  DAYS, DAYS_PER_WEEK, TRACER_TYPE_ACTIVITY, TRACER_TYPE_DOSE,
  JSON_CUSTOMER, JSON_DELIVERTIMES, JSON_ISOTOPE, JSON_ORDERS, JSON_PRODUCTIONS, JSON_RUNS, JSON_TRACER, JSON_TRACER_MAPPING, JSON_VIALS, JSON_VIAL_MAPPING, 

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
const JSON_ISOTOPE = "isotopes";
const JSON_ORDERS  = "orders";
const JSON_PRODUCTIONS = "productions";
const JSON_RUNS = "runs";
const JSON_TRACER = "tracers";
const JSON_TRACER_MAPPING = "tracer_mapping";
const JSON_VIALS = "vials";
const JSON_VIAL_MAPPING = "vial_mapping";

