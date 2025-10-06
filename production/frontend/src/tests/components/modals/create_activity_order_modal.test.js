/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CreateOrderModal } from '~/components/modals/create_activity_modal'
import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_ON_CLOSE , PROP_TIME_SLOT_MAPPING
  } from "~/lib/constants";
import { DATA_ACTIVITY_ORDER } from "~/lib/shared_constants"

import { testState } from '~/tests/app_state'
import { TracerShopContext, } from "~/contexts/tracer_shop_context";
import { TimeSlotMapping } from "~/lib/data_structures";
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
  it("standard render test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateOrderModal {...props} />
      </TracerShopContext>
    );

    expect(screen.getByLabelText('customer-select')).toBeVisible();
    expect(screen.getByLabelText('endpoint-select')).toBeVisible();
    expect(screen.getByLabelText("time-slot-select")).toBeVisible();
    expect(screen.getByLabelText('activity-input')).toBeVisible();
    expect(screen.getByLabelText('customer-select')).toBeVisible();
  });


  it.skip("Change Delivery Time", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateOrderModal {...props} />
      </TracerShopContext>
    );

    const timeSlotSelect = screen.getByLabelText("time-slot-select");
    const targetTimeSlot = testState.deliver_times.get(2);
    act(() => {
      fireEvent.change(timeSlotSelect, {target: {value : targetTimeSlot.id}})
    })

    expect(screen.getByText(targetTimeSlot.delivery_time)).toBeVisible();
  });

  it("Order Default", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateOrderModal {...props} />
      </TracerShopContext>
    );

    const activityInput = screen.getByLabelText('activity-input');
    const orderButton = screen.getByRole('button', {name : "Opret Ordre"});

    act(() => {
      fireEvent.change(activityInput, {target : { value : "300"}});
      fireEvent.click(orderButton);
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER,
      expect.objectContaining({ordered_activity : 300 }));
  });

  it("Change to endpoint-less Customer", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateOrderModal {...props} />
      </TracerShopContext>
    );

    const customerSelect = screen.getByLabelText('customer-select');

    act(() => {
      fireEvent.change(customerSelect, {target : {value : 2}});
    })
  });



});