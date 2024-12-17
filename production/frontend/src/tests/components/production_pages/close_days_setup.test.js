/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, render, screen, cleanup } from "@testing-library/react"

import { testState } from "../../app_state.js";

import { CloseDaysPage } from "../../../components/production_pages/setup_pages/close_days_page.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = null;
let container = null;


beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    container = document.createElement("div");
    websocket = tracer_websocket.TracerWebSocket

});

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
});


describe("Close Days Setup test", () => {
  it("Standard Render test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CloseDaysPage/>
      </TracerShopContext>
    );

    expect(screen.getByLabelText('calender-day-1')).toBeVisible()
    expect(screen.getByLabelText('calender-day-2')).toBeVisible()
    expect(screen.getByLabelText('calender-day-3')).toBeVisible()
    expect(screen.getByLabelText('calender-day-4')).toBeVisible()
    expect(screen.getByLabelText('calender-day-5')).toBeVisible()
    expect(screen.getByLabelText('calender-day-6')).toBeVisible()
    expect(screen.getByLabelText('calender-day-7')).toBeVisible()
    expect(screen.getByLabelText('calender-day-13')).toBeVisible()
  });

  it("Create close date", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CloseDaysPage/>
      </TracerShopContext>
    );

    await act(async () => {
      screen.getByLabelText('calender-day-12').click();
    });

    expect(websocket.sendCreateModel).toHaveBeenCalled();
  })

  it("Delete close date", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CloseDaysPage/>
      </TracerShopContext>
    );

    await act(async () => {
      // Note that from src/tests/test_state/close_dates
      screen.getByLabelText('calender-day-13').click();
    });

    expect(websocket.sendDeleteModel).toHaveBeenCalled();
  })

})