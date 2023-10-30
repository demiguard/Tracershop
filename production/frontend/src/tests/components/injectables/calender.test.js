/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


import { Calender } from '../../../components/injectable/calender.js'
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK } from "../../../lib/constants.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js";
import { ProductionBitChain } from "~/lib/data_structures.js";
import { testState } from "~/tests/app_state.js";

let websocket = null

beforeEach(() => {
  websocket = tracer_websocket.TracerWebSocket
});

afterEach(() => {
  cleanup()
  module.clearAllMocks()
});

const calenderBitChain = new ProductionBitChain(testState.production);

const date = new Date(2012,5,26,11,26,45);
const getColor = jest.fn(() => {return ["#ffffff, #000"]});
const onDayClick = jest.fn((str) => {return str});


const calender_props = {
  [CALENDER_PROP_DATE] : date,
  [CALENDER_PROP_GET_COLOR] : getColor,
  [CALENDER_PROP_ON_DAY_CLICK] : onDayClick,
  filter_activity_orders : () => true,
  filter_injection_orders : () => true,
  bit_chain : calenderBitChain,
};



describe("Calender render Tests", () => {
  it("Standard RenderTest", () => {


    render( <StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <Calender {...calender_props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.getByText("June")).toBeVisible();
    expect(screen.getByText("Man")).toBeVisible();
    expect(screen.getByText("Tir")).toBeVisible();
    expect(screen.getByText("Ons")).toBeVisible();
    expect(screen.getByText("Tor")).toBeVisible();
    expect(screen.getByText("Fre")).toBeVisible();
    expect(screen.getByText("Lør")).toBeVisible();
    expect(screen.getByText("Søn")).toBeVisible();

  });

  it("Click on 15 of june", async () => {
    render( <StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <Calender {...calender_props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    fireEvent(await screen.findByText("15"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    expect(onDayClick).toHaveBeenCalledWith(new Date(2012,5,15,12,0,0))

  });

  it("Increase Month", async () => {
    render( <StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <Calender {...calender_props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    fireEvent(await screen.findByAltText("Næste"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    expect(websocket.getMessage).toBeCalledWith(WEBSOCKET_MESSAGE_GET_ORDERS);
    expect(websocket.send).toBeCalledWith(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_GET_ORDERS,
      [WEBSOCKET_DATE] : new Date(2012,6,1,12,0,0),
    }));
  });

  it("Decrease Month", async () => {
    render( <StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <Calender {...calender_props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    fireEvent(await screen.findByAltText("Sidste"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    expect(websocket.getMessage).toBeCalledWith(WEBSOCKET_MESSAGE_GET_ORDERS);
    expect(websocket.send).toBeCalledWith(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_GET_ORDERS,
      [WEBSOCKET_DATE] : new Date(2012,4,1,12,0,0),
    }));
  });
});




