import React from "react";
/**
 * @typedef {T[keyof T]} valueof<T>
 * @template T
 */

/**
 * @typedef {[T, React.Dispatch<React.SetStateAction<T>>]} StateType<T>
 * @template T
 */
export const /** @type {STATE_TYPE} */ STATE_TYPE = ({});

export const COLORS = {
  primaryColor: "#009ce8",
  secondaryColor1: "#4db9ef",
  secondaryColor2: "#99d7f6",
  secondaryColor3: "#ccebfa",
  tertiaryColor1: "#397c7a",
  tertiaryColor2: "#699",
  tertiaryColor3: "#88d0c8",
  grey1: "#333",
  grey2: "#565656",
  grey3: "#858585",
  grey4: "#d6d6d6",
  red1:"#F55",
  red2:"#FBB",
  green1: "#5F5",
  yellow1: "#FF5",
}


/** The order type that is made when tracer is ordered.
 * @enum
 */
export const TRACER_TYPE = {
  ACTIVITY : 1,
  DOSE : 2,
}

export const TracerTypeOptions = [{
  id : TRACER_TYPE.ACTIVITY,
  name : "Aktivitet"
},{
  id : TRACER_TYPE.DOSE,
  name : "Injektioner"
}]

export const DAYS_PER_WEEK = 7;
// Note that to correct day from date.getDay -> (date.getDate() + 6) % 7
/**
 * @enum
 */
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
  {name : "Mandag", day : 0},
  {name : "Tirsdag", day : 1},
  {name : "Onsdag", day : 2},
  {name : "Torsdag", day : 3},
  {name : "Fredag", day : 4},
  {name : "Lørdag", day : 5},
  {name : "Søndag", day : 6},
]

/**
 * @enum
 */
export const DEADLINE_TYPES = {
  DAILY : 0,
  WEEKLY : 1,
}

/**@enum */
export const USER_GROUPS = {
  ANON : 0,
  ADMIN : 1,
  PRODUCTION_ADMIN : 2,
  PRODUCTION_USER : 3,
  SHOP_ADMIN : 4,
  SHOP_USER : 5,
  SHOP_EXTERNAL : 6
}

/**@enum */
export const WEEKLY_REPEAT_CHOICES = {
  ALL : 0,
  EVEN : 1,
  ODD : 2,
}

/**
 * @constant
 * @typedef {Number} OrderStatus
 * @enum {OrderStatus} */
export const ORDER_STATUS = {
  AVAILABLE : 0,
  ORDERED : 1, // The value associated with red
  ACCEPTED : 2, // The value associated with yellow
  RELEASED : 3, // The value associated with green
  CANCELLED : 4,
  RISOE : 5,
  EMPTY : 6,
}

/** Enum that holds all the different "types" of orders. Each type
 * @enum
 */
export const ORDER_TYPE = {
  ACTIVITY : 0,
  INJECTION : 1,
  ISOTOPE : 2,
}

/**
 * Enum describing options of an Injections order usage field
 * @enum {string}
 */
export const INJECTION_USAGE_NAMES = {
  human : "Human",
  animal : "Dyr",
  other : "Andet",
}

export const INJECTION_USAGE = {
  human : 0,
  animal : 1,
  other : 2,
}

export const ERROR_BACKGROUND_COLOR = "#FF3333";
export const ERROR_MARGIN_COLOR = "#FF0000";

export const WARNING_BACKGROUND_COLOR = "#ccbb88"
export const WARNING_MARGIN_COLOR = "#FFbb00"

export const HINT_BACKGROUND_COLOR = "#FFFFFF"
export const HINT_MARGIN_COLOR = COLORS.tertiaryColor1

export const NEW_LOCAL_ID = -1;

export const DATABASE_ADMIN_PAGE = "admin_page";
export const DATABASE_CURRENT_USER = "current_user";
export const DATABASE_SHOP_CUSTOMER = "shopCustomer";
export const DATABASE_SHOP_ACTIVE_ENDPOINT = "shop_active_endpoint"
export const DATABASE_SHOP_ORDER_PAGE = "shop_order_page"
export const DATABASE_TODAY = "today"
export const DATABASE_ACTIVE_TRACER = "activeTracer";
export const DATABASE_IS_AUTH = "isAuth";
export const DATABASE_LAST_UPDATED = "lastUpdated";

export const ERROR_TYPE_HINT = "hint";
export const ERROR_TYPE_WARNING = "warning";
export const ERROR_TYPE_ERROR = "error";
export const ERROR_TYPE_NO_ERROR = "no_error"

export const PROP_LOGOUT = "logout";
export const PROP_NAVBAR_ELEMENTS = "NavbarElements";
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
export const PROP_VALID_ACTIVITY_DEADLINE = 'activityDeadlineValid';
export const PROP_VALID_INJECTION_DEADLINE = 'injectionDeadlineValid';
export const PROP_ASSOCIATED_TIME_SLOTS = "associated_time_slots";
export const PROP_ASSOCIATED_ORDERS = "associated_orders";
export const PROP_TRACER_CATALOG = "tracer_catalog";
export const PROP_SELECTED = "selected";
export const PROP_RELATED_CUSTOMER = "relatedCustomer";
export const PROP_COMMIT = "commit";

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
export const WEEKLY_TIME_TABLE_PROP_LABEL_FUNC = "label_function";
