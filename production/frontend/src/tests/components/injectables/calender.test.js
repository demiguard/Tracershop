/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals'

const module = jest.mock('~/lib/tracer_websocket');
const tracer_websocket = require("~/lib/tracer_websocket");

import { Calender } from '~/components/injectable/calender'
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK } from "~/lib/constants";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { ProductionBitChain } from "~/lib/data_structures";
import { getModifiedTestState, testState } from "~/tests/app_state";
import { UpdateToday } from "~/lib/state_actions";

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
const dispatch = jest.fn()

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
    const modifiedState = getModifiedTestState({ today : date });
    render(
      <TracerShopContext tracershop_state={modifiedState} websocket={websocket}>
        <Calender {...calender_props}/>
      </TracerShopContext>
    );

    //taking for account local date settings
    const expectedDate = Intl.DateTimeFormat().resolvedOptions().locale === "da-DK" ? "26. juni" : "26. June";

    expect(screen.getByText(expectedDate)).toBeVisible();
    expect(screen.getByText("Man")).toBeVisible();
    expect(screen.getByText("Tir")).toBeVisible();
    expect(screen.getByText("Ons")).toBeVisible();
    expect(screen.getByText("Tor")).toBeVisible();
    expect(screen.getByText("Fre")).toBeVisible();
    expect(screen.getByText("Lør")).toBeVisible();
    expect(screen.getByText("Søn")).toBeVisible();

  });

  it("Click on 15 of june", () => {
    const modifiedState = getModifiedTestState({ today : date });

    render(
      <TracerShopContext tracershop_state={modifiedState} websocket={websocket}>
        <Calender {...calender_props}/>
      </TracerShopContext>
    );

    fireEvent(screen.getByText("15"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    expect(onDayClick).toHaveBeenCalledWith(new Date(2012,5,15,12,0,0))

  });

  it("Increase Month", async () => {
    const modifiedState = getModifiedTestState({ today : date });

    render(
      <TracerShopContext tracershop_state={modifiedState} websocket={websocket} dispatch={dispatch}>
        <Calender {...calender_props}/>
      </TracerShopContext>
    );

    await act(async () => {
      fireEvent(screen.getByAltText("Næste"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    })
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining(new UpdateToday(new Date(2012,6,1,12,0,0), websocket)))
  });

  it("Decrease Month", async () => {
    const modifiedState = getModifiedTestState({ today : date });

    render(
      <TracerShopContext tracershop_state={modifiedState} websocket={websocket} dispatch={dispatch}>
        <Calender {...calender_props}/>
      </TracerShopContext>
    );

    await act(async () => {
      fireEvent(screen.getByAltText("Sidste"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    })
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining(new UpdateToday(new Date(2012,4,1,12,0,0), websocket)))
  });
});
