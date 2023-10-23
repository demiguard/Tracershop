/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { TracerModal } from "~/components/modals/tracer_modal.js"
import { PROP_ACTIVE_TRACER, PROP_ON_CLOSE } from "~/lib/constants.js";
import { DATA_CUSTOMER, DATA_TRACER, DATA_TRACER_MAPPING } from "~/lib/shared_constants.js"
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { testState } from "~/tests/app_state";
import { act } from "react-dom/test-utils";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const onClose = jest.fn();

let websocket = null;
let container = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop" }
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


const props = {
  [PROP_ACTIVE_TRACER] : 2,
  [PROP_ON_CLOSE] : onClose,
};

describe("Tracer Modal test suite", () => {
  it("Standard Render test", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <TracerModal {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    for(const customer of testState.customer.values()){
      expect(screen.getByText(customer.short_name)).toBeVisible()
    }

  });

  it("Filter tests", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <TracerModal {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);
    const filterInput = await screen.findByLabelText('input-filter')
    act(() => {
      fireEvent.change(filterInput, {target : {value : "2" }})
    })

    expect(screen.queryByText("Customer_1")).toBeNull();
    expect(screen.queryByText("Customer_2")).toBeVisible();
    expect(screen.queryByText("Customer_3")).toBeNull();
  });

  it("Add tracer to customer 4", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <TracerModal {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const customer2CheckBox = screen.getByLabelText("check-4")

    act(() => {
      fireEvent.click(customer2CheckBox);
    })

    expect(websocket.send).toBeCalled();
  });

  it("Remove tracer to customer 1", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <TracerModal {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const customer2CheckBox = screen.getByLabelText("check-1")

    act(() => {
      fireEvent.click(customer2CheckBox);
    })

    expect(websocket.send).toBeCalled();

  });

})