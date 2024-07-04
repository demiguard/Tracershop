/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState, testState } from "~/tests/app_state.js";

import { PROP_USER } from "~/lib/constants.js";
import { ProductionSite } from "~/components/sites/production_site.js";
import { users } from "~/tests/test_state/users.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { TracershopState } from "~/dataclasses/dataclasses.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const logout = jest.fn();

let websocket = null;
let container = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44);


beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  delete window.location;
  window.location = { href : "tracershop"};
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState};
  props[PROP_USER] = users.get(1);
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

describe("Production site test suite", () => {
  it("standard test - Admin", async () => {

    render(<StateContextProvider value={testState}>
            <WebsocketContextProvider value={websocket}>
              <ProductionSite logout={logout} NavbarElements={[]} />
            </WebsocketContextProvider>
          </StateContextProvider>);


    expect(await screen.findByLabelText('navbar-orders')).toBeVisible();
    expect(await screen.findByLabelText('navbar-vial')).toBeVisible();
    expect(await screen.findByLabelText('navbar-setup')).toBeVisible();
  });

  it("standard test - user", async () => {

    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(3),
    })
    render(<StateContextProvider value={newState}>
             <WebsocketContextProvider value={websocket}>
               <ProductionSite logout={logout} NavbarElements={[]} />
             </WebsocketContextProvider>
           </StateContextProvider>);

    expect(await screen.findByLabelText('navbar-orders')).toBeVisible();
    expect(await screen.findByLabelText('navbar-vial')).toBeVisible();
    expect(screen.queryByLabelText('navbar-setup')).toBeNull();
  });

})