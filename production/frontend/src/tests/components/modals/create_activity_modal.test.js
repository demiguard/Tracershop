/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { jest } from '@jest/globals'

import { CreateOrderModal } from '~/components/modals/create_activity_modal.js'
import { PROP_ACTIVE_DATE, PROP_ON_CLOSE , PROP_TIME_SLOT_MAPPING
  } from "~/lib/constants.js";
import { DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_MODEL_CREATE } from "~/lib/shared_constants"

import { AppState } from '~/tests/app_state.js'
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { TracerWebSocket } from "~/lib/tracer_websocket";
jest.mock("../../../lib/tracer_websocket")

const onClose = jest.fn()


let websocket = null;
let container = null;
let props = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new TracerWebSocket();
  props = {...AppState}
  props[PROP_ACTIVE_DATE] = new Date(2020,3,5);
  props[PROP_ON_CLOSE] = onClose

  props[PROP_TIME_SLOT_MAPPING] = new Map([
    [1, new Map([
      [1 , [AppState[DATA_DELIVER_TIME].get(1), AppState[DATA_DELIVER_TIME].get(2)]],
      [2,  []],
    ])],
    [2, new Map()]
  ]);
});


afterEach(() => {
  cleanup();

  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});



describe("create activity modal", () => {
  it("standard render test", async () => {

    render(<WebsocketContextProvider value={websocket}>
      <CreateOrderModal {...props} />
    </WebsocketContextProvider>);

    expect(await screen.findByLabelText('customer-select')).toBeVisible();
    expect(await screen.findByLabelText('endpoint-select')).toBeVisible();
    expect(await screen.findByLabelText("time-slot-select")).toBeVisible();
    expect(await screen.findByLabelText('activity-input')).toBeVisible();
    expect(await screen.findByLabelText('customer-select')).toBeVisible();
  });


  it.skip("Change Delivery Time", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <CreateOrderModal {...props} />
    </WebsocketContextProvider>);

    const timeSlotSelect = await screen.findByLabelText("time-slot-select");
    const targetTimeSlot = props[DATA_DELIVER_TIME].get(2);
    act(() => {
      fireEvent.change(timeSlotSelect, {target: {value : targetTimeSlot.id}})
    })

    expect(await screen.findByText(targetTimeSlot.delivery_time)).toBeVisible();
  });

  it.skip("Order Default", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <CreateOrderModal {...props} />
    </WebsocketContextProvider>);

    const activityInput = await screen.findByLabelText('activity-input')
    const orderButton = await screen.findByRole('button', {name : "Opret Ordre"})

    act(() => {
      fireEvent.change(activityInput, {target : { value : 300}})
      fireEvent.click(orderButton);
    });

    expect(websocket.send).toBeCalled()
    expect(websocket.getMessage).toHaveBeenCalledWith(WEBSOCKET_MESSAGE_MODEL_CREATE);
  });

  it.skip("Change to endpoint-less Customer", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <CreateOrderModal {...props} />
    </WebsocketContextProvider>);
    const customerSelect = await screen.findByLabelText('customer-select');

    act(() => {
      fireEvent.change(customerSelect, {target : {value : 2}})
    })
  })


});