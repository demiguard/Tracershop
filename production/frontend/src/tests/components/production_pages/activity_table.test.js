/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, render, screen, cleanup } from "@testing-library/react"
import { ActivityTable } from "~/components/production_pages/activity_table.js"
import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER } from "~/lib/constants.js";
import { testState } from "~/tests/app_state.js";
import { StateContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";


const module = jest.mock('~/lib/tracer_websocket.js');
const tracer_websocket = require("~/lib/tracer_websocket.js");

jest.mock('../../../components/modals/create_activity_modal', () =>
  ({CreateOrderModal : () => <div>CreateModalMocked</div>}))


let websocket = tracer_websocket.TracerWebSocket;
let props = {
  [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,26,33),
  [PROP_ACTIVE_TRACER] : 1,
};

afterEach(() => {
  cleanup()
  module.clearAllMocks()
});

describe("Activity table", () => {
  it("Standard render test", () => {
    render(<StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityTable {...props} />
        </WebsocketContextProvider>
      </StateContextProvider>);

    expect(screen.getByLabelText("time-slot-icon-1")).toBeVisible();
    expect(screen.getByLabelText("time-slot-icon-4")).toBeVisible();

    //expect(await screen.findByText("Frigivet: 13538 MBq")).toBeVisible()
  })

  it("Create a new order", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ActivityTable {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act(() => {
      const button = screen.getByRole('button', {name : "Opret ny ordre"})
      button.click()
    })

    expect(screen.getByText("CreateModalMocked")).toBeVisible()
  })

  it("Open time slot row", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ActivityTable {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act( () => {
      const button = screen.getByLabelText('open-time-slot-1');
      button.click()
    });
  });

  it("Open Order modal", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ActivityTable {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act(() => {
      const button = screen.getByLabelText("time-slot-icon-1");
      button.click();
    })

    expect(screen.getByTestId("activity_modal")).toBeVisible();

    act(() => {
      const button = screen.getByRole('button', {name : "Luk"});
      button.click();
    });
    expect(screen.queryByTestId("activity_modal")).toBeNull();
  });


});