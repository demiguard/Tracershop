/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState, testState } from "../../app_state.js";
import { TracerShop } from "../../../components/sites/tracer_shop.js"
import { PROP_USER } from "../../../lib/constants.js";
import { ANON, users } from "../../test_state/users.js";
import { DispatchContextProvider, StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { TracershopState } from "~/dataclasses/dataclasses.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const dispatchMock = jest.fn();

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

describe("Tracer shop test suite", () => {
  it("Standard Render test ANON", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : ANON,
    })



    render(<StateContextProvider value={newState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <TracerShop />
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);
  })

  it("standard test Site admin", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(1),
    })



    render(<StateContextProvider value={newState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <TracerShop />
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);
  })

  it("standard test Production Admin", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(2),
    })


    render(<StateContextProvider value={newState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <TracerShop />
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);
  })

  it("standard test Production user", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(3),
    })


    render(<StateContextProvider value={newState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <TracerShop />
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);
  })

  it("standard test Shop Admin", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(4),
    })


    render(<StateContextProvider value={newState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <TracerShop />
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);
  })

  it("standard test shop user", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(5),
    })

    render(<StateContextProvider value={newState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <TracerShop />
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);
  })

  it("standard test shop external", () => {
    const newState = Object.assign(new TracershopState(), {
      ...testState,
      logged_in_user : users.get(6),
    })


    render(
    <StateContextProvider value={newState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <TracerShop />
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);
  })
})
