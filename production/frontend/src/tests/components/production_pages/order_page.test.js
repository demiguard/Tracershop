/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, render, screen, cleanup } from "@testing-library/react"


import { testState } from "../../app_state";
import { OrderPage } from "../../../components/production_pages/order_page";
import { db } from "../../../lib/local_storage_driver";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { UpdateToday } from "~/lib/state_actions";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");

jest.mock('../../../components/production_pages/activity_table', () =>
  ({ActivityTable : () => <div>ActivityTableMocked</div>}))
jest.mock('../../../components/production_pages/injection_table', () =>
  ({InjectionTable : () => <div>InjectionTableMocked</div>}))


const dispatchMock = jest.fn();

const websocket = tracer_websocket.TracerWebSocket;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {});

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()
});

describe("Order Page tests", () => {
  it("Standard Render test", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <OrderPage/>
      </TracerShopContext>
    );

    expect(screen.getByRole('button', {name : 'test_tracer_1'})).toBeVisible()
    expect(screen.getByRole('button', {name : 'test_tracer_3'})).toBeVisible()
    expect(screen.getByRole('button', {name : 'Special'})).toBeVisible()
    expect(screen.getByText('ActivityTableMocked')).toBeVisible()
  });

  it("Change to injection Table", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <OrderPage/>
      </TracerShopContext>
    );

    await act(async () =>{
       const button = await screen.findByRole('button', {name : 'Special'})
       button.click()
    })

    expect(await screen.findByText('InjectionTableMocked')).toBeVisible()
  })

  it("Change to injection Table", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <OrderPage/>
      </TracerShopContext>
    );

    await act(async () =>{
       const button = await screen.findByRole('button', {name : 'test_tracer_3'})
       button.click()
    })
    // I have no idea how to show that it's different
    expect(await screen.findByText('ActivityTableMocked')).toBeVisible()
  })

  it("Change day", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <OrderPage/>
      </TracerShopContext>
    );

    await act(async () =>{
       const div = await screen.findByLabelText('calender-day-13');
       div.click();
    });

    expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining(
      new UpdateToday(new Date(2020,4,13,12,0,0), websocket)
    ));
  })

  it("Change month", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <OrderPage/>
      </TracerShopContext>
    );

    await act(async () => {
       const image = await screen.findByLabelText('next-month');
       image.click();
    });

    expect(dispatchMock).toHaveBeenCalledWith(expect.objectContaining(
      new UpdateToday(new Date(2020,5,1,12,0,0), websocket)
    ));
  });

  it("Load saved db data", async () => {
    db.set("activeTracer", -1)

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket} dispatch={dispatchMock}>
        <OrderPage/>
      </TracerShopContext>
    );

    expect(await screen.findByText('InjectionTableMocked')).toBeVisible();
  });
});
