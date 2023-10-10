/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState } from "../../app_state.js";
import { db } from "../../../lib/local_storage_driver.js";
import { ConfigSite } from "../../../components/sites/config_site.js"
import { PROP_USER } from "../../../lib/constants.js";
import { ANON } from "../../test_state/users.js";
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

jest.mock('../../../components/admin_pages/control_panel.js', () =>
 ({ControlPanel : () => <div>Control Panel</div>}))

let websocket = null;
let container = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44)


beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState};

  props[PROP_USER] = ANON;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});

describe("Congig Site test suite", () => {
  it("standard test", () => {
    render(<WebsocketContextProvider value={websocket}>
      <ConfigSite {...props}/>
    </WebsocketContextProvider>);
  })
})