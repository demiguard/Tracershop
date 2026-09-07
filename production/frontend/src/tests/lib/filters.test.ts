import { describe, expect, it, jest } from '@jest/globals'
import '~/tests/jest_extension'

import { BookingFilterArgs } from '~/lib/filters';
import { Booking, Location, TracershopState, ClosedDate, DeliveryEndpoint, Customer, Tracer, ActivityProduction, ActivityDeliveryTimeSlot, BookingRule } from "~/dataclasses/dataclasses";
import { DAYS } from "~/lib/constants";
import { bookingFilter, extractData, timeSlotFilter } from "~/lib/filters";
import { DATA_CLOSED_DATE, BookingStatus } from "~/lib/shared_constants";
import { toMapping } from "~/lib/utils";

jest.useFakeTimers({
  now : new Date("2026-05-01T11:33:44Z")
})

const locations = new Map([
  [1, new Location(1, "code_1", 1, "blah 1")],
  [2, new Location(2, "code_1", 2, "blah 1")],
])

describe("Filter test suites", () => {
  it("Container Extraction Closed dates, from state", () => {
    const closedDates = [new ClosedDate(1, "2024-01-02")]

    const testState = new TracershopState(
      undefined, // Logged in user
      undefined, // today
      undefined, // Address
      undefined, // Activity Orders
      undefined,
      toMapping(closedDates), // closedDates
    );

    const returnArray = extractData(testState, ClosedDate, DATA_CLOSED_DATE);

    expect(returnArray).toHaveLength(1);
    expect(returnArray[0]).toBe(closedDates[0]);
  });

  it("Container Extraction Closed dates, from Type", () => {
    const closedDate = new ClosedDate(1, "2024-01-02");
    const returnArray = extractData(closedDate, ClosedDate, DATA_CLOSED_DATE);

    expect(returnArray).toHaveLength(1);
    expect(returnArray[0]).toBe(closedDate);
  });

  it("Booking Date filter", () => {
    const bookings = [
      new Booking( 1,  1,  1,  1, "asdf", "10:30:00", "2020-05-04"),
      new Booking( 2,  1,  1,  1, "asdf", "10:30:00", "2020-11-04"),
      new Booking( 3,  1,  2,  1, "asdf", "10:30:00", "2020-05-04"),
    ];

    const res = bookingFilter(bookings, { active_date : new Date("2020-05-04")});

    expect(res.length).toBe(2);
    expect(res[0]).toBe(bookings[0]);
    expect(res[1]).toBe(bookings[2]);
  });

  it("Time Slot filter",() => {
    const state = new TracershopState()
    state.customer = toMapping([new Customer(1)])
    state.delivery_endpoint = toMapping([
      new DeliveryEndpoint(1, "add", "city", "zip", "phone", "Endpoint 1", 1),
      new DeliveryEndpoint(2, "add", "city", "zip", "phone", "Endpoint 1", 1),
      new DeliveryEndpoint(3, "add", "city", "zip", "phone", "Endpoint 1", 1)
    ])

    state.tracer = toMapping([new Tracer(1), new Tracer(2)])
    state.production = toMapping([
      new ActivityProduction(1, DAYS.MONDAY, 1),
      new ActivityProduction(2, DAYS.THURSDAY, 1),
      new ActivityProduction(3, DAYS.WENDSDAY, 1),
      new ActivityProduction(4, DAYS.MONDAY, 2),
      new ActivityProduction(5, DAYS.THURSDAY, 2),
      new ActivityProduction(6, DAYS.WENDSDAY, 2),
    ])

    const timeSlots = [
      new ActivityDeliveryTimeSlot(1, undefined, undefined, 1, 1, null),
      new ActivityDeliveryTimeSlot(2, undefined, undefined, 2, 1, null),
      new ActivityDeliveryTimeSlot(3, undefined, undefined, 3, 1, null),
      new ActivityDeliveryTimeSlot(4, undefined, undefined, 1, 2, null),
      new ActivityDeliveryTimeSlot(5, undefined, undefined, 2, 3, null),
      new ActivityDeliveryTimeSlot(6, undefined, undefined, 3, 4, null),
    ]

    const filtered_timeSlots = timeSlotFilter(
      timeSlots,
      { state : state, tracerID : 1, endpointID : 2 }, true
    )

    expect(filtered_timeSlots).toEqual([2,5]);
  })

  it("Booking filter", () => {
    /* Tests that the filter for bookings takes "booking rules" into account
    when filtering for delivery endpoint. A booking rule is a mapping for child
    bookings


    In this test the following fields are considered irrelevant, because we don't test it here:
      * Booking.bookingStatus
      * Booking.procedure
      * Booking.accession_number
      * Booking.start_time
      * Booking.start_date
      * Location.location_code
    */
    const is = null; // this means irrelevant_status
    const ip = null; // This means irrelevant_procedure
    const ia = null; // this means irrelevant_accession_number
    const it = null; // this means irrelevant_time
    const id = null; // this means irrelevant_date
    const ilc = null // this means irrelevant_location_code

    const queryingEndpointID = 1;
    const notQueryingEndpointID = 2;

    const state = new TracershopState();
    state.delivery_endpoint = new Map([
      [queryingEndpointID, new DeliveryEndpoint(queryingEndpointID)],
      [notQueryingEndpointID, new DeliveryEndpoint(notQueryingEndpointID)]
    ]);

    const owningLocationID = 1;
    const notOwningLocationID = 2;

    // Inclusive in that children from this location will contribute to the
    const bookingRuleInclusiveLocationID = 3;
    const bookingRuleExclusiveLocationID = 4;

    state.location = new Map([
      [owningLocationID, new Location(owningLocationID, ilc, queryingEndpointID)],
      [notOwningLocationID, new Location(notOwningLocationID, ilc, notQueryingEndpointID)],
      [bookingRuleInclusiveLocationID, new Location(bookingRuleInclusiveLocationID, ilc, notQueryingEndpointID)],
      [bookingRuleExclusiveLocationID, new Location(bookingRuleExclusiveLocationID, ilc, queryingEndpointID)]
    ]);

    state.booking_rule = new Map([
      [1, new BookingRule(1, bookingRuleInclusiveLocationID, queryingEndpointID)],
      [2, new BookingRule(2, bookingRuleExclusiveLocationID, notQueryingEndpointID)]
    ])

    // Small note - Booking CANNOT have procedure = null, but in this this shouldn't matter therefore it's have been nulled out

    const booking_null_age_l1 = new Booking(1, is, owningLocationID, ip, ia, it, id, null);
    const booking_null_age_l2 = new Booking(2, is, notOwningLocationID, null, "ID: 1", "11:00:00", "2025-01-01", null);
    const booking_null_age_l3 = new Booking(3, is, bookingRuleInclusiveLocationID, ip, ia, it, id, null);
    const booking_null_age_l4 = new Booking(4, is, bookingRuleExclusiveLocationID, null, "ID: 1", "11:00:00", "2025-01-01", null);
    const booking_grown_up_l1 = new Booking(5, is, owningLocationID, ip, ia, it, id, "1990-01-01");
    const booking_grown_up_l2 = new Booking(6, is, notOwningLocationID, null, "ID: 1", "11:00:00", "2025-01-01", "1990-01-01");
    const booking_grown_up_l3 = new Booking(7, is, bookingRuleInclusiveLocationID, ip, ia, it, id, "1990-01-01");
    const booking_grown_up_l4 = new Booking(8, is, bookingRuleExclusiveLocationID, null, "ID: 1", "11:00:00", "2025-01-01", "1990-01-01");
    const booking_child_l1 = new Booking(9, is,  owningLocationID, ip, ia, it, id, "2015-01-01");
    const booking_child_l2 = new Booking(10, is, notOwningLocationID, null, "ID: 1", "11:00:00", "2025-01-01", "2015-01-01");
    const booking_child_l3 = new Booking(11, is, bookingRuleInclusiveLocationID, ip, ia, it, id, "2015-01-01");
    const booking_child_l4 = new Booking(12, is, bookingRuleExclusiveLocationID, null, "ID: 1", "11:00:00", "2025-01-01", "2015-01-01");

    const bookings = [
      booking_null_age_l1,
      booking_null_age_l2,
      booking_null_age_l3,
      booking_null_age_l4,
      booking_grown_up_l1,
      booking_grown_up_l2,
      booking_grown_up_l3,
      booking_grown_up_l4,
      booking_child_l1,
      booking_child_l2,
      booking_child_l3,
      booking_child_l4,
    ]

    const filterArgs = {
      state : state,
      active_endpoint : queryingEndpointID
    }

    // TEST
    const result = bookingFilter(bookings, filterArgs);

    // ASSERT
    expect(result).toInclude(booking_null_age_l1);
    expect(result).not.toInclude(booking_null_age_l2);
    expect(result).not.toInclude(booking_null_age_l3);
    expect(result).toInclude(booking_null_age_l4);
    // Grown up mirrors - null
    expect(result).toInclude(booking_grown_up_l1);
    expect(result).not.toInclude(booking_grown_up_l2);
    expect(result).not.toInclude(booking_grown_up_l3);
    expect(result).toInclude(booking_grown_up_l4);
    // Children er different
    expect(result).toInclude(booking_child_l1);
    expect(result).not.toInclude(booking_child_l2);
    expect(result).toInclude(booking_child_l3);
    expect(result).not.toInclude(booking_child_l4);



  });
})
