from enum import Enum, unique


TRACERSHOPDATABASENAME = 'TS_test'

NO_TORDER_FOUND = 50
NO_ORDER_FOUND = 5

FDG_GROUP_NAME = "fdg"

SPECIAL_TRACER_GROUP_NAME = "special"

emailSenderAddress = "no-reply-production@regionh.dk"


@unique
class EmailEvents(Enum):
  #Note that due to this being database ID, we are 1 indexed instead of 0 indexed
  STATUS_SET_TO_2 = 1
  STATUS_SET_TO_3 = 2
  STATUS_SET_TO_0 = 3

# Long list JSON key word used in Json messsages
# These should have great overlap with production/frontend/src/lib/constants.js

JSON_CUSTOMER = "customers"
JSON_DELIVERTIMES = "deliverTimes"
JSON_ISOTOPE = "isotopes"
JSON_ORDERS  = "orders"
JSON_PRODUCTIONS = "productions"
JSON_RUNS = "runs"
JSON_TRACER = "tracers"
JSON_TRACER_MAPPING = "tracer_mapping"
JSON_VIALS = "vials"
JSON_VIAL_MAPPING = "vial_mapping"

