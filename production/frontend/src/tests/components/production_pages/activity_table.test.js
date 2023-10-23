/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils";
import { render, screen, cleanup } from "@testing-library/react"

import { ActivityTable } from "~/components/production_pages/activity_table.js"

import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER } from "~/lib/constants.js";
import { testState } from "~/tests/app_state.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";


const module = jest.mock('~/lib/tracer_websocket.js');
const tracer_websocket = require("~/lib/tracer_websocket.js");

jest.mock('../../../components/modals/create_activity_modal', () =>
  ({CreateOrderModal : () => <div>CreateModalMocked</div>}))


let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
    container = document.createElement("div");
    websocket = tracer_websocket.TracerWebSocket
    props = {
      [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,26,33),
      [PROP_ACTIVE_TRACER] : 1,
    };
});

afterEach(() => {
  cleanup()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  props=null
});

describe("Activity table", () => {
  it("Standard render test", async () => {
    render(<StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityTable {...props} />
        </WebsocketContextProvider>
      </StateContextProvider>);

    expect(await screen.findByLabelText("time-slot-icon-1")).toBeVisible();
    expect(await screen.findByLabelText("time-slot-icon-4")).toBeVisible();

    //expect(await screen.findByText("Frigivet: 13538 MBq")).toBeVisible()
  })

  it("Create a new order", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ActivityTable {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () => {
      const button = await screen.findByRole('button', {name : "Opret ny ordre"})
      button.click()
    })

    expect(await screen.findByText("CreateModalMocked")).toBeVisible()
  })

  it("Open time slot row", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ActivityTable {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () => {
      const button = await screen.findByLabelText('open-time-slot-1');
      button.click()
    });
  });

  it("Open Order modal", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ActivityTable {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () => {
      const button = await screen.findByLabelText("time-slot-icon-1");
      button.click();
    })

    expect(await screen.findByTestId("activity_modal")).toBeVisible();

    await act(async () => {
      const button = await screen.findByRole('button', {name : "Luk"});
      button.click();
    });
    expect(screen.queryByTestId("activity_modal")).toBeNull();
  });
});