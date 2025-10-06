/**
 * @jest-environment jsdom
 */

import React from "react";
import { cleanup,  render, screen } from "@testing-library/react";
import { jest } from '@jest/globals'
import { bookings } from "~/tests/test_state/bookings";
import { PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE } from "~/lib/constants";
import { BookingOverview } from "~/components/shop_pages/booking_overview";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { testState } from "~/tests/app_state";
import { locations } from "~/tests/test_state/locations";
import { compareDates } from "~/lib/utils";

const module = jest.mock('../../../lib/tracer_websocket');
const websocket_module = require("../../../lib/tracer_websocket");

let websocket = null;
let props = null;

const activeEndpoint = 1;
const now = new Date(2020,4, 4, 10, 36, 44);

beforeEach(async () => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  delete window.location;
  window.location = { href : "tracershop"};
  websocket = websocket_module.TracerWebSocket;
  props = {
    [PROP_ACTIVE_DATE] : now,
    [PROP_ACTIVE_ENDPOINT] : activeEndpoint,
    [PROP_EXPIRED_ACTIVITY_DEADLINE] : false,
    [PROP_EXPIRED_INJECTION_DEADLINE] : false,
    booking : [...bookings.values()],
  };
});

afterEach(() => {
  cleanup();
  module.clearAllMocks();
  window.localStorage.clear();
  websocket = null;
  props = null;
});

describe("Booking Overview test suite", () => {
  it("Standard Render tests", () => {
    render(<TracerShopContext tracershop_state={testState}>
        <BookingOverview {...props}/>
    </TracerShopContext>);

    for(const location of locations.values()){
      if(location.endpoint == activeEndpoint){
        if(location.common_name){
          expect(screen.getByText(location.common_name)).toBeVisible();
        } else {
          expect(screen.getByText(location.location_code)).toBeVisible();
        }
      } else {
        if(location.common_name){
          expect(screen.queryByText(location.common_name)).toBeNull();
        } else {
          expect(screen.queryByText(location.location_code)).toBeNull();
        }
      }
    }

    for(const booking of bookings.values()){
      if(compareDates(now, new Date(booking.start_date))){

      }
    }
  });
});
