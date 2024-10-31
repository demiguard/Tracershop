/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ShopOrderPage } from '~/components/shop_pages/shop_order_page'
import { WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_CREATE_BOOKING, WEBSOCKET_MESSAGE_DELETE_BOOKING, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants"
import {  testState } from "~/tests/app_state.js";
import { DispatchContextProvider, StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context";
import { UpdateToday } from "~/lib/state_actions.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const websocket = tracer_websocket.TracerWebSocket;;
let container = null;

jest.useFakeTimers('modern')
const now = new Date(2020,4, 4, 10, 36, 44)
jest.setSystemTime(now)

const dispatchMock = jest.fn()

beforeAll(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
})

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  websocket.resetListeners();
});

describe("Shop Order page test suite", () => {
  it("Standard Render Test", async () => {
    const {unmount} = render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

      unmount();

      expect(websocket.sendGetBookings).toHaveBeenCalledTimes(1);
      expect(websocket.addListener).toHaveBeenCalledTimes(1);
      expect(websocket.removeListener).toHaveBeenCalledWith(
        websocket.addListener.mock.results[0]['value']
      );
  });

  it("Change Day", async () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatchMock}>
          <WebsocketContextProvider value={websocket}>
            <ShopOrderPage relatedCustomer={testState.customer}/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
      </StateContextProvider>
    );

    await act(async () => {
      const day = screen.getByLabelText('calender-day-7')
      day.click();
    })

    expect(dispatchMock).toHaveBeenCalled();
    expect(dispatchMock.mock.calls[0][0]).toBeInstanceOf(UpdateToday);
    expect(websocket.sendGetBookings).toHaveBeenCalled();
  });

  it("Change month", async () => {
      render(
        <StateContextProvider value={testState}>
          <DispatchContextProvider value={dispatchMock}>
            <WebsocketContextProvider value={websocket}>
              <ShopOrderPage relatedCustomer={testState.customer}/>
            </WebsocketContextProvider>
          </DispatchContextProvider>
        </StateContextProvider>);

    await act(async () => {
      const prevMonth = screen.getByLabelText('prev-month')
      prevMonth.click();
    })

    expect(dispatchMock).toHaveBeenCalled();
    expect(websocket.sendGetBookings).toHaveBeenCalled();
  });

  it("Change Site", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    await act(async () => {
      const siteSelect = screen.getByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Automatisk"}})
    });

    expect(websocket.sendGetBookings).toHaveBeenCalledTimes(1);
  });

  it("Change customer", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>
    );

    await act(async () => {
      const customerSelect = screen.getByLabelText('customer-select')
      fireEvent.change(customerSelect, {target : {value : 3}})
    });

    // So here we have a fucking classic cascade that should be reduced to 2 calls
    expect(websocket.sendGetBookings).toHaveBeenCalledTimes(2);
  });

  it("Change endpoint", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    await act(async () => {
      const endpointSelect = screen.getByLabelText('endpoint-select');
      fireEvent.change(endpointSelect, {target : {value : 2}});
    });

    expect(websocket.sendGetBookings).toHaveBeenCalled();
    expect(websocket.sendGetBookings).toHaveBeenCalledTimes(2);
  });

  it("Send Get Booking returns bookings", async () => {
    const listeners = new Map()

    const websocket = {
      sendGetBookings : jest.fn(() => Promise.resolve({
        [WEBSOCKET_DATA] : [
          { pk : 1, fields : { status : 1,
                               location : 1,
                               procedure : 1,
                               accession_number : "DKREGH0011223344",
                               start_time : "10:00:00", start_date : "2020-05-05"}
          },
        ]
      })),
      addListener : jest.fn((func) => {
        let listenNumber = listeners.size;

        listeners.set(
          listenNumber, func
        );

        return listenNumber
      }),
      removeListener : jest.fn((listenNumber) => {
        listeners.delete(listenNumber)
      })
    }

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>
    );

    await act(async () => {
      const siteSelect = screen.getByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Overview"}})
    });

    const procedure = testState.procedure.get(1);
    expect(procedure).toBeDefined();
    const procedureIdentifier = testState.procedure_identifier.get(procedure.series_description);

    expect(websocket.sendGetBookings).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(procedureIdentifier.description)[0]).toBeVisible();
    expect(screen.getAllByText(procedureIdentifier.description)[1]).not.toBeVisible();

    await act(async () => {
      fireEvent.mouseEnter(screen.getAllByText(procedureIdentifier.description)[0]);
    });

    expect(screen.getAllByText(procedureIdentifier.description)[1]).toBeVisible();
  });

  it("Booking update Malform message", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>
    );

    await act(async () => {
      websocket.triggerListeners({});
    });
  });

  it("Booking update Delete message", async () => {
    const listeners = new Map()

    const websocket = {
      sendGetBookings : jest.fn(() => Promise.resolve({
        [WEBSOCKET_DATA] : [
          { pk : 1, fields : { status : 1,
                               location : 1,
                               procedure : 1,
                               accession_number : "DKREGH0011223344",
                               start_time : "10:00:00", start_date : "2020-05-05"}
          }, { pk : 2, fields : { status : 1,
            location : 1,
            procedure : 2,
            accession_number : "DKREGH0011223344",
            start_time : "11:00:00", start_date : "2020-05-05"}
},
        ]
      })),
      addListener : jest.fn((func) => {
        let listenNumber = listeners.size;

        listeners.set(
          listenNumber, func
        );

        return listenNumber
      }),
      removeListener : jest.fn((listenNumber) => {
        listeners.delete(listenNumber)
      }),

      triggerListeners : jest.fn((x) => {
        for(const l of listeners.values()){
          l(x);
        }
      })
    }

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>
    );

    await act(async () => {
      const siteSelect = screen.getByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Overview"}})
    });

    const procedure = testState.procedure.get(1);
    expect(procedure).toBeDefined();
    const procedureIdentifier = testState.procedure_identifier.get(procedure.series_description);
    expect(screen.getAllByText(procedureIdentifier.description)[0]).toBeVisible();
    expect(screen.getAllByText(procedureIdentifier.description)[1]).not.toBeVisible();


    const procedure2 = testState.procedure.get(2);
    expect(procedure2).toBeDefined();
    const procedureIdentifier2 = testState.procedure_identifier.get(procedure2.series_description);

    expect(websocket.sendGetBookings).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(procedureIdentifier2.description)[0]).toBeVisible();
    expect(screen.getAllByText(procedureIdentifier2.description)[1]).not.toBeVisible();

    await act(async () => {
      websocket.triggerListeners({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_DELETE_BOOKING,
        [WEBSOCKET_DATA_ID] : [1],
      });
    });
    expect(screen.queryByText(procedureIdentifier.description)).toBeNull();
  });

  it("Create booking from triggered update", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ShopOrderPage relatedCustomer={testState.customer}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    await act(async () => {
      const siteSelect = screen.getByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Overview"}})
    });

    await act(async () => {
      websocket.triggerListeners({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_BOOKING,
        [WEBSOCKET_DATA] : [
          { pk : 1, fields : { status : 1,
                               location : 1,
                               procedure : 1,
                               accession_number : "DKREGH0011223344",
                               start_time : "10:00:00", start_date : "2020-05-05"}
          }, { pk : 2, fields : { status : 1,
            location : 1,
            procedure : 2,
            accession_number : "DKREGH0011223344",
            start_time : "11:00:00", start_date : "2020-05-05"}
          },
        ],
      });
    });

    const procedure = testState.procedure.get(1);
    expect(procedure).toBeDefined();
    const procedureIdentifier = testState.procedure_identifier.get(procedure.series_description);
    expect(screen.getAllByText(procedureIdentifier.description)[0]).toBeVisible();
    expect(screen.getAllByText(procedureIdentifier.description)[1]).not.toBeVisible();


    const procedure2 = testState.procedure.get(2);
    expect(procedure2).toBeDefined();
    const procedureIdentifier2 = testState.procedure_identifier.get(procedure2.series_description);

    expect(screen.getAllByText(procedureIdentifier2.description)[0]).toBeVisible();
    expect(screen.getAllByText(procedureIdentifier2.description)[1]).not.toBeVisible();

  });
});