/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState, testState } from "../../app_state";

import ConfigSite from "../../../components/sites/config_site"
import { PROP_USER } from "../../../lib/constants";
import { ANON } from "../../test_state/users";
import { TracerShopContext, WebsocketContextProvider } from "~/contexts/tracer_shop_context";

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

    render(
      <TracerShopContext value={websocket} tracershop_state={testState}>
        <WebsocketContextProvider >
          <ConfigSite {...props}/>
        </WebsocketContextProvider>
      </TracerShopContext>
    );
  })
})