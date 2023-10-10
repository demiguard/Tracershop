/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState } from "../../app_state.js";

import { PROP_USER } from "../../../lib/constants.js";
import { ShopSite } from "../../../components/sites/shop_site.js";
import { users } from "../../test_state/users.js";
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


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

describe("Shop shop test suite", () => {
  it("standard test - render test Site Admin", () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopSite {...props} />
    </WebsocketContextProvider>);
  });


  it("standard test - shop admin", async () => {
    props[PROP_USER] = users.get(4);
    render(<WebsocketContextProvider value={websocket}>
      <ShopSite {...props} />
    </WebsocketContextProvider>);

    expect(screen.queryByLabelText("no-assoc-internal-user-error")).toBeNull();
  });

  it("standard test - shop internal",  () => {
    props[PROP_USER] = users.get(5);
    render(<WebsocketContextProvider value={websocket}>
      <ShopSite {...props} />
    </WebsocketContextProvider>);

    expect(screen.queryByLabelText("no-assoc-internal-user-error")).toBeNull();
  });

  it("standard test -  external",  () => {
    props[PROP_USER] = users.get(6);
    render(<WebsocketContextProvider value={websocket}>
      <ShopSite {...props} />
    </WebsocketContextProvider>);

    expect(screen.queryByLabelText("no-assoc-external-user-error")).toBeNull();
  });

  it("standard test - no associated customer admin", async () => {
    props[PROP_USER] = users.get(7);
    render(<WebsocketContextProvider value={websocket}>
      <ShopSite {...props} />
    </WebsocketContextProvider>);

    expect(await screen.findByLabelText("no-assoc-internal-user-error")).toBeVisible()
  });

  it("standard test - no associated customer internal", async () => {
    props[PROP_USER] = users.get(8);
    render(<WebsocketContextProvider value={websocket}>
      <ShopSite {...props} />
    </WebsocketContextProvider>);

    expect(await screen.findByLabelText("no-assoc-internal-user-error")).toBeVisible()
  });

  it("standard test - no associated customer external", async () => {
    props[PROP_USER] = users.get(9);
    render(<WebsocketContextProvider value={websocket}>
      <ShopSite {...props} />
    </WebsocketContextProvider>);

    expect(await screen.findByLabelText("no-assoc-external-user-error")).toBeVisible()
  });
})