/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils";
import { render, screen, cleanup } from "@testing-library/react"


import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE,  } from "~/lib/shared_constants.js";
import { AppState, testState } from "../../app_state.js";
import { OrderPage } from "../../../components/production_pages/order_page.js";
import { db } from "../../../lib/local_storage_driver.js";
import { DispatchContextProvider, StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

jest.mock('../../../components/production_pages/activity_table', () =>
  ({ActivityTable : () => <div>ActivityTableMocked</div>}))
jest.mock('../../../components/production_pages/injection_table', () =>
  ({InjectionTable : () => <div>InjectionTableMocked</div>}))


const dispatchMock = jest.fn();

let websocket = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    websocket = tracer_websocket.TracerWebSocket
});

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()
  websocket = null;
});

describe("Order Page tests", () => {
  it("Standard Render test", async () => {
    render(<StateContextProvider value={testState}>
            <WebsocketContextProvider value={websocket}>
              <OrderPage/>
            </WebsocketContextProvider>
          </StateContextProvider>);

    expect(await screen.findByRole('button', {name : 'test_tracer_1'})).toBeVisible()
    expect(await screen.findByRole('button', {name : 'test_tracer_3'})).toBeVisible()
    expect(await screen.findByRole('button', {name : 'Special'})).toBeVisible()

    expect(await screen.findByText('ActivityTableMocked')).toBeVisible()
  });

  it("Change to injection Table", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <OrderPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () =>{
       const button = await screen.findByRole('button', {name : 'Special'})
       button.click()
    })

    expect(await screen.findByText('InjectionTableMocked')).toBeVisible()
  })

  it("Change to injection Table", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <OrderPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () =>{
       const button = await screen.findByRole('button', {name : 'test_tracer_3'})
       button.click()
    })
    // I have no idea how to show that it's different
    expect(await screen.findByText('ActivityTableMocked')).toBeVisible()
  })

  it("Change day", async () => {
    render(<StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatchMock}>
        <WebsocketContextProvider value={websocket}>
          <OrderPage/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    await act(async () =>{
       const div = await screen.findByLabelText('calender-day-13')
       div.click()
    })
  })

  it("Change month", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <OrderPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    await act(async () =>{
       const image = await screen.findByLabelText('next-month')
       image.click()
    })

    const expected_message = {}
    expected_message[WEBSOCKET_DATE] = new Date("2020-06-01T10:00:00.000Z");
    expected_message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_GET_ORDERS;
    expect(websocket.send).toBeCalledWith(expected_message)
  });

  it("Load saved db data", async () => {
    db.set("activeTracer", -1)

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <OrderPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(await screen.findByText('InjectionTableMocked')).toBeVisible()
  });
});
