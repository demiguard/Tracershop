/**
 * @jest-environment jsdom
 */

import React, { } from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals';
import { bookings } from "~/tests/test_state/bookings.js";
import { testState } from "../../app_state.js";
import { FutureBooking, missingSetupHeader } from "../../../components/shop_pages/future_bookings.js";
import { PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_VALID_ACTIVITY_DEADLINE, PROP_VALID_INJECTION_DEADLINE } from "~/lib/constants.js";
import { StateContextProvider, useTracershopState, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { Booking } from "~/dataclasses/dataclasses.js";
import { BookingStatus } from "~/lib/shared_constants.js";


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
    render(<StateContextProvider value={testState}>
            <WebsocketContextProvider value={websocket}>
              <FutureBooking {...props}/>
            </WebsocketContextProvider>
          </StateContextProvider>);

    expect(screen.getByText(testState.tracer.get(1).shortname));
    expect(screen.getByText(missingSetupHeader));
    expect(screen.getByText(testState.tracer.get(2).shortname));
  });

  it("Open procedures", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <FutureBooking {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const openUnsetProcedures = screen.getByLabelText("open-unset-procedures");

    act(() => {
      openUnsetProcedures.click();
    });

    expect(screen.getByText(testState.procedure_identifier.get(5).description));
  });

  it("Open tracer 1, Remove booking 2 and order", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <FutureBooking {...props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const openTracer1 = screen.getByLabelText("open-tracer-1");

    act(() => {
      openTracer1.click();
    });

    const toggleBooking2Checkbox = screen.getByTestId("toggle-2");

    act(() => {
      toggleBooking2Checkbox.click();
    });

    const orderButton = screen.getByTestId("order-button-1")

    act(() => {
      orderButton.click();
    });

    expect(websocket.send).toBeCalled()
  });

  it("ChangeSorting", () => {
    const newProps = {...props}


    newProps.booking = [
      new Booking(1, BookingStatus.Initial, 2, 1, "B", "10:00:00"),
      new Booking(2, BookingStatus.Initial, 1, 1, "A", "11:00:00")
    ];

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <FutureBooking {...newProps}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(
      screen.getByTestId('booking-row-B').compareDocumentPosition(screen
        .getByTestId('booking-row-A'))).toEqual(
          Node.DOCUMENT_POSITION_FOLLOWING
        );

    act(() => {
      screen.getByText('Accession').click()
    })

    expect(
      screen.getByTestId('booking-row-B').compareDocumentPosition(screen
        .getByTestId('booking-row-A'))).toEqual(
          Node.DOCUMENT_POSITION_FOLLOWING
        );

  });
});