/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";

import { TracerShopContext } from "~/contexts/tracer_shop_context.js";
import { testState } from "~/tests/app_state";
import { ProductionSetup } from "~/components/production_pages/setup_pages/production_setup.js";
import { DATA_PRODUCTION } from "~/lib/shared_constants.js";
import { tracer_mapping } from "~/tests/test_state/tracer_mapping.js";


const module = jest.mock('../../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../../lib/tracer_websocket.js");

let websocket = null;

beforeAll(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44));
})

beforeEach(() => {
  websocket = tracer_websocket.TracerWebSocket;
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  module.clearAllMocks();
});


describe("Production Setup", () => {
  it("Standard Render Test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionSetup/>
      </TracerShopContext>
    );

    for(const production of testState.production.values()){
      if(production.tracer === 1){
        expect(screen.getByLabelText(`production-${production.id}`));
      }
    }

    expect(screen.getByLabelText('tracer-selector')).toBeVisible();
    expect(screen.getByLabelText('day-selector')).toBeVisible();
    expect(screen.getByLabelText('production-time')).toBeVisible();
    expect(screen.getByLabelText('commit-active-production')).toBeVisible();
  });

  it("Standard Render Test without Tracers", () => {
    const newState = {...testState, tracer : new Map(), tracer_mapping : new Map()}

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <ProductionSetup/>
      </TracerShopContext>
    );

    expect(screen.getByLabelText('tracer-selector')).toBeVisible();
    expect(screen.getByLabelText('day-selector')).toBeVisible();
    expect(screen.getByLabelText('production-time')).toBeVisible();
    expect(screen.getByLabelText('commit-active-production')).toBeVisible();
  });

  it("Click on a production", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionSetup/>
      </TracerShopContext>
    );

    const production_weekly = screen.getByLabelText('production-3');


    act(() => {
      production_weekly.click();
    });
  });

  it("Change Tracer", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionSetup/>
      </TracerShopContext>
    );

    const tracerSelector = screen.getByLabelText('tracer-selector');

    act(() => {
      fireEvent.change(tracerSelector, {target : {value : "3"}})
    });

    for(const production of testState.production.values()){
      if(production.tracer === 3){
        expect(screen.getByLabelText(`production-${production.id}`));
      }
    }
  });

  it("Add New Production", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionSetup/>
      </TracerShopContext>
    );


    const tracerSelector = screen.getByLabelText('tracer-selector');
    const daySelector = screen.getByLabelText('day-selector');
    const timeInput = screen.getByLabelText('production-time');

    act(() => {
      fireEvent.change(tracerSelector, {target : {value : "3"}});
      fireEvent.change(daySelector, {target : {value : "4"}});
      fireEvent.change(timeInput, {target : {value : "1"}});
      fireEvent.change(timeInput, {target : {value : "11"}});
      fireEvent.change(timeInput, {target : {value : "112"}});
    });

    expect(timeInput.value).toBe("11:2");

    act(() => {
      fireEvent.change(timeInput, {target : {value : "11:22"}});
    });

    const commitButton = screen.getByLabelText('commit-active-production');

    await act(async () => {
      commitButton.click();
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_PRODUCTION,
      expect.objectContaining({
        id : null,
        production_time : "11:22:00",
        tracer : 3,
        production_day : 4,
      }));
  });
});
