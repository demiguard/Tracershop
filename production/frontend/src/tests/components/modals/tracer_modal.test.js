/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { TracerModal } from "../../../components/modals/tracer_modal.js"
import { JSON_CUSTOMER, JSON_TRACER, JSON_TRACER_MAPPING, PROP_ACTIVE_TRACER, PROP_ON_CLICK, PROP_ON_CLOSE, PROP_WEBSOCKET } from "../../../lib/constants.js";


const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const onClose = jest.fn();

let websocket = null;
let container = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop" }
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


const props = {};

props[PROP_WEBSOCKET] = websocket
props[JSON_CUSTOMER] = new Map([
  [1, {id : 1, short_name : 'Customer 1'}],
  [2, {id : 2, short_name : 'Customer 2'}],
  [3, {id : 3, short_name : 'Customer 3'}],
])
props[PROP_ACTIVE_TRACER] = 1;
props[JSON_TRACER] = new Map([
  [1, {id : 1, short_name : "testTracer"}]
])
props[JSON_TRACER_MAPPING] = new Map([])
props[PROP_ON_CLOSE] = onClose

describe("Tracer Modal test suite", () => {
  it("Standard Render test", () => {
    render(<TracerModal
      {...props}
    />)

    expect(screen.queryByText("Customer 1")).toBeVisible();
    expect(screen.queryByText("Customer 2")).toBeVisible();
    expect(screen.queryByText("Customer 3")).toBeVisible();
  });

  it("Filter tests", async () => {
    render(<TracerModal
      {...props}
    />)

    const filterInput = await screen.findByLabelText('input-filter')
    fireEvent.change(filterInput, {target : {value : "2" }})

    expect(screen.queryByText("Customer 1")).toBeNull();
    expect(screen.queryByText("Customer 2")).toBeVisible();
    expect(screen.queryByText("Customer 3")).toBeNull();
  });
})