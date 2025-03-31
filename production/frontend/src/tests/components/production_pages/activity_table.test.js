/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, render, screen, cleanup } from "@testing-library/react"
import { ActivityTable } from "~/components/production_pages/activity_table.js"
import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER } from "~/lib/constants.js";
import { getModifiedTestState, testState } from "~/tests/app_state.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";


const module = jest.mock('~/lib/tracer_websocket.js');
const tracer_websocket = require("~/lib/tracer_websocket.js");

jest.mock('../../../components/modals/create_activity_modal', () =>
  ({CreateOrderModal : () => <div>CreateModalMocked</div>}))


const websocket = tracer_websocket.TracerWebSocket;
const props = {
  [PROP_ACTIVE_TRACER] : 1,
};

afterEach(() => {
  cleanup()
  module.clearAllMocks()
});

describe("Activity table", () => {
  it("Standard render test", () => {
    const customState = getModifiedTestState({
      today : new Date(2020,4,4,10,26,33)
    })


    render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <ActivityTable {...props} />
      </TracerShopContext>
    );

    expect(screen.getByLabelText("time-slot-icon-1")).toBeVisible();
    expect(screen.getByLabelText("time-slot-icon-4")).toBeVisible();

    //expect(await screen.findByText("Frigivet: 13538 MBq")).toBeVisible()
  })

  it("Create a new order", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ActivityTable {...props} />
      </TracerShopContext>
    );

    act(() => {
      const button = screen.getByRole('button', {name : "Opret ny ordre"})
      button.click()
    })

    expect(screen.getByText("CreateModalMocked")).toBeVisible()
  })

  it("Open time slot row", () => {
    const customState = getModifiedTestState({
      today : new Date(2020,4,4,10,26,33)
    })

    render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <ActivityTable {...props} />
      </TracerShopContext>
    );

    act(() => {
      screen.getByLabelText('open-time-slot-1').click();
    });
  });

  it("Open Order modal", () => {
    const customState = getModifiedTestState({
      today : new Date(2020,4,4,10,26,33)
    })


    render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <ActivityTable {...props} />
      </TracerShopContext>
    );

    act(() => {
      screen.getByLabelText("time-slot-icon-1").click();
    })

    expect(screen.getByTestId("activity_modal")).toBeVisible();

    act(() => {
      screen.getByRole('button', {name : "Luk"}).click();
    });

    expect(screen.queryByTestId("activity_modal")).toBeNull();
  });
});
