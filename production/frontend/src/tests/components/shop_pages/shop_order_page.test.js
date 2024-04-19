/**
 * @jest-environment jsdom
 */

import React, {StrictMode} from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ShopOrderPage } from '~/components/shop_pages/shop_order_page'
import { DATABASE_TODAY } from "~/lib/constants.js";
import { WEBSOCKET_MESSAGE_GET_ORDERS } from "~/lib/shared_constants"
import { AppState, testState } from "~/tests/app_state.js";
import { DispatchContextProvider, StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context";
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;

jest.mock('~/components/shop_pages/order_review', () =>
({OrderReview : () => <div>OrderReviewMock</div>}))

jest.mock('~/components/shop_pages/future_bookings', () =>
({FutureBooking : () => <div>FutureBookingMock</div>}))

jest.useFakeTimers('modern')
const now = new Date(2020,4, 4, 10, 36, 44)
jest.setSystemTime(now)
import { db } from "~/lib/local_storage_driver.js";

const dispatchMock = jest.fn()

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  websocket = null;
});

describe("Shop Order page test suite", () => {
  it("Standard Render Test", () => {
    render(
    <StrictMode>
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={[...testState.customer.values()]}/>
        </WebsocketContextProvider>
      </StateContextProvider>
    </StrictMode>);

  });

  it("Change Day", async () => {
    render(
      <StrictMode>
        <StateContextProvider value={testState}>
          <DispatchContextProvider value={dispatchMock}>
            <WebsocketContextProvider value={websocket}>
              <ShopOrderPage relatedCustomer={[...testState.customer.values()]}/>
            </WebsocketContextProvider>
          </DispatchContextProvider>
        </StateContextProvider>
      </StrictMode>);

    await act(async () => {
      const day = await screen.findByLabelText('calender-day-7')
      day.click();
    })

    //expect(dispatchMock).toHaveBeenCalled();
  });

  it("Change month", async () => {
    render(
      <StrictMode>
        <StateContextProvider value={testState}>
          <DispatchContextProvider value={dispatchMock}>
            <WebsocketContextProvider value={websocket}>
              <ShopOrderPage relatedCustomer={[...testState.customer.values()]}/>
            </WebsocketContextProvider>
          </DispatchContextProvider>
        </StateContextProvider>
      </StrictMode>);

    await act(async () => {
      const prevMonth = await screen.findByLabelText('prev-month')
      prevMonth.click()
    })

    expect(dispatchMock).toHaveBeenCalled();
  });

  it("Change Site", async () => {
    render(<StrictMode>
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={[...testState.customer.values()]}/>
        </WebsocketContextProvider>
      </StateContextProvider>
    </StrictMode>);

    await act(async () => {
      const siteSelect = await screen.findByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Automatisk"}})
    });
  });

  it("Change customer", async () => {
    render(
      <StrictMode>
        <StateContextProvider value={testState}>
          <WebsocketContextProvider value={websocket}>
            <ShopOrderPage relatedCustomer={[...testState.customer.values()]}/>
          </WebsocketContextProvider>
        </StateContextProvider>
      </StrictMode>);

    await act(async () => {
      const customerSelect = await screen.findByLabelText('customer-select')
      fireEvent.change(customerSelect, {target : {value : 3}})
    });
  });

  it("Change endpoint", async () => {
    render(
      <StrictMode>

      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={[...testState.customer.values()]}/>
        </WebsocketContextProvider>
      </StateContextProvider>
      </StrictMode>);

    await act(async () => {
      const endpointSelect = await screen.findByLabelText('endpoint-select')
      fireEvent.change(endpointSelect, {target : {value : 2}})
    });
  });
});