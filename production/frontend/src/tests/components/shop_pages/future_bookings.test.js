/**
 * @jest-environment jsdom
 */

import React, { } from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals';
import { bookings } from "~/tests/test_state/bookings";
import { testState } from "~/tests/app_state";
import { FutureBooking, missingSetupHeader
} from "~/components/shop_pages/future_bookings";
import { PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_VALID_ACTIVITY_DEADLINE,
  PROP_VALID_INJECTION_DEADLINE
} from "~/lib/constants";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { Booking } from "~/dataclasses/dataclasses";
import { BookingStatus, ERROR_EARLY_BOOKING_TIME, ERROR_EARLY_TIME_SLOT,
  WEBSOCKET_ERROR, WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_TYPE,
  WEBSOCKET_MESSAGE_UPDATE_STATE
} from "~/lib/shared_constants";


const module = jest.mock('../../../lib/tracer_websocket.js');
const websocket_module = require("../../../lib/tracer_websocket.js");

let websocket = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44);

beforeEach(async () => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  websocket = websocket_module.TracerWebSocket;
  props = {
    [PROP_ACTIVE_DATE] : now,
    [PROP_ACTIVE_ENDPOINT] : 1,
    [PROP_VALID_ACTIVITY_DEADLINE] : true,
    [PROP_VALID_INJECTION_DEADLINE] : true,
    booking : [...bookings.values()],
  }
});

afterEach(() => {
  cleanup();
  module.clearAllMocks();
  window.localStorage.clear();

  websocket = null;
  props = null;
});

describe("Future Bookings Test Suite", () => {
  it("Standard render test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FutureBooking {...props}/>
      </TracerShopContext>
    );

    expect(screen.getByText(testState.tracer.get(1).shortname));
    expect(screen.getByText(missingSetupHeader));
    expect(screen.getByText(testState.tracer.get(2).shortname));
  });

  it("Open procedures", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FutureBooking {...props}/>
      </TracerShopContext>
    );

    const openUnsetProcedures = screen.getByLabelText("open-unset-procedures");

    act(() => {
      openUnsetProcedures.click();
    });

    expect(screen.getByText(testState.procedure_identifier.get(5).description));
  });

  it("Open tracer 1, Remove booking 2 and order", async () => {
    const websocket = {
      getMessage : jest.fn((param) => { return { [WEBSOCKET_MESSAGE_TYPE] : param } }),
      send : jest.fn(() => Promise.resolve({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_UPDATE_STATE
      }))
    }

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FutureBooking {...props}/>
      </TracerShopContext>
    );

    const openTracer1 = screen.getByLabelText("open-tracer-1");

    act(() => {
      openTracer1.click();
    });

    const toggleBooking2Checkbox = screen.getByTestId("toggle-2");

    act(() => {
      toggleBooking2Checkbox.click();
    });

    const orderButton = screen.getByTestId("order-button-1")

    await act(async () => {
      orderButton.click();
    });

    expect(websocket.send).toBeCalled()
  });

  it("Open tracer 1, Remove booking 2 and order, but can't because early bookings", async () => {
    const websocket = {
      getMessage : jest.fn((param) => { return { [WEBSOCKET_MESSAGE_TYPE] : param } }),
      send : jest.fn(() => Promise.resolve({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_ERROR,
        [WEBSOCKET_ERROR] : {
          [ERROR_EARLY_BOOKING_TIME] : "08:15:00",
          [ERROR_EARLY_TIME_SLOT] : "08:30:00",
        }
      }))
    }

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FutureBooking {...props}/>
      </TracerShopContext>
    );

    const openTracer1 = screen.getByLabelText("open-tracer-1");

    act(() => {
      openTracer1.click();
    });

    const toggleBooking2Checkbox = screen.getByTestId("toggle-2");

    act(() => {
      toggleBooking2Checkbox.click();
    });

    const orderButton = screen.getByTestId("order-button-1")

    await act(async () => {
      orderButton.click();
    });

    expect(websocket.send).toBeCalled();
    expect(screen.getByTestId("booking_error-1")).toBeVisible();
  });

  it("Open tracer 1, Remove booking 2 and order, but can't no time slot", async () => {
    const websocket = {
      getMessage : jest.fn((param) => { return { [WEBSOCKET_MESSAGE_TYPE] : param } }),
      send : jest.fn(() => Promise.resolve({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_ERROR,
        [WEBSOCKET_ERROR] : {
          [ERROR_EARLY_BOOKING_TIME] : "08:15:00",
          [ERROR_EARLY_TIME_SLOT] : null,
        }
      }))
    }

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FutureBooking {...props}/>
      </TracerShopContext>
    );

    const openTracer1 = screen.getByLabelText("open-tracer-1");

    act(() => {
      openTracer1.click();
    });

    const toggleBooking2Checkbox = screen.getByTestId("toggle-2");

    act(() => {
      toggleBooking2Checkbox.click();
    });

    const orderButton = screen.getByTestId("order-button-1");

    await act(async () => { orderButton.click(); });

    expect(websocket.send).toBeCalled();
    expect(screen.getByTestId("booking_error-1")).toBeVisible();
  });

  it("ChangeSorting", () => {
    const newProps = {...props};

    newProps.booking = [
      new Booking(1, BookingStatus.Initial, 2, 1, "B", "10:00:00"),
      new Booking(2, BookingStatus.Initial, 1, 1, "A", "11:00:00")
    ];

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <FutureBooking {...newProps}/>
      </TracerShopContext>
    );

    expect(
      screen.getByTestId('booking-row-1').compareDocumentPosition(screen
        .getByTestId('booking-row-2'))).toEqual(
          Node.DOCUMENT_POSITION_FOLLOWING
        );

    act(() => {
      screen.getByText('Accession').click()
    })

    expect(
      screen.getByTestId('booking-row-1').compareDocumentPosition(screen
        .getByTestId('booking-row-2'))).toEqual(
          Node.DOCUMENT_POSITION_PRECEDING
        );
  });
});