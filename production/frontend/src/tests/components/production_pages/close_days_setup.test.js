/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, render, screen, cleanup } from "@testing-library/react"

import { AppState, testState } from "../../app_state.js";

import { CloseDaysPage } from "../../../components/production_pages/setup_pages/close_days_page.js";
import { StateContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = null;
let container = null;


beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    container = document.createElement("div");
    websocket = tracer_websocket.TracerWebSocket

});

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
});


describe("Close Days Setup test", () => {
  it("Standard Render test", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CloseDaysPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(await screen.findByLabelText('calender-day-1')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-2')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-3')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-4')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-5')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-6')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-7')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-13')).toBeVisible()
  });

  it("Create close date", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CloseDaysPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);
    await act(async () => {
      const button = await screen.findByLabelText('calender-day-12')
      button.click();
    })
  })

  it("Delete close date", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CloseDaysPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);
    await act(async () => {
      // Note that from src/tests/test_state/close_dates
      const button = await screen.findByLabelText('calender-day-13')
      button.click();
    });
  })

})