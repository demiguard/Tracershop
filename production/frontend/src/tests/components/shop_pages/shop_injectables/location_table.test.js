/**
 * @jest-environment jsdom
 */


import React from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals';
import { testState } from "~/tests/app_state.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";

import { LocationTable } from "~/components/shop_pages/shop_injectables/location_table.js";
const module = jest.mock('../../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../../lib/tracer_websocket.js");

let websocket = null;

const now = new Date(2020,4, 4, 10, 36, 44);

beforeEach(async () => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  websocket = tracer_websocket.TracerWebSocket;
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  websocket = null;
});

describe("Injection order card test suite", () => {
  it("Standard Render Test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <LocationTable/>
      </TracerShopContext>
    );
  });

  it("Filter to location Code 20", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <LocationTable/>
      </TracerShopContext>
    );

    const filterInput = screen.getByLabelText('filter');

    act(() => {
      fireEvent.change(filterInput, {target : {value : "ROOM_CODE_20"}});
    })

    // expect one 1

  });

  it("Filter to location Code 20", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <LocationTable/>
      </TracerShopContext>
    );

    const filterInput = screen.getByLabelText('location-common-name-1');

    act(() => {
      fireEvent.change(filterInput, {target : {value : "ROOM FIX"}});
    })

    // expect one 1

  });

  it("Filter to location Code 20", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <LocationTable/>
      </TracerShopContext>
    );
    const filterInput = screen.getByLabelText('filter');

    act(() => {
      fireEvent.change(filterInput, {target : {value : "2"}});
    })

    // expect one 1

  });
})