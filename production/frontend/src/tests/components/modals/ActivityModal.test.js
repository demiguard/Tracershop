/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ActivityModal } from '../../../components/modals/activity_modal.js'
import { JSON_ACTIVITY_ORDER, PROP_ACTIVE_CUSTOMER, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";
import { AppState } from "../../helpers.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

const TIME_SLOT_MAPPING = new Map([
  [1, [AppState[JSON_ACTIVITY_ORDER].get(1)]]
])


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket
  props[PROP_ACTIVE_CUSTOMER] = 1
  props[PROP_TIME_SLOT_MAPPING] = TIME_SLOT_MAPPING
  props[PROP_TIME_SLOT_ID] = 1
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});



describe("Activity Modal Test", () => {
  it("Standard Render Test status 1", async () => {
    render(<ActivityModal
        {...props}
    />);

  })
})