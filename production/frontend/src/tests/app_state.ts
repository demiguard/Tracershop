import { TracershopState } from "~/dataclasses/dataclasses"
import { activityDeliveryTimeSlots } from "./test_state/activity_delivery_time_slots"
import { activity_orders } from "./test_state/activity_orders"
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
import { printers } from "~/tests/test_state/printer"
import { isotopeDeliveries } from "~/tests/test_state/isotope_deliveries"
import { isotopeProductions } from "~/tests/test_state/isotope_production"
import { DATA_ACTIVITY_ORDER, DATA_ADDRESS, DATA_BOOKING_RULE, DATA_CLOSED_DATE,
  DATA_CUSTOMER, DATA_DEADLINE, DATA_DELIVER_TIME, DATA_DICOM_ENDPOINT,
  DATA_ENDPOINT, DATA_INJECTION_ORDER, DATA_ISOTOPE, DATA_ISOTOPE_DELIVERY,
  DATA_ISOTOPE_ORDER, DATA_ISOTOPE_PRODUCTION, DATA_ISOTOPE_VIAL, DATA_LOCATION,
  DATA_MESSAGE,
  DATA_MESSAGE_ASSIGNMENT,
  DATA_PRINTER,
  DATA_PROCEDURE,
  DATA_PROCEDURE_IDENTIFIER,
  DATA_PRODUCTION,
  DATA_PROJECT,
  DATA_PROJECT_ACTIVITY,
  DATA_PROJECT_ENDPOINT,
  DATA_PROJECT_INJECTION,
  DATA_RELEASE_RIGHT,
  DATA_SECONDARY_EMAIL,
  DATA_SERVER_CONFIG,
  DATA_STANDARD_ORDER,
  DATA_TRACER,
  DATA_TRACER_MAPPING,
  DATA_USER,
  DATA_USER_ASSIGNMENT,
  DATA_VIAL,
  DATA_VIAL_TEMPLATE,
  DATA_VIAL_TEMPLATE_TEXT
} from "~/lib/shared_constants"


export const testStateToday = new Date(2020,4,5,12,0,0,0);

export const testState = Object.assign(
  Object.create(TracershopState.prototype),
  {
  logged_in_user : users.get(1),
  today : testStateToday,
  [DATA_ADDRESS] : address,
  [DATA_ACTIVITY_ORDER] : activity_orders,
  [DATA_BOOKING_RULE] : new Map(),
  [DATA_CLOSED_DATE] : closed_dates,
  [DATA_CUSTOMER] : customers,
  [DATA_DEADLINE] : deadlines,
  [DATA_DELIVER_TIME] : activityDeliveryTimeSlots,
  [DATA_DICOM_ENDPOINT] : dicom_endpoints,
  [DATA_ENDPOINT] : deliveryEndpoints,
  [DATA_INJECTION_ORDER] : injection_orders,
  [DATA_ISOTOPE] : isotopes,
  [DATA_ISOTOPE_DELIVERY] : isotopeDeliveries,
  [DATA_ISOTOPE_ORDER] : new Map(),
  [DATA_ISOTOPE_PRODUCTION] : isotopeProductions,
  [DATA_ISOTOPE_VIAL] : new Map(),
  [DATA_LOCATION] : locations,
  [DATA_MESSAGE] : messages,
  [DATA_MESSAGE_ASSIGNMENT] : message_assignments,
  [DATA_PRINTER] : printers,
  [DATA_PROCEDURE] : procedures,
  [DATA_PROCEDURE_IDENTIFIER] : procedureIdentifiers,
  [DATA_PRODUCTION] : productions,
  [DATA_PROJECT] : new Map(),
  [DATA_PROJECT_ACTIVITY] : new Map(),
  [DATA_PROJECT_INJECTION] : new Map(),
  [DATA_PROJECT_ENDPOINT] : new Map(),
  [DATA_RELEASE_RIGHT] : release_rights,
  [DATA_SERVER_CONFIG] : serverConfig,
  [DATA_SECONDARY_EMAIL] : secondary_emails,
  [DATA_STANDARD_ORDER] : new Map(),
  [DATA_TRACER] : tracers,
  [DATA_TRACER_MAPPING] : tracer_mapping,
  [DATA_USER] : users,
  [DATA_USER_ASSIGNMENT] : user_assignments,
  [DATA_VIAL] : vials,
  [DATA_VIAL_TEMPLATE] : new Map(),
  [DATA_VIAL_TEMPLATE_TEXT] : new Map(),
})



/*
export const testState = new TracershopState(
  users.get(1),
  testStateToday,
  address,
  activity_orders,
  new Map(), //booking_rules
  closed_dates,
  customers,
  deadlines,
  activityDeliveryTimeSlots,
  dicom_endpoints,
  deliveryEndpoints,
  injection_orders,
  isotopes,
  isotopeDeliveries, // Isotope Delivery
  new Map(), // Isotope Order
  IsotopeProductions, // Isotope production
  new Map(), // Isotope Vial
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
  new Map(), // Standard Order
  new Map(), // Server log
  users,
  user_assignments,
  vials,
)
*/

/**
 * Modifies the test state to have any desired modifications
 *
 * @Example
 * // Returns the test state with today as today
 *
 * const modifiedTestState = getModifiedTestState({ today : new Date()})
 */
export function getModifiedTestState(modifications: any) {

  //@ts-ignore
  const customState = new TracershopState();
  Object.assign(customState, testState);
  if(modifications){
    Object.assign(customState, modifications);
  }

  return customState
}