/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ShopOrderPage } from '~/components/shop_pages/shop_order_page'
import { BookingStatus, DATA_BOOKING, SUCCESS_STATUS_CRUD, WEBSOCKET_DATA,
  WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_BOOKING,
  WEBSOCKET_MESSAGE_DELETE_BOOKING, WEBSOCKET_MESSAGE_ID,
  WEBSOCKET_MESSAGE_READ_BOOKINGS, WEBSOCKET_MESSAGE_STATUS,
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_REFRESH
} from "~/lib/shared_constants"
import {  testState } from "~/tests/app_state";
import {  TracerShopContext } from "~/contexts/tracer_shop_context";
import { UpdateToday } from "~/lib/state_actions";

import { MESSAGE_CREATE_BOOKING, MESSAGE_DELETE_BOOKING, MESSAGE_READ_BOOKINGS } from "~/lib/incoming_messages";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const websocket = tracer_websocket.TracerWebSocket;

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
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
    );

      unmount();

      expect(websocket.sendGetBookings).toHaveBeenCalledTimes(1);
      expect(websocket.addListener).toHaveBeenCalledTimes(1);
      expect(websocket.removeListener).toHaveBeenCalledWith(
        websocket.addListener.mock.results[0]['value']
      );
  });

  it("Change Day", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
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
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
    );

    await act(async () => {
      const prevMonth = screen.getByLabelText('prev-month')
      prevMonth.click();
    })

    expect(dispatchMock).toHaveBeenCalled();
    expect(websocket.sendGetBookings).toHaveBeenCalled();
  });

  it("Change Site", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
    );

    await act(async () => {
      const siteSelect = screen.getByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Automatisk"}})
    });

    expect(websocket.sendGetBookings).toHaveBeenCalledTimes(1);
  });

  it("Change customer", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
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
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
    );

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
      sendGetBookings : jest.fn(() => Promise.resolve( new MESSAGE_READ_BOOKINGS({
          [WEBSOCKET_MESSAGE_ID] : 689238541,
          [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS,
          [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
          [WEBSOCKET_DATA] : {
            [DATA_BOOKING] : [{
              pk : 1,
              fields : {
                status : BookingStatus.Initial,
                location : 1,
                procedure : 1,
                accession_number : "REGH00000000",
                start_time : "10:00:00",
                start_date : "2020-05-05"
              }
            }]
          },
          [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_READ_BOOKINGS,
        }))),
      addListener : jest.fn((func) => {
        const listenNumber = listeners.size;

        listeners.set(
          listenNumber, func
        );

        return listenNumber
      }),
      removeListener : jest.fn((listenNumber) => {
        listeners.delete(listenNumber)
      }),
    };

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
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
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
    );

    await act(async () => {
      websocket.triggerListeners({});
    });
  });

  it("Booking update Delete message", async () => {
    const listeners = new Map()

    const websocket = {
      sendGetBookings : jest.fn(() => Promise.resolve(new MESSAGE_READ_BOOKINGS({
        [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS,
        [WEBSOCKET_REFRESH] : false,
        [WEBSOCKET_DATA] : {
              [DATA_BOOKING] : [{
                pk : 1,
                fields : {
                  status : BookingStatus.Initial,
                  location : 1,
                  procedure : 1,
                  accession_number : "REGH00000000",
                  start_time : "10:00:00",
                  start_date : "2020-05-05"
                }
              },{
                pk : 2,
                fields : {
                  status : BookingStatus.Initial,
                  location : 1,
                  procedure : 2,
                  accession_number : "REGH00000000",
                  start_time : "10:00:00",
                  start_date : "2020-05-05"
                }
              }]
            },
        [WEBSOCKET_MESSAGE_ID] : 3123,
          [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
          [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_READ_BOOKINGS,
      }))),
      addListener : jest.fn((func) => {
        const listenNumber = listeners.size;
        listeners.set(listenNumber, func);
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
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
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
      websocket.triggerListeners(new MESSAGE_DELETE_BOOKING({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_DELETE_BOOKING,
        [WEBSOCKET_DATA_ID] : [1],
        [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
        [WEBSOCKET_DATATYPE] : DATA_BOOKING,
        [WEBSOCKET_MESSAGE_ID] : 16879023,
      }));
    });
    expect(screen.queryByText(procedureIdentifier.description)).toBeNull();
  });

  it("Create booking from triggered update", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ShopOrderPage relatedCustomer={testState.customer}/>
      </TracerShopContext>
    );

    await act(async () => {
      const siteSelect = screen.getByLabelText('site-select')
      fireEvent.change(siteSelect, {target : {value : "Overview"}})
    });

    await act(async () => {
      websocket.triggerListeners(
        new MESSAGE_CREATE_BOOKING({
          [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
          [WEBSOCKET_MESSAGE_ID] : 16879023,
          [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_BOOKING,
          [WEBSOCKET_DATA] : { [DATA_BOOKING] : [{ // Serialization happens inside of constructor
            pk : 1,
            fields : {
              status : 1,
              location : 1,
              procedure : 1,
              accession_number : "TEST",
              start_time : "10:00:00",
              start_date : "2020-05-05",
            }
            }, {
              pk : 2,
              fields : {
                status : 1,
                location : 1,
                procedure : 2,
                accession_number : "TEST",
                start_time : "10:00:00",
                start_date : "2020-05-05",
              }
            }
          ]},
        })
      );
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