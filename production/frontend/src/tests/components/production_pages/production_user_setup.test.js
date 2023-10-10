/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils";
import { fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"

import { AppState } from "~/tests/app_state.js";

import { ProductionUserSetup } from "~/components/production_pages/setup_pages/production_user_setup.js"
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('~/lib/tracer_websocket.js');
const tracer_websocket = require("~/lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    container = document.createElement("div");
    websocket = tracer_websocket.TracerWebSocket
    props = {...AppState};
});

afterEach(() => {
  cleanup()
  window.localStorage.clear();
  module.clearAllMocks();

  if(container != null) container.remove();
  container = null;
  props=null;
});

describe("Production User Setup tests", () => {
  it("Standard Render tests", () => {
    render(<WebsocketContextProvider value={websocket}>
        <ProductionUserSetup {...props}/>
    </WebsocketContextProvider>);
  })
})

