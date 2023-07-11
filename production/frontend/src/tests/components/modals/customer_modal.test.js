/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState } from '../../helpers.js';
import { CustomerModal } from '../../../components/modals/customer_modal.js'
import { JSON_DELIVER_TIME, PROP_ACTIVE_CUSTOMER, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";

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
  props[PROP_WEBSOCKET] = websocket
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
    render(<CustomerModal {...props} />, container);
  })

  it("Customer 2 Modal Render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 2
    render(<CustomerModal {...props} />, container);
  })

  it("Customer 3 Modal Render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 3
    render(<CustomerModal {...props} />, container);
  })

  it("Customer no endpoint render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 4
    render(<CustomerModal {...props} />, container);
  })

  it("Customer 1, click on time slot 2", async () => {
    render(<CustomerModal {...props} />, container);

    const timeSlot2 = await screen.findByLabelText('time-slot-2')
    const timeSlotForm = await screen.findByLabelText('time-slot-delivery-time')
    const weeklySelect = await screen.findByLabelText('weekly-select')
    const productionSelect = await screen.findByLabelText('production-select')

    act(() => {
      fireEvent.click(timeSlot2);
    })

    const /**@type {ActivityDeliveryTimeSlot} */ targetTimeSlot = props[JSON_DELIVER_TIME].get(2)

    expect(timeSlotForm.value).toEqual(targetTimeSlot.delivery_time);
    expect(Number(weeklySelect.value)).toEqual(targetTimeSlot.weekly_repeat);
    expect(Number(productionSelect.value)).toEqual(targetTimeSlot.production_run)
  })

  it("Customer 1, change time slot", async () => {
    render(<CustomerModal {...props} />, container);

    const timeSlot2 = await screen.findByLabelText('time-slot-2');
    const timeSlotForm = await screen.findByLabelText('time-slot-delivery-time');
    const weeklySelect = await screen.findByLabelText('weekly-select');
    const productionSelect = await screen.findByLabelText('production-select');

    act(() => {
      fireEvent.click(timeSlot2);
    })

    const /**@type {ActivityDeliveryTimeSlot} */ targetTimeSlot = props[JSON_DELIVER_TIME].get(2)

    expect(timeSlotForm.value).toEqual(targetTimeSlot.delivery_time);
    expect(Number(weeklySelect.value)).toEqual(targetTimeSlot.weekly_repeat);
    expect(Number(productionSelect.value)).toEqual(targetTimeSlot.production_run)
  })

  it("Customer 1, change time slot 2 - delivery time", async () => {
    render(<CustomerModal {...props} />, container);

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

  it("Customer 1, edit time slot 2 - delivery time", async () => {
    render(<CustomerModal {...props} />, container);

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