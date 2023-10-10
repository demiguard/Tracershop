/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ShopOrderPage } from '~/components/shop_pages/shop_order_page'
import { DATABASE_TODAY } from "~/lib/constants.js";
import { WEBSOCKET_MESSAGE_GET_ORDERS } from "~/lib/shared_constants"
import { AppState } from "~/tests/app_state.js";
import { db } from "~/lib/local_storage_driver.js";
import { WebsocketContextProvider } from "~/components/tracer_shop_context";
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

jest.mock('~/components/shop_pages/order_review', () =>
  ({OrderReview : () => <div>OrderReviewMock</div>}))

jest.mock('~/components/shop_pages/future_bookings', () =>
  ({FutureBooking : () => <div>FutureBookingMock</div>}))

const now = new Date(2020,4, 4, 10, 36, 44)

beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
  props = {...AppState}
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

describe("Shop Order page test suite", () => {
  it("Standard Render Test", () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopOrderPage {...props} />
    </WebsocketContextProvider>);

    const today = db.get(DATABASE_TODAY);
    // God i hate time zones
    expect(today).toEqual("\"2020-05-04T08:36:44.000Z\"");

  });

  it("Change Day", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopOrderPage {...props} />
    </WebsocketContextProvider>);

    await act(async () => {
      const day = await screen.findByLabelText('calender-day-7')
      day.click()
    })
    const today = db.get(DATABASE_TODAY);
    expect(today).toEqual("\"2020-05-07T10:00:00.000Z\"");
  });

  it("Change month", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopOrderPage {...props} />
    </WebsocketContextProvider>);

    await act(async () => {
      const prevMonth = await screen.findByLabelText('prev-month')
      prevMonth.click()
    })
    const today = db.get(DATABASE_TODAY);
    expect(today).toEqual("\"2020-05-04T08:36:44.000Z\"");
    expect(websocket.getMessage).toBeCalledWith(WEBSOCKET_MESSAGE_GET_ORDERS);
    expect(websocket.send).toBeCalled();

  });

  it("Change Site", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopOrderPage {...props} />
    </WebsocketContextProvider>);

    await act(async () => {
      const siteSelect = await screen.findByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Automatisk"}})
    });
  });

  it("Change customer", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopOrderPage {...props} />
    </WebsocketContextProvider>);

    await act(async () => {
      const customerSelect = await screen.findByLabelText('customer-select')
      fireEvent.change(customerSelect, {target : {value : 3}})
    });
  });

  it("Change endpoint", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopOrderPage {...props} />
    </WebsocketContextProvider>);

    await act(async () => {
      const endpointSelect = await screen.findByLabelText('endpoint-select')
      fireEvent.change(endpointSelect, {target : {value : 2}})
    });
  });

})