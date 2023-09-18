/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, scryRenderedComponentsWithType } from "react-dom/test-utils";
import { fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"


import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_WEBSOCKET, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE,  } from "../../../lib/constants.js";
import { AppState } from "../../app_state.js";

import { DeadlineSetup } from "../../../components/production_pages/setup_pages/deadline_setup.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = null;
let container = null;
let props = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    container = document.createElement("div");
    websocket = new tracer_websocket.TracerWebSocket()
    props = {...AppState};
    props[PROP_WEBSOCKET] = websocket;
});

afterEach(() => {
  cleanup()
  window.localStorage.clear();
  module.clearAllMocks();

  if(container != null) container.remove();
  container = null;
  props=null;
});


describe("Deadline Setup tests", () => {
  it("Standard render test", () => {
    render(<DeadlineSetup {...props}/>)

    
  });
})