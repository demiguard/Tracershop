/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CustomerPage } from "../../../components/production_pages/customer_page.js"
import { JSON_CUSTOMER, PROP_ACTIVE_DATE, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";
import { AppState } from "../../app_state.js";
import { act } from "react-dom/test-utils";


const onClose = jest.fn()
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");
let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
    container = document.createElement("div");
    websocket = new tracer_websocket.TracerWebSocket()
    props = {...AppState};
    props[PROP_WEBSOCKET] = websocket;
    props[PROP_ACTIVE_DATE] = new Date(2020,4,4,10,26,33);
});

afterEach(() => {
  cleanup()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  props=null
});


describe("Customer page tests suite", () => {
  it("Standard Render Tests", async () => {
    render(<CustomerPage {...props} />)

    for(const customer of AppState[JSON_CUSTOMER].values()){
      expect(await screen.findByText(customer.short_name)).toBeVisible();
    }

  });

  it("Filter users", async () => {
    render(<CustomerPage {...props} />)

    await act(async () => {
      const form = await screen.findByLabelText('customer-filter')
      fireEvent.change(form, {target : {value : "Customer_3"}})
    })

    expect(screen.queryByText("Customer_1")).toBeNull();
    expect(await screen.findByText("Customer_3")).toBeVisible();
  });
  it("Open & close setting", async () => {
    render(<CustomerPage {...props} />)

    await act(async () => {
      const settingsIcon = await screen.findByLabelText('settings-3')
      settingsIcon.click()
    })
    //TODO: This doesn't quite work
    await act(async () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)
    })
  });
});