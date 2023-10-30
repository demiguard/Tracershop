/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils";
import { fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"


import { PROP_ACTIVE_DATE } from "../../../lib/constants.js";
import { AppState, testState } from "../../app_state.js";

import { InjectionTable } from "../../../components/production_pages/injection_table.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";


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
    websocket = new tracer_websocket.TracerWebSocket()
    props = {
      [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,36,44)
    };
});

afterEach(() => {
  cleanup()
  window.localStorage.clear();
  module.clearAllMocks();

  if(container != null) container.remove();
  container = null;
  props=null;
});


describe("Deadline Setup tests", () => {
  it("Standard render test", () => {
    render(<StateContextProvider value={testState}>
            <WebsocketContextProvider value={websocket}>
              <InjectionTable {...props}/>
            </WebsocketContextProvider>
          </StateContextProvider>);
  });

  it(("Change Sorting"), () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionTable {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const sort_status = screen.getByLabelText('sort-status');
    act(() => {
      sort_status.click();
    });
    // TODO: Assert sort

    // Invert The Sort
    act(() => {
      sort_status.click();
    });
    // TODO: Assert Sort


    const sort_order_id = screen.getByLabelText('sort-order-id');
    act(() => {
      sort_order_id.click();
    });
    // TODO: Assert sort

    const sort_destination = screen.getByLabelText('sort-destination');
    act(() => {
      sort_destination.click();
    });
    // TODO: Assert sort

    const sort_tracer = screen.getByLabelText('sort-tracer');
    act(() => {
      sort_tracer.click();
    });
    // TODO: Assert sort

    const sort_injections = screen.getByLabelText('sort-injections');
    act(() => {
      sort_injections.click();
    });
    // TODO: Assert sort

    const sort_deliver_time = screen.getByLabelText('sort-deliver-time');
    act(() => {
      sort_deliver_time.click();
    });
    // TODO: Assert sort

    const sort_usage = screen.getByLabelText('sort-usage');
    act(() => {
      sort_usage.click();
    });
    // TODO: Assert sort
  });

  it("Open Create injection Order Modal", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionTable {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const createNewOrderButton = screen.getByRole('button', {name : "Opret ny ordre"});

    act(() => {
      createNewOrderButton.click();
    });

    // TODO: Assert

    // Close it again
    const closeButton = screen.getByRole('button', {name : "Luk"});
    act(() => {
      closeButton.click()
    });
  });

  it("Open order modal", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionTable {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const statusIcon1 = screen.getByLabelText('status-icon-1');

    act(() => {
      statusIcon1.click();
    })

  });
})