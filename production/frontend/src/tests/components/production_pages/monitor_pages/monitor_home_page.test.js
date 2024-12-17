/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, render, screen, cleanup } from "@testing-library/react"

import { ActivityTable } from "~/components/production_pages/activity_table.js"

import { ORDER_STATUS, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER } from "~/lib/constants.js";
import { testState } from "~/tests/app_state.js";
import { StateContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";
import { InjectionOrder, ActivityOrder, TracershopState } from "~/dataclasses/dataclasses";
import { separatorInjectionOrders, separatorActivityOrders } from "~/components/production_pages/monitoring_pages/monitor_home_page";
import { object } from "prop-types";


const module = jest.mock('~/lib/tracer_websocket.js');
const tracer_websocket = require("~/lib/tracer_websocket.js");


let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
    container = document.createElement("div");
    websocket = tracer_websocket.TracerWebSocket
    props = {
      [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,26,33),
      [PROP_ACTIVE_TRACER] : 1,
    };
});

afterEach(() => {
  cleanup()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  props=null
});

describe("InjectionOrder Separators test suite", () => {

  it("not released", () => {
    const testData = [
      new InjectionOrder(1,
                         "12:30:00",
                         "2000/05/05",
                         1,
                         ORDER_STATUS.ACCEPTED,
                         0,
                         null,
                         4,
                         1,
                         1,
                         "BlaBla",
                         null, 2)
    ];

    const res = separatorInjectionOrders(testData);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(0);
    expect(res.notReleased).toEqual(1);
  })



  it("On time", () => {
    const testData = [
      new InjectionOrder(1,
                         "12:30:00",
                         "2016/05/05",
                         1,
                         ORDER_STATUS.RELEASED,
                         0,
                         null,
                         4,
                         1,
                         1,
                         "BlaBla",
                         "2016/05/05 12:00:00", 2)
    ];

    const res = separatorInjectionOrders(testData);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(1);
    expect(res.releasedDelayed30).toEqual(0);
    expect(res.releasedDelayed30Plus).toEqual(0);
  });

  it("Delayed 5 min", () => {
    const testData = [
      new InjectionOrder(1,
                         "12:30:00",
                         "2016/05/05",
                         1,
                         ORDER_STATUS.RELEASED,
                         0,
                         null,
                         4,
                         1,
                         1,
                         "BlaBla",
                         "2016/05/05 12:35:00", 2)
    ];

    const res = separatorInjectionOrders(testData);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(0);
    expect(res.releasedDelayed30).toEqual(1);
    expect(res.releasedDelayed30Plus).toEqual(0);
  });

  it("Delayed 35 min", () => {
    const testData = [
      new InjectionOrder(1,
                         "12:30:00",
                         "2016/05/05",
                         1,
                         ORDER_STATUS.RELEASED,
                         0,
                         null,
                         4,
                         1,
                         1,
                         "BlaBla",
                         "2016/05/05 13:05:00", 2)
    ];

    const res = separatorInjectionOrders(testData);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(0);
    expect(res.releasedDelayed30).toEqual(0);
    expect(res.releasedDelayed30Plus).toEqual(1);
  });

});

describe("ActivityOrders Separators test suite", () => {

  const state = new TracershopState();
  Object.assign(state, testState);

  it("not released", () => {
    const testData = [
      new ActivityOrder(1,
                        12345,
                        "2010/05/05",
                        ORDER_STATUS.ACCEPTED,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null
      )
    ];

    const res = separatorActivityOrders(testData, state);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(0);
    expect(res.notReleased).toEqual(1);
  })



  it("On time", () => {
    const testData = [
      new ActivityOrder(1,
                        12345,
                        "2016/05/05",
                        ORDER_STATUS.RELEASED,
                        null,
                        1, //08:15:00
                        null,
                        "2016/05/05 08:15:00",
                        null,
                        null
      )
    ];

    const res = separatorActivityOrders(testData, state);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(1);
    expect(res.releasedDelayed30).toEqual(0);
    expect(res.releasedDelayed30Plus).toEqual(0);
  });



  it("Delayed 15 min", () => {
    const testData = [
      new ActivityOrder(1,
                        12345,
                        "2016/05/05",
                        ORDER_STATUS.RELEASED,
                        null,
                        1, //08:15:00
                        3, //moved to 09:15:00
                        "2016/05/05 09:30:00",
                        null,
                        null
      )
    ];

    const res = separatorActivityOrders(testData, state);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(0);
    expect(res.releasedDelayed30).toEqual(1);
    expect(res.releasedDelayed30Plus).toEqual(0);
  });

  it("Delayed 60 min", () => {
    const testData = [
      new ActivityOrder(1,
                        12345,
                        "2016/05/05",
                        ORDER_STATUS.RELEASED,
                        null,
                        1, //08:15:00
                        null,
                        "2016/05/05 09:15:00",
                        null,
                        null
      )
    ];

    const res = separatorActivityOrders(testData, state);

    expect(res.total).toEqual(1);
    expect(res.releasedOnTime).toEqual(0);
    expect(res.releasedDelayed30).toEqual(0);
    expect(res.releasedDelayed30Plus).toEqual(1);
  });

})
