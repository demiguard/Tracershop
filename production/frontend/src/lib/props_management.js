/**
 * This module deals with validating props as there's a fair bit of passing down of props.
 * The app is build in the following way: App -> site -> page -> modal
 * This module ensure that each page have the same props to work with.
 * Note that not all modals have access to the entire tree, however each page should have access to the props from propsExtractions
 *
 */

import { JSON_ACTIVITY_ORDER, JSON_ADDRESS, JSON_CLOSEDDATE, JSON_CUSTOMER, JSON_DATABASE, JSON_DELIVERTIME, JSON_EMPLOYEE, JSON_INJECTION_ORDER, JSON_ISOTOPE, JSON_RUN, JSON_SERVER_CONFIG, JSON_TRACER, JSON_TRACER_MAPPING, JSON_VIAL, PROP_LOGOUT, PROP_NAVBAR_ELEMENTS, PROP_USER, PROP_WEBSOCKET } from "./constants.js"


export function propsExtraction(props){
  const newProps = {}

  if (!props.hasOwnProperty(JSON_ADDRESS)) throw "missing JSON_ADDRESS"
  if (!props.hasOwnProperty(JSON_DATABASE)) throw "missing JSON_DATABASE"
  if (!props.hasOwnProperty(JSON_CLOSEDDATE)) throw "missing JSON_CLOSEDDATE"
  if (!props.hasOwnProperty(JSON_CUSTOMER)) throw "missing JSON_CUSTOMER"
  if (!props.hasOwnProperty(JSON_DELIVERTIME)) throw "missing JSON_DELIVERTIME"
  if (!props.hasOwnProperty(JSON_EMPLOYEE)) throw "missing JSON_EMPLOYEE"
  if (!props.hasOwnProperty(JSON_ISOTOPE)) throw "missing JSON_ISOTOPE"
  if (!props.hasOwnProperty(JSON_ACTIVITY_ORDER)) throw "missing PROP_LOGOUT"
  if (!props.hasOwnProperty(JSON_RUN)) throw "missing PROP_NAVBAR_ELEMENTS"
  if (!props.hasOwnProperty(JSON_INJECTION_ORDER)) throw "missing JSON_ACTIVITY_ORDER"
  if (!props.hasOwnProperty(JSON_TRACER)) throw "missing JSON_RUN"
  if (!props.hasOwnProperty(JSON_TRACER_MAPPING)) throw "missing JSON_INJECTION_ORDER"
  if (!props.hasOwnProperty(JSON_SERVER_CONFIG)) throw "missing JSON_TRACER"
  if (!props.hasOwnProperty(JSON_VIAL)) throw "missing JSON_TRACER_MAPPING"
  if (!props.hasOwnProperty(PROP_LOGOUT)) throw "missing JSON_SERVER_CONFIG"
  if (!props.hasOwnProperty(PROP_NAVBAR_ELEMENTS)) throw "missing JSON_VIAL"
  if (!props.hasOwnProperty(PROP_WEBSOCKET)) throw "missing PROP_WEBSOCKET"
  if (!props.hasOwnProperty(PROP_USER)) throw "missing PROP_USER"

  newProps[JSON_ADDRESS] = props[JSON_ADDRESS];
  newProps[JSON_DATABASE] = props[JSON_DATABASE];
  newProps[JSON_CLOSEDDATE] = props[JSON_CLOSEDDATE];
  newProps[JSON_CUSTOMER] = props[JSON_CUSTOMER];
  newProps[JSON_DELIVERTIME] = props[JSON_DELIVERTIME];
  newProps[JSON_EMPLOYEE] = props[JSON_EMPLOYEE];
  newProps[JSON_ISOTOPE] = props[JSON_ISOTOPE];
  newProps[PROP_LOGOUT] = props[PROP_LOGOUT];
  newProps[PROP_NAVBAR_ELEMENTS] = props[PROP_NAVBAR_ELEMENTS];
  newProps[JSON_ACTIVITY_ORDER] = props[JSON_ACTIVITY_ORDER];
  newProps[JSON_RUN] = props[JSON_RUN];
  newProps[JSON_INJECTION_ORDER] = props[JSON_INJECTION_ORDER];
  newProps[JSON_TRACER] = props[JSON_TRACER];
  newProps[JSON_TRACER_MAPPING] = props[JSON_TRACER_MAPPING];
  newProps[JSON_SERVER_CONFIG] = props[JSON_SERVER_CONFIG];
  newProps[JSON_VIAL] = props[JSON_VIAL];
  newProps[PROP_WEBSOCKET] = props[PROP_WEBSOCKET];
  newProps[PROP_USER] = props[PROP_USER];

  return newProps;
}