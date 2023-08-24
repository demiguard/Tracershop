/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ShopSetup } from '../../../components/shop_pages/shop_setup'
import { DATABASE_TODAY, JSON_ACTIVITY_ORDER, JSON_ENDPOINT, JSON_VIAL, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_ACTIVE_TRACER, PROP_ORDER_MAPPING, PROP_OVERHEAD_MAP, PROP_TIME_SLOT_ID, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_GET_ORDERS } from "../../../lib/constants.js";
import { AppState } from "../../app_state.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

jest.mock('../../../components/shop_pages/shop_injectables/location_table', () =>
  ({LocationTable : () => <div>LocationTableMock</div>}))

jest.mock('../../../components/shop_pages/shop_injectables/procedure_table', () =>
  ({ProcedureTable : () => <div>ProcedureTableMock</div>}))



let websocket = null;
let container = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44)

beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});

describe("Shop Setup test suite",() => {
  it("Standard render test", async () => {

    render(<ShopSetup {...props}/>)
    expect(await screen.findByLabelText('setup-Lokationer')).toBeVisible()
    expect(await screen.findByLabelText('setup-Procedure')).toBeVisible()
    expect(await screen.findByLabelText('endpoint-select')).toBeVisible()
  })

  it("Switch to production", async () => {
    render(<ShopSetup {...props}/>)
    await act(async () => {
      const switchButton = await screen.findByLabelText('setup-Procedure')
      switchButton.click();
    })
    expect(await screen.findByText("ProcedureTableMock")).toBeVisible()
  });

  it("Switch endpoint", async () => {
    render(<ShopSetup {...props}/>)
    await act(async () => {
      const endpointSelect = await screen.findByLabelText('endpoint-select')
      fireEvent.change(endpointSelect, {target : {value : 2}});
    })
    const activeEndpoint = props[JSON_ENDPOINT].get(2);
    expect(await screen.findByText(activeEndpoint.name)).toBeVisible()
  });

});