/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { testState } from "../../app_state";

import { AdminSite } from "../../../components/sites/admin_site.js"
import { DATABASE_ADMIN_PAGE, PROP_USER } from "../../../lib/constants.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = tracer_websocket.TracerWebSocket;
let container = null;

const now = new Date(2020,4, 4, 10, 36, 44);


beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  delete window.location;
  window.location = { href : "tracershop"};
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
});

describe("Admin site test suite", () => {
  it("standard test", () => {
    render(
    <TracerShopContext tracershop_state={testState} websocket={websocket}>
      <AdminSite/>
    </TracerShopContext>)});

  it("standard test click on production", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <AdminSite/>
      </TracerShopContext>
    );
    act(() => {
      const dropDown = screen.getByText("Produktion");
      fireEvent.click(dropDown);
    })

    expect(screen.getByLabelText("navbar-admin-admin")).toBeVisible();
    expect(screen.getByLabelText("navbar-admin-production")).toBeVisible();
    expect(screen.getByLabelText("navbar-admin-shop")).toBeVisible();
  });

  it("Switch Site", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <AdminSite/>
      </TracerShopContext>
    );

    act(() => {
      const dropDown = screen.getByText("Produktion")
      fireEvent.click(dropDown)
    })

    await act(async () => {
      const shopSite = screen.getByLabelText("navbar-admin-shop")
      fireEvent.click(shopSite)
    })
    const item = window.localStorage.getItem(DATABASE_ADMIN_PAGE);
    expect(item).toEqual("shop");
  });
});