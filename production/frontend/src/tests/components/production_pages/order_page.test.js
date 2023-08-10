/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, scryRenderedComponentsWithType } from "react-dom/test-utils";
import { fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"


import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_WEBSOCKET, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE,  } from "../../../lib/constants.js";
import { AppState } from "../../app_state.js";
import { OrderPage } from "../../../components/production_pages/order_page.js";
import { db } from "../../../lib/local_storage_driver.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

jest.mock('../../../components/production_pages/activity_table', () =>
  ({ActivityTable : () => <div>ActivityTableMocked</div>}))
jest.mock('../../../components/production_pages/injection_table', () =>
  ({InjectionTable : () => <div>InjectionTableMocked</div>}))


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

describe("Order Page tests", () => {
  it("Standard Render test", async () => {
    render(<OrderPage {...props}/>)

    expect(await screen.findByRole('button', {name : 'test_tracer_1'})).toBeVisible()
    expect(await screen.findByRole('button', {name : 'test_tracer_3'})).toBeVisible()
    expect(await screen.findByRole('button', {name : 'Special'})).toBeVisible()

    expect(await screen.findByText('ActivityTableMocked')).toBeVisible()
  });

  it("Change to injection Table", async () => {
    render(<OrderPage {...props}/>)
    await act(async () =>{
       const button = await screen.findByRole('button', {name : 'Special'})
       button.click()
    })

    expect(await screen.findByText('InjectionTableMocked')).toBeVisible()
  })

  it("Change to injection Table", async () => {
    render(<OrderPage {...props}/>)
    await act(async () =>{
       const button = await screen.findByRole('button', {name : 'test_tracer_3'})
       button.click()
    })
    // I have no idea how to show that it's different
    expect(await screen.findByText('ActivityTableMocked')).toBeVisible()
  })

  it("Change day", async () => {
    render(<OrderPage {...props}/>)
    await act(async () =>{
       const div = await screen.findByLabelText('calender-day-13')
       div.click()
    })
  })

  it("Change month", async () => {
    render(<OrderPage {...props}/>)
    await act(async () =>{
       const image = await screen.findByLabelText('next-month')
       image.click()
       console.log(image)
    })

    const expected_message = {}
    expected_message[WEBSOCKET_DATE] = new Date("2020-05-31T22:00:00.000Z");
    expected_message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_GET_ORDERS;
    expect(websocket.send).toBeCalledWith(expected_message)
  });

  it("Load saved db data", async () => {
    db.set("activeTracer", -1)
    render(<OrderPage {...props}/>)
    expect(await screen.findByText('InjectionTableMocked')).toBeVisible()
  });

});
