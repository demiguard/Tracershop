import { TracershopState } from "~/dataclasses/dataclasses"
import { DATA_ACTIVITY_ORDER, DATA_BOOKING, DATA_CLOSED_DATE, DATA_CUSTOMER,
  DATA_DEADLINE, DATA_DELIVER_TIME, DATA_EMPLOYEE, DATA_ENDPOINT,
  DATA_INJECTION_ORDER, DATA_ISOTOPE, DATA_LOCATION, DATA_PROCEDURE,
  DATA_PROCEDURE_IDENTIFIER, DATA_PRODUCTION, DATA_SERVER_CONFIG, DATA_TRACER,
  DATA_TRACER_MAPPING, DATA_USER, DATA_USER_ASSIGNMENT, DATA_VIAL
} from "../lib/shared_constants.js"
import { activityDeliveryTimeSlots } from "./test_state/activity_delivery_time_slots"
import { activity_orders } from "./test_state/activity_orders"
import { bookings } from "./test_state/bookings"
import { closed_dates } from "./test_state/close_dates"
import { customers } from "./test_state/customers"
import { deadlines } from "./test_state/deadlines"
import { deliveryEndpoints } from "./test_state/delivery_endpoints"
import { injection_orders } from "./test_state/injection_orders"
import { isotopes } from "./test_state/isotopes"
import { locations } from "./test_state/locations"
import { procedures } from "./test_state/procedures"
import { procedureIdentifiers } from "./test_state/proceduresIdentifiers"
import { productions } from "./test_state/productions"
import { serverConfig } from "./test_state/server_config"
import { tracers } from "./test_state/tracer"
import { tracer_mapping } from "./test_state/tracer_mapping"
import { user_assignments } from "./test_state/user_assignments"
import { users } from "./test_state/users"
import { vials } from "./test_state/vials"
import { address } from "./test_state/address"
import { release_rights } from "./test_state/release_rights"
import { dicom_endpoints } from "./test_state/dicom_endpoint"
import { legacy_production_members } from "./test_state/legacy_production_member"
import { messages } from "./test_state/messages"
import { message_assignments } from "./test_state/message_assignments"
import { secondary_emails } from "./test_state/secondary_email"
import { printers } from "~/tests/test_state/printer.js"


export const AppState = {}

AppState[DATA_ACTIVITY_ORDER] = activity_orders
AppState[DATA_CUSTOMER] = customers
AppState[DATA_DEADLINE] = deadlines
AppState[DATA_DELIVER_TIME] = activityDeliveryTimeSlots
AppState[DATA_ENDPOINT] = deliveryEndpoints
AppState[DATA_LOCATION] = locations
AppState[DATA_INJECTION_ORDER] = injection_orders
AppState[DATA_ISOTOPE] = isotopes
AppState[DATA_PRODUCTION] = productions
AppState[DATA_PROCEDURE] = procedures
AppState[DATA_PROCEDURE_IDENTIFIER] = procedureIdentifiers
AppState[DATA_SERVER_CONFIG] =serverConfig
AppState[DATA_TRACER] = tracers
AppState[DATA_TRACER_MAPPING] = tracer_mapping
AppState[DATA_VIAL] = vials
AppState[DATA_CLOSED_DATE] = closed_dates;
AppState[DATA_USER] = users
AppState[DATA_USER_ASSIGNMENT] = user_assignments;


export const testState = new TracershopState(
  users.get(1),
  new Date(2020,4,5),
  address,
  activity_orders,
  closed_dates,
  customers,
  deadlines,
  activityDeliveryTimeSlots,
  dicom_endpoints,
  deliveryEndpoints,
  injection_orders,
  isotopes,
  release_rights,
  legacy_production_members,
  locations,
  messages,
  message_assignments,
  tracers,
  tracer_mapping,
  printers,
  procedures,
  procedureIdentifiers,
  productions,
  secondary_emails,
  serverConfig,
  new Map(),
  users,
  user_assignments,
  vials,
)