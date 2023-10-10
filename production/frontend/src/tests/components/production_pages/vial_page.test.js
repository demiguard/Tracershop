/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { VialPage } from "~/components/production_pages/vial_page.js"
import { DATA_CUSTOMER, DATA_VIAL } from "~/lib/shared_constants.js";

const onClose = jest.fn()
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
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


describe("Vial page tests suite", () => {
  const props = {};
  props[DATA_VIAL] = new Map();
  props[DATA_CUSTOMER] = new Map();

  it("Standard Render Tests", async () => {
    render(<VialPage
      {...props}
    />);
  });
});