
import {JSON_ADDRESS, JSON_DATABASE, JSON_CLOSEDDATE, JSON_CUSTOMER, JSON_DELIVERTIME, JSON_EMPLOYEE, JSON_ISOTOPE, PROP_LOGOUT, PROP_NAVBAR_ELEMENTS, JSON_ACTIVITY_ORDER, JSON_RUN, JSON_INJECTION_ORDER, JSON_TRACER, JSON_TRACER_MAPPING, JSON_SERVER_CONFIG, JSON_VIAL, PROP_WEBSOCKET, PROP_USER} from '../../lib/constants.js'
import { propsExtraction } from '../../lib/props_management.js'

describe("props management test suite", () => {
  it("correctness test", () => {
    const inputObject = {}

    const JSON_ADDRESS_val = "JSON_ADDRESS";
    const JSON_DATABASE_val = "JSON_DATABASE";
    const JSON_CLOSEDDATE_val = "JSON_CLOSEDDATE";
    const JSON_CUSTOMER_val = "JSON_CUSTOMER";
    const JSON_DELIVERTIME_val = "JSON_DELIVERTIME";
    const JSON_EMPLOYEE_val = "JSON_EMPLOYEE";
    const JSON_ISOTOPE_val = "JSON_ISOTOPE";
    const PROP_LOGOUT_val = "PROP_LOGOUT";
    const PROP_NAVBAR_ELEMENTS_val = "PROP_NAVBAR_ELEMENTS";
    const JSON_ACTIVITY_ORDER_val = "JSON_ACTIVITY_ORDER";
    const JSON_RUN_val = "JSON_RUN";
    const JSON_INJECTION_ORDER_val = "JSON_INJECTION_ORDER";
    const JSON_TRACER_val = "JSON_TRACER";
    const JSON_TRACER_MAPPING_val = "JSON_TRACER_MAPPING";
    const JSON_SERVER_CONFIG_val = "JSON_SERVER_CONFIG";
    const JSON_VIAL_val = "JSON_VIAL";
    const PROP_WEBSOCKET_val = "PROP_WEBSOCKET";
    const PROP_USER_val = "PROP_USER";

    inputObject[JSON_ADDRESS] = JSON_ADDRESS_val;
    inputObject[JSON_DATABASE] = JSON_DATABASE_val;
    inputObject[JSON_CLOSEDDATE] = JSON_CLOSEDDATE_val;
    inputObject[JSON_CUSTOMER] = JSON_CUSTOMER_val;
    inputObject[JSON_DELIVERTIME] = JSON_DELIVERTIME_val;
    inputObject[JSON_EMPLOYEE] = JSON_EMPLOYEE_val;
    inputObject[JSON_ISOTOPE] = JSON_ISOTOPE_val;
    inputObject[PROP_LOGOUT] = PROP_LOGOUT_val;
    inputObject[PROP_NAVBAR_ELEMENTS] = PROP_NAVBAR_ELEMENTS_val;
    inputObject[JSON_ACTIVITY_ORDER] = JSON_ACTIVITY_ORDER_val;
    inputObject[JSON_RUN] = JSON_RUN_val;
    inputObject[JSON_INJECTION_ORDER] = JSON_INJECTION_ORDER_val;
    inputObject[JSON_TRACER] = JSON_TRACER_val;
    inputObject[JSON_TRACER_MAPPING] = JSON_TRACER_MAPPING_val;
    inputObject[JSON_SERVER_CONFIG] = JSON_SERVER_CONFIG_val;
    inputObject[JSON_VIAL] = JSON_VIAL_val;
    inputObject[PROP_WEBSOCKET] = PROP_WEBSOCKET_val;
    inputObject[PROP_USER] = PROP_USER_val;

    const outputObject = propsExtraction(inputObject);

    expect(outputObject[JSON_ADDRESS]).toEqual(JSON_ADDRESS_val)
    expect(outputObject[JSON_DATABASE]).toEqual(JSON_DATABASE_val)
    expect(outputObject[JSON_CLOSEDDATE]).toEqual(JSON_CLOSEDDATE_val)
    expect(outputObject[JSON_CUSTOMER]).toEqual(JSON_CUSTOMER_val)
    expect(outputObject[JSON_DELIVERTIME]).toEqual(JSON_DELIVERTIME_val)
    expect(outputObject[JSON_EMPLOYEE]).toEqual(JSON_EMPLOYEE_val)
    expect(outputObject[JSON_ISOTOPE]).toEqual(JSON_ISOTOPE_val)
    expect(outputObject[PROP_LOGOUT]).toEqual(PROP_LOGOUT_val)
    expect(outputObject[PROP_NAVBAR_ELEMENTS]).toEqual(PROP_NAVBAR_ELEMENTS_val)
    expect(outputObject[JSON_ACTIVITY_ORDER]).toEqual(JSON_ACTIVITY_ORDER_val)
    expect(outputObject[JSON_RUN]).toEqual(JSON_RUN_val)
    expect(outputObject[JSON_INJECTION_ORDER]).toEqual(JSON_INJECTION_ORDER_val)
    expect(outputObject[JSON_TRACER]).toEqual(JSON_TRACER_val)
    expect(outputObject[JSON_TRACER_MAPPING]).toEqual(JSON_TRACER_MAPPING_val)
    expect(outputObject[JSON_SERVER_CONFIG]).toEqual(JSON_SERVER_CONFIG_val)
    expect(outputObject[JSON_VIAL]).toEqual(JSON_VIAL_val)
    expect(outputObject[PROP_WEBSOCKET]).toEqual(PROP_WEBSOCKET_val)
    expect(outputObject[PROP_USER]).toEqual(PROP_USER_val)

    expect(outputObject).not.toBe(inputObject)
  });

  it("Handle missing value test", () => {
    const inputObject = {}

    const JSON_ADDRESS_val = "JSON_ADDRESS";
    const JSON_DATABASE_val = "JSON_DATABASE";
    const JSON_CLOSEDDATE_val = "JSON_CLOSEDDATE";
    const JSON_CUSTOMER_val = "JSON_CUSTOMER";
    const JSON_DELIVERTIME_val = "JSON_DELIVERTIME";
    const JSON_EMPLOYEE_val = "JSON_EMPLOYEE";
    const JSON_ISOTOPE_val = "JSON_ISOTOPE";
    const PROP_LOGOUT_val = "PROP_LOGOUT";
    const PROP_NAVBAR_ELEMENTS_val = "PROP_NAVBAR_ELEMENTS";
    const JSON_ACTIVITY_ORDER_val = "JSON_ACTIVITY_ORDER";
    const JSON_RUN_val = "JSON_RUN";
    const JSON_INJECTION_ORDER_val = "JSON_INJECTION_ORDER";
    const JSON_TRACER_val = "JSON_TRACER";
    const JSON_TRACER_MAPPING_val = "JSON_TRACER_MAPPING";
    const JSON_SERVER_CONFIG_val = "JSON_SERVER_CONFIG";
    const JSON_VIAL_val = "JSON_VIAL";
    const PROP_WEBSOCKET_val = "PROP_WEBSOCKET";
    //const PROP_USER_val = "PROP_USER";

    inputObject[JSON_ADDRESS] = JSON_ADDRESS_val;
    inputObject[JSON_DATABASE] = JSON_DATABASE_val;
    inputObject[JSON_CLOSEDDATE] = JSON_CLOSEDDATE_val;
    inputObject[JSON_CUSTOMER] = JSON_CUSTOMER_val;
    inputObject[JSON_DELIVERTIME] = JSON_DELIVERTIME_val;
    inputObject[JSON_EMPLOYEE] = JSON_EMPLOYEE_val;
    inputObject[JSON_ISOTOPE] = JSON_ISOTOPE_val;
    inputObject[PROP_LOGOUT] = PROP_LOGOUT_val;
    inputObject[PROP_NAVBAR_ELEMENTS] = PROP_NAVBAR_ELEMENTS_val;
    inputObject[JSON_ACTIVITY_ORDER] = JSON_ACTIVITY_ORDER_val;
    inputObject[JSON_RUN] = JSON_RUN_val;
    inputObject[JSON_INJECTION_ORDER] = JSON_INJECTION_ORDER_val;
    inputObject[JSON_TRACER] = JSON_TRACER_val;
    inputObject[JSON_TRACER_MAPPING] = JSON_TRACER_MAPPING_val;
    inputObject[JSON_SERVER_CONFIG] = JSON_SERVER_CONFIG_val;
    inputObject[JSON_VIAL] = JSON_VIAL_val;
    inputObject[PROP_WEBSOCKET] = PROP_WEBSOCKET_val;
    //inputObject[PROP_USER] = PROP_USER_val;
    const func = () => {
      propsExtraction(inputObject)
    }
    expect(func).toThrow("missing PROP_USER")
  });


  it("Handle missing value test", () => {
    const inputObject = {}
    const properties = [
      JSON_ADDRESS,
      JSON_DATABASE,
      JSON_CLOSEDDATE,
      JSON_CUSTOMER,
      JSON_DELIVERTIME,
      JSON_EMPLOYEE,
      JSON_ISOTOPE,
      JSON_ACTIVITY_ORDER,
      JSON_RUN,
      JSON_INJECTION_ORDER,
      JSON_TRACER,
      JSON_TRACER_MAPPING,
      JSON_SERVER_CONFIG,
      JSON_VIAL,
      PROP_LOGOUT,
      PROP_NAVBAR_ELEMENTS,
      PROP_WEBSOCKET,
      PROP_USER,
    ]

    for(const kw of properties){
      const func = () => {
        propsExtraction(inputObject)
      }
      expect(func).toThrow();
      inputObject[kw] = kw;
    }
  });
})