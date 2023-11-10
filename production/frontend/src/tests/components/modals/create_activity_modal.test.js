/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { jest } from '@jest/globals'

import { CreateOrderModal } from '~/components/modals/create_activity_modal.js'
import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_ON_CLOSE , PROP_TIME_SLOT_MAPPING
  } from "~/lib/constants.js";
import { DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_MODEL_CREATE } from "~/lib/shared_constants"

import { AppState, testState } from '~/tests/app_state.js'
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { TimeSlotMapping } from "~/lib/data_structures.js";
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

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
    )
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

    render(<StateContextProvider value={testState}>
             <WebsocketContextProvider value={websocket}>
               <CreateOrderModal {...props} />
             </WebsocketContextProvider>
           </StateContextProvider>);


    expect(await screen.findByLabelText('customer-select')).toBeVisible();
    expect(await screen.findByLabelText('endpoint-select')).toBeVisible();
    expect(await screen.findByLabelText("time-slot-select")).toBeVisible();
    expect(await screen.findByLabelText('activity-input')).toBeVisible();
    expect(await screen.findByLabelText('customer-select')).toBeVisible();
  });


  it.skip("Change Delivery Time", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateOrderModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlotSelect = screen.getByLabelText("time-slot-select");
    const targetTimeSlot = testState.deliver_times.get(2);
    act(() => {
      fireEvent.change(timeSlotSelect, {target: {value : targetTimeSlot.id}})
    })

    expect(screen.getByText(targetTimeSlot.delivery_time)).toBeVisible();
  });

  it("Order Default", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateOrderModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const activityInput = await screen.findByLabelText('activity-input')
    const orderButton = await screen.findByRole('button', {name : "Opret Ordre"})

    act(() => {
      fireEvent.change(activityInput, {target : { value : "300"}})
      fireEvent.click(orderButton);
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER, expect.objectContaining({
      activity : 300
    }));
  });

  it("Change to endpoint-less Customer", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateOrderModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);


    const customerSelect = await screen.findByLabelText('customer-select');

    act(() => {
      fireEvent.change(customerSelect, {target : {value : 2}})
    })
  })


});