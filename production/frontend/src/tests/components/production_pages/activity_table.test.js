/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, scryRenderedComponentsWithType } from "react-dom/test-utils";
import { fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"
import { createRoot } from "react-dom/client";

import { WS } from "jest-websocket-mock";
import { ActivityTable } from "../../../components/production_pages/activity_table.js"
import { TracerWebSocket} from "../../../lib/tracer_websocket.js"
import { PROP_ACTIVE_DATE, PROP_WEBSOCKET, TRACER_TYPE_ACTIVITY } from "../../../lib/constants.js";
import { AppState } from "../../helpers.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");



let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
    container = document.createElement("div");
    websocket = new tracer_websocket.TracerWebSocket()
    props = {...AppState};
    props[PROP_WEBSOCKET] = websocket;
    props[PROP_ACTIVE_DATE] = new Date(2020,4,4,10,26,33);
});

afterEach(() => {
  cleanup()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  props=null
});

describe("Activity table", () => {
  it("standard Render test", () => {
    render(<ActivityTable {...props} />)


  })
})