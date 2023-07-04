/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CreateOrderModal } from '../../../components/modals/create_activity_modal.js'
import { JSON_CUSTOMER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_TRACER, PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_ORDER_MAPPING, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";
import { AppState} from '../../helpers.js'


const onClose = jest.fn()
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket
  props[PROP_ACTIVE_DATE] = new Date(2020,3,5);
  props[PROP_ON_CLOSE] = onClose
  props[PROP_ORDER_MAPPING] = new Map([
    [1, new Map([

    ])],
  ]);
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});



describe("create activity modal", () => {
  it("standard render test", async () => {
    render(<CreateOrderModal
      {...props}
    />, container);
  });
});