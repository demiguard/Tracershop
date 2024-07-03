/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState, testState } from "../../app_state.js";

import { PROP_USER } from "../../../lib/constants.js";
import { ShopSite } from "../../../components/sites/shop_site.js";
import { users } from "../../test_state/users.js";
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
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
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

describe("Shop shop test suite", () => {
  it("standard test - render test Site Admin", () => {

    render(<StateContextProvider value={testState}>
             <WebsocketContextProvider value={websocket}>
              <ShopSite logout={logout} />
             </WebsocketContextProvider>
           </StateContextProvider>);

  });


  it("standard test - shop admin", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(4),
    });

    render(<StateContextProvider value={newState}>
      <WebsocketContextProvider value={websocket}>
       <ShopSite logout={logout} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.queryByLabelText("no-assoc-internal-user-error")).toBeNull();
  });

  it("standard test - shop internal",  () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(5),
    });

    render(<StateContextProvider value={newState}>
      <WebsocketContextProvider value={websocket}>
       <ShopSite logout={logout} />
      </WebsocketContextProvider>
    </StateContextProvider>);
    expect(screen.queryByLabelText("no-assoc-internal-user-error")).toBeNull();
  });

  it("standard test -  external",  () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(6),
    });

    render(<StateContextProvider value={newState}>
      <WebsocketContextProvider value={websocket}>
       <ShopSite logout={logout} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.queryByLabelText("no-assoc-external-user-error")).toBeNull();
  });

  it("standard test - no associated customer admin", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(7),
    });

    render(<StateContextProvider value={newState}>
      <WebsocketContextProvider value={websocket}>
       <ShopSite logout={logout} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(await screen.findByLabelText("no-assoc-internal-user-error")).toBeVisible()
  });

  it("standard test - no associated customer internal", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(8),
    });

    render(<StateContextProvider value={newState}>
      <WebsocketContextProvider value={websocket}>
       <ShopSite logout={logout} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(await screen.findByLabelText("no-assoc-internal-user-error")).toBeVisible()
  });

  it("standard test - no associated customer external", async () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(9),
    });

    render(<StateContextProvider value={newState}>
      <WebsocketContextProvider value={websocket}>
       <ShopSite logout={logout} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(await screen.findByLabelText("no-assoc-external-user-error")).toBeVisible()
  });
})