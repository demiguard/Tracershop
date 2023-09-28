/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CreateOrderModal } from '../../../components/modals/create_activity_modal.js'
import { JSON_CUSTOMER, JSON_DELIVER_TIME, JSON_ISOTOPE, JSON_PRODUCTION, JSON_TRACER, PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_ORDER_MAPPING, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_MESSAGE_MODEL_CREATE } from "../../../lib/constants.js";
import { AppState} from '../../app_state.js'
import { act } from "react-dom/test-utils";


const onClose = jest.fn()
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket
  props[PROP_ACTIVE_DATE] = new Date(2020,3,5);
  props[PROP_ON_CLOSE] = onClose

  props[PROP_TIME_SLOT_MAPPING] = new Map([
    [1, new Map([
      [1 , [AppState[JSON_DELIVER_TIME].get(1), AppState[JSON_DELIVER_TIME].get(2)]],
      [2,  []],
    ])],
    [2, new Map()]
  ]);
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
    render(<CreateOrderModal
      {...props}
    />, container);

    expect(await screen.findByLabelText('customer-select')).toBeVisible();
    expect(await screen.findByLabelText('endpoint-select')).toBeVisible();
    expect(await screen.findByLabelText("time-slot-select")).toBeVisible();
    expect(await screen.findByLabelText('activity-input')).toBeVisible();
    expect(await screen.findByLabelText('customer-select')).toBeVisible();
  });


  it.skip("Change Delivery Time", async () => {
    render(<CreateOrderModal
      {...props}
    />, container);

    const timeSlotSelect = await screen.findByLabelText("time-slot-select");
    const targetTimeSlot = props[JSON_DELIVER_TIME].get(2);
    act(() => {
      fireEvent.change(timeSlotSelect, {target: {value : targetTimeSlot.id}})
    })

    expect(await screen.findByText(targetTimeSlot.delivery_time)).toBeVisible();
  });

  it("Order Default", async () => {
    render(<CreateOrderModal
      {...props}
    />, container);

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
    render(<CreateOrderModal
      {...props}
    />, container);
    const customerSelect = await screen.findByLabelText('customer-select');

    act(() => {
      fireEvent.change(customerSelect, {target : {value : 2}})
    })
  })


});