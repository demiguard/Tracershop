/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { TracerModal } from "~/components/modals/tracer_modal.js"
import { PROP_ACTIVE_TRACER, PROP_ON_CLOSE } from "~/lib/constants.js";
import { DATA_CUSTOMER, DATA_TRACER, DATA_TRACER_MAPPING } from "~/lib/shared_constants.js"
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('~/lib/tracer_websocket.js');
const tracer_websocket = require("~/lib/tracer_websocket.js");

const onClose = jest.fn();

let websocket = null;
let container = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop" }
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
});


const props = {};

props[DATA_CUSTOMER] = new Map([
  [1, {id : 1, short_name : 'Customer 1'}],
  [2, {id : 2, short_name : 'Customer 2'}],
  [3, {id : 3, short_name : 'Customer 3'}],
])
props[PROP_ACTIVE_TRACER] = 1;
props[DATA_TRACER] = new Map([
  [1, {id : 1, short_name : "testTracer"}]
])
props[DATA_TRACER_MAPPING] = new Map([])
props[PROP_ON_CLOSE] = onClose

describe("Tracer Modal test suite", () => {
  it("Standard Render test", () => {
    render(<WebsocketContextProvider value={websocket}>
      <TracerModal {...props}/>
    </WebsocketContextProvider>);

    expect(screen.queryByText("Customer 1")).toBeVisible();
    expect(screen.queryByText("Customer 2")).toBeVisible();
    expect(screen.queryByText("Customer 3")).toBeVisible();
  });

  it("Filter tests", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <TracerModal {...props}/>
    </WebsocketContextProvider>);

    const filterInput = await screen.findByLabelText('input-filter')
    fireEvent.change(filterInput, {target : {value : "2" }})

    expect(screen.queryByText("Customer 1")).toBeNull();
    expect(screen.queryByText("Customer 2")).toBeVisible();
    expect(screen.queryByText("Customer 3")).toBeNull();
  });
})