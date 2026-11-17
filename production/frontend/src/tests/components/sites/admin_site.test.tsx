/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { jest, beforeEach, afterEach, describe, it, expect } from '@jest/globals'

import AdminSite from "~/components/sites/admin_site"
import { DATABASE_ADMIN_PAGE, PROP_USER } from "~/lib/constants";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { testState } from "~/tests/app_state";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");

let websocket = tracer_websocket.TracerWebSocket;

const now = new Date(2020,4, 4, 10, 36, 44);


beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
});

describe("Admin site test suite", () => {
  it("standard test", async () => {
    await waitFor(() => render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <AdminSite/>
      </TracerShopContext>
      ));
  });


  it("standard test click on production", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <AdminSite/>
      </TracerShopContext>
    );

     const trigger = screen.getByText("Produktion").closest(".dropdown") as HTMLElement;

    await act( async () => {
      fireEvent.mouseEnter(trigger);
    })

    expect(screen.getByLabelText("navbar-admin-admin")).toBeVisible();
    expect(screen.getByLabelText("navbar-admin-shop")).toBeVisible();
  });

  it("Switch Site", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <AdminSite/>
      </TracerShopContext>
    );

    const trigger = screen.getByText("Produktion").closest(".dropdown") as HTMLElement;

    await act( async () => {
      fireEvent.mouseEnter(trigger);
    })

    await act(async () => {
      const shopSite = screen.getByLabelText("navbar-admin-shop")
      fireEvent.click(shopSite)
    })

    const item = window.localStorage.getItem(DATABASE_ADMIN_PAGE);
    expect(item).toEqual("shop"); // I guess we should mock the shop site t
  });
});