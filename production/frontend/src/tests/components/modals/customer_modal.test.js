/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";

import { jest } from '@jest/globals'
import { AppState } from '../../app_state.js';
import { CustomerModal } from '../../../components/modals/customer_modal.js'
import { PROP_ACTIVE_CUSTOMER } from "~/lib/constants.js";
import { DATA_DELIVER_TIME } from "~/lib/shared_constants.js"
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const onClose = jest.fn();

let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop" }
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_ACTIVE_CUSTOMER] = 1;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null
});

describe("Customer modal list", () => {
  it("Customer 1 Modal Render test", async () => {
    render(
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>);

  })

  it("Customer 2 Modal Render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 2
    render(<WebsocketContextProvider value={websocket}>
      <CustomerModal {...props} />
    </WebsocketContextProvider>);
  })

  it("Customer 3 Modal Render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 3
    render(<WebsocketContextProvider value={websocket}>
      <CustomerModal {...props} />
    </WebsocketContextProvider>);
  })

  it("Customer no endpoint render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 4
    render(<WebsocketContextProvider value={websocket}>
      <CustomerModal {...props} />
    </WebsocketContextProvider>);
  })

  it("Customer 1, click on time slot 2", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <CustomerModal {...props} />
    </WebsocketContextProvider>);

    const timeSlot2 = await screen.findByLabelText('time-slot-2')
    const timeSlotForm = await screen.findByLabelText('time-slot-delivery-time')
    const weeklySelect = await screen.findByLabelText('weekly-select')
    const productionSelect = await screen.findByLabelText('production-select')

    act(() => {
      fireEvent.click(timeSlot2);
    })

    const /**@type {ActivityDeliveryTimeSlot} */ targetTimeSlot = props[DATA_DELIVER_TIME].get(2)

    expect(timeSlotForm.value).toEqual(targetTimeSlot.delivery_time);
    expect(Number(weeklySelect.value)).toEqual(targetTimeSlot.weekly_repeat);
    expect(Number(productionSelect.value)).toEqual(targetTimeSlot.production_run)
  })

  it("Customer 1, change time slot", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <CustomerModal {...props} />
    </WebsocketContextProvider>);

    const timeSlot2 = await screen.findByLabelText('time-slot-2');
    const timeSlotForm = await screen.findByLabelText('time-slot-delivery-time');
    const weeklySelect = await screen.findByLabelText('weekly-select');
    const productionSelect = await screen.findByLabelText('production-select');

    act(() => {fireEvent.click(timeSlot2);});

    const /**@type {ActivityDeliveryTimeSlot} */ targetTimeSlot = props[DATA_DELIVER_TIME].get(2);

    expect(timeSlotForm.value).toEqual(targetTimeSlot.delivery_time);
    expect(Number(weeklySelect.value)).toEqual(targetTimeSlot.weekly_repeat);
    expect(Number(productionSelect.value)).toEqual(targetTimeSlot.production_run)
  })

  it.skip("Customer 1, change time slot 2 - delivery time", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <CustomerModal {...props} />
    </WebsocketContextProvider>);

    const timeSlot2 = await screen.findByLabelText('time-slot-2');
    const timeSlotForm = await screen.findByLabelText('time-slot-delivery-time');

    act(() => {
      fireEvent.click(timeSlot2);
      fireEvent.change(timeSlotForm, {target : {value : "14:30:00"}});
    })

    expect(timeSlotForm.value).toEqual("14:30:00");
    expect(await screen.findByLabelText("time-slot-edit")).toBeVisible()
    expect(screen.queryByLabelText("time-slot-create")).toBeNull()
  })

  it.skip("Customer 1, edit time slot 2 - delivery time", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <CustomerModal {...props} />
    </WebsocketContextProvider>);

    const timeSlot2 = await screen.findByLabelText('time-slot-2');
    const timeSlotForm = await screen.findByLabelText('time-slot-delivery-time');

    act(() => {
      fireEvent.click(timeSlot2);
      fireEvent.change(timeSlotForm, {target : {value : "14:30:00"}});
      const editButton = screen.queryByLabelText("time-slot-edit");
      fireEvent.click(editButton)
    })

    //expect(websocket.sendCreateModel).not.toBeCalled();
    //expect(websocket.sendEditModel).toBeCalled();
    //expect(await screen.queryByLabelText("time-slot-edit")).toBeNull()
  })

})