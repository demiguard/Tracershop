/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils";
import { render, screen, cleanup } from "@testing-library/react"


import { PROP_WEBSOCKET  } from "../../../lib/constants.js";
import { AppState } from "../../app_state.js";

import { CloseDaysPage } from "../../../components/production_pages/setup_pages/close_days_page.js/index.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = null;
let container = null;
let props = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    container = document.createElement("div");
    websocket = new tracer_websocket.TracerWebSocket()
    props = {...AppState};
    props[PROP_WEBSOCKET] = websocket;
});

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  props=null
});


describe("Close Days Setup test", () => {
  it("Standard Render test", async () => {
    render(<CloseDaysPage {...props}/>)

    expect(await screen.findByLabelText('calender-day-1')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-2')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-3')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-4')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-5')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-6')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-7')).toBeVisible()
    expect(await screen.findByLabelText('calender-day-13')).toBeVisible()
  });

  it("Create close date", async () => {
    render(<CloseDaysPage {...props}/>)
    await act(async () => {
      const button = await screen.findByLabelText('calender-day-12')
      button.click();
    })
  })

  it("Delete close date", async () => {
    render(<CloseDaysPage {...props}/>)
    await act(async () => {
      // Note that from src/tests/test_state/close_dates
      const button = await screen.findByLabelText('calender-day-13')
      button.click();
    })
  })

})