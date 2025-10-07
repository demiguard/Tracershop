/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { expect, jest } from '@jest/globals'

import { buildBookingMap, CreateOrderModal } from '~/components/modals/create_activity_modal'
import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_ON_CLOSE , PROP_TIME_SLOT_MAPPING, WEEKLY_REPEAT_CHOICES
  } from "~/lib/constants";
import { BookingStatus, DATA_ACTIVITY_ORDER, DATA_DELIVER_TIME, DATA_ENDPOINT } from "~/lib/shared_constants"

import { getModifiedTestState, testState } from '~/tests/app_state'
import { TracerShopContext, } from "~/contexts/tracer_shop_context";
import { TimeSlotMapping } from "~/lib/data_structures";
import { toMapping } from "~/lib/utils";
import { ActivityDeliveryTimeSlot, Booking, DeliveryEndpoint } from "~/dataclasses/dataclasses";
import { dateToDateString } from "~/lib/formatting";
const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");

const onClose = jest.fn()


let websocket = null;
let container = null;
let props = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
  props = {
    [PROP_ACTIVE_TRACER] : 1,
    [PROP_ACTIVE_DATE] : new Date(2020,3,5),
    [PROP_ON_CLOSE] : onClose,
    [PROP_TIME_SLOT_MAPPING] : new TimeSlotMapping(
      testState.delivery_endpoint, testState.deliver_times, [1,2]
    ),
  };
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});



describe("create activity modal", () => {
  it("standard render test", async () => {
    await act( async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateOrderModal {...props} />
        </TracerShopContext>
      );
    })

    expect(screen.getByLabelText('customer-select')).toBeVisible();
    expect(screen.getByLabelText('endpoint-select')).toBeVisible();
    expect(screen.getByLabelText("time-slot-select")).toBeVisible();
    expect(screen.getByLabelText('activity-input')).toBeVisible();
    expect(screen.getByLabelText('customer-select')).toBeVisible();
  });


  it("Change Delivery Time", async () => {
    await act(async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateOrderModal {...props} />
        </TracerShopContext>
      );
    })

    const timeSlotSelect = screen.getByLabelText("time-slot-select");
    const targetTimeSlot = testState.deliver_times.get(2);
    act(() => {
      fireEvent.change(timeSlotSelect, {target: {value : targetTimeSlot.id}})
    })

    expect(screen.getByText(targetTimeSlot.delivery_time)).toBeVisible();
  });

  it("Order Default", async () => {
    await act(async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateOrderModal {...props} />
        </TracerShopContext>
      );
    });

    const activityInput = screen.getByLabelText('activity-input');
    const orderButton = screen.getByRole('button', {name : "Opret Ordre"});

    act(() => {
      fireEvent.change(activityInput, {target : { value : "300"}});
      fireEvent.click(orderButton);
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER,
      expect.objectContaining({ordered_activity : 300 }));
  });

  it("Change to endpoint-less Customer", async () => {
    await act(async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateOrderModal {...props} />
        </TracerShopContext>
      );
    })

    const customerSelect = screen.getByLabelText('customer-select');

    await act(async () => {
      fireEvent.change(customerSelect, {target : {value : 2}});
    });
  });

  const DESTINATION_ID = 1;
  const TIME_SLOT_ID_1 = 2;
  const TIME_SLOT_ID_2 = 3;
  const TIME_SLOT_ID_3 = 4;
  const PRODUCTION_ID  = 5;
  const DATE_STRING = dateToDateString(testState.today);
  function getBookingMapTestProps(){
    const timeSlots = toMapping([
      new ActivityDeliveryTimeSlot(TIME_SLOT_ID_1, WEEKLY_REPEAT_CHOICES.ALL, "08:00:00", DESTINATION_ID, PRODUCTION_ID, null),
      new ActivityDeliveryTimeSlot(TIME_SLOT_ID_2, WEEKLY_REPEAT_CHOICES.ALL, "12:00:00", DESTINATION_ID, PRODUCTION_ID, null),
      new ActivityDeliveryTimeSlot(TIME_SLOT_ID_3, WEEKLY_REPEAT_CHOICES.ALL, "16:00:00", DESTINATION_ID, PRODUCTION_ID, null),
    ]);

    const deliveryEndpoint = toMapping([
      new DeliveryEndpoint(DESTINATION_ID, "asdf", "asdf", "asdf", "asdf", "asdf", 1),
    ]);

    const relevantProduction = [PRODUCTION_ID];

    const timeSlotMapping = new TimeSlotMapping(
      deliveryEndpoint,
      timeSlots,
      relevantProduction
    );

    const modState = getModifiedTestState({
      [DATA_DELIVER_TIME] : timeSlots,
      [DATA_ENDPOINT] : deliveryEndpoint
    })

    return [timeSlotMapping, deliveryEndpoint, modState]
  }

  it("Building an empty booking map", () => {
    const bookings = [];

    // State modification
    const [timeSlotMapping, deliveryEndpoints, modState] = getBookingMapTestProps();

    const bookingMap = buildBookingMap(timeSlotMapping, deliveryEndpoints.get(1), bookings, modState);
    expect(bookingMap.size).toBe(0);
  });

  it("Building an booking map", () => {
    const bookings = [
      new Booking(1, BookingStatus.Initial, 1, 1, "TEST_NUMBER_1", "10:00:00", DATE_STRING),
      new Booking(2, BookingStatus.Initial, 1, 1, "TEST_NUMBER_1", "11:00:00", DATE_STRING),
      new Booking(3, BookingStatus.Initial, 1, 1, "TEST_NUMBER_2", "13:00:00", DATE_STRING),
      new Booking(4, BookingStatus.Initial, 1, 1, "TEST_NUMBER_2", "18:00:00", DATE_STRING),
    ];

    // State modification
    const [timeSlotMapping, deliveryEndpoints, modState] = getBookingMapTestProps();
    const bookingMap = buildBookingMap(timeSlotMapping, deliveryEndpoints.get(1), bookings, modState);

    expect(bookingMap.size).toBe(3);

    expect(bookingMap.get(TIME_SLOT_ID_1).length).toBe(2)
    expect(bookingMap.get(TIME_SLOT_ID_2).length).toBe(1)
    expect(bookingMap.get(TIME_SLOT_ID_3).length).toBe(1)
  });
});