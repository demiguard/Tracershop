/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CreateOrderModal } from '../../../components/modals/create_activity_modal.js'
import { JSON_CUSTOMER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_TRACER, PROP_ON_CLOSE, PROP_ORDER_MAPPING, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";

const onClose = jest.fn()
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
});

const customerName1 = "testCustomer"
const customerName2 = "testCustomer2"


describe("create activity modal", () => {
  const props = {}
  props[JSON_CUSTOMER] = new Map([
    [1, {id : 1, short_name : customerName1}],
    [2, {id : 2, short_name : customerName2}]
  ]);
  props[JSON_TRACER] = new Map([]);
  props[JSON_ISOTOPE] = new Map([[1, {
    ID : 1,
    name : "TestIsotope",
    halflife: 6543,
  }]]);

  props[PROP_ON_CLOSE] = onClose;
  props[PROP_ORDER_MAPPING] = new Map([
    [1 , [{id : 1, delivery_time : "08:00:00"}, {id : 2, delivery_time : "11:30:00"}]],
    [2 , [{id : 3, delivery_time : "07:45:00"}, {id : 4, delivery_time : "11:30:00"}]]
  ]);
  props[PROP_WEBSOCKET] = websocket;


  it("standard render test", async () => {
    render(<CreateOrderModal
      {...props}
    />, container);
  });
});