import { DEADLINE_TYPES, INJECTION_USAGE, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_CUSTOMER, JSON_DEADLINE, JSON_DELIVER_TIME, JSON_EMPLOYEE, JSON_ENDPOINT, JSON_INJECTION_ORDER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_SERVER_CONFIG, JSON_TRACER, JSON_TRACER_MAPPING, JSON_USER, JSON_USER_ASSIGNMENT, JSON_VIAL, TRACER_TYPE_ACTIVITY, TRACER_TYPE_DOSE } from "../lib/constants"
import { activityDeliveryTimeSlots } from "./test_state/activity_delivery_time_slots"
import { activity_orders } from "./test_state/activity_orders"
import { closed_dates } from "./test_state/close_dates"
import { customers } from "./test_state/customers"
import { deadlines } from "./test_state/deadlines"
import { deliveryEndpoints } from "./test_state/delivery_endpoints"
import { injection_orders } from "./test_state/injection_orders"
import { isotopes } from "./test_state/isotopes"
import { productions } from "./test_state/productions"
import { serverConfig } from "./test_state/server_config"
import { tracers } from "./test_state/tracer"
import { tracer_mapping } from "./test_state/tracer_mapping"
import { user_assignments } from "./test_state/user_assignments"
import { users } from "./test_state/users"
import { vials } from "./test_state/vials"


export const AppState = {}

AppState[JSON_ACTIVITY_ORDER] = activity_orders
AppState[JSON_CUSTOMER] = customers
AppState[JSON_DEADLINE] = deadlines
AppState[JSON_DELIVER_TIME] = activityDeliveryTimeSlots
AppState[JSON_ENDPOINT] = deliveryEndpoints
AppState[JSON_INJECTION_ORDER] = injection_orders
AppState[JSON_ISOTOPE] = isotopes
AppState[JSON_PRODUCTION] = productions
AppState[JSON_SERVER_CONFIG] =serverConfig
AppState[JSON_TRACER] = tracers
AppState[JSON_TRACER_MAPPING] = tracer_mapping
AppState[JSON_VIAL] = vials
AppState[JSON_CLOSED_DATE] = closed_dates;
AppState[JSON_USER] = users
AppState[JSON_USER_ASSIGNMENT] = user_assignments;