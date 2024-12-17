/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"

import { AppState, testState } from "~/tests/app_state.js";

import { ProductionUserSetup } from "~/components/production_pages/setup_pages/production_user_setup.js"
import { StateContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";
import { WEBSOCKET_MESSAGE_SUCCESS } from "~/lib/shared_constants";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    container = document.createElement("div");
    websocket = tracer_websocket.TracerWebSocket
    props = {...AppState};
});

afterEach(() => {
  cleanup()
  window.localStorage.clear();
  module.clearAllMocks();

  if(container != null) container.remove();
  container = null;
  props=null;
});

describe("Production User Setup tests", () => {
  it("Standard Render tests", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProductionUserSetup {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);
  });

  it("Add user assignment", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProductionUserSetup {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const customerSelect9 = screen.getByLabelText('related-customer-9');

    await act( async () => {
      fireEvent.change(customerSelect9, {target : {value : 2}});
    })

    expect(websocket.sendCreateModel).toHaveBeenCalled()
  });

  it("Delete user assignment", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProductionUserSetup {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const customerSelect6 = screen.getByLabelText('related-customer-6');

    await act( async () => {
      fireEvent.change(customerSelect6, {target : {value : ""}});
    })

    expect(websocket.sendDeleteModel).toHaveBeenCalled()
  });

  it("Change user assignment", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProductionUserSetup {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const customerSelect6 = screen.getByLabelText('related-customer-6');

    await act( async () => {
      fireEvent.change(customerSelect6, {target : {value : "2"}});
    })

    expect(websocket.sendDeleteModel).toHaveBeenCalled();
    expect(websocket.sendCreateModel).toHaveBeenCalled();
  });
});
