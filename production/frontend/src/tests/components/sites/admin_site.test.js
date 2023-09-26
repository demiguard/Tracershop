/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState } from "../../app_state.js";
import { db } from "../../../lib/local_storage_driver.js";
import { AdminSite } from "../../../components/sites/admin_site.js"
import { DATABASE_ADMIN_PAGE, PROP_USER, PROP_WEBSOCKET } from "../../../lib/constants.js";
import { ANON } from "../../test_state/users.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44);


beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  delete window.location;
  window.location = { href : "tracershop"};
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState};
  props[PROP_WEBSOCKET] = websocket;
  props[PROP_USER] = ANON;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});

describe("Admin site test suite", () => {
  it("standard test", async () => {
    render(<AdminSite
      {...props}
      />);
    });

    it("standard test click on production", async () => {
    render(<AdminSite
      {...props}
    />);

    await act(async () => {
      const dropDown = await screen.findByText("Produktion")
      fireEvent.click(dropDown)
    })

    expect(await screen.findByLabelText("navbar-admin-admin")).toBeVisible()
    expect(await screen.findByLabelText("navbar-admin-production")).toBeVisible()
    expect(await screen.findByLabelText("navbar-admin-shop")).toBeVisible()
  });

  it("Switch Site", async () => {
    render(<AdminSite
      {...props}
    />);

    await act(async () => {
      const dropDown = await screen.findByText("Produktion")
      fireEvent.click(dropDown)
    })

    await act(async () => {
      const shopSite = await screen.findByLabelText("navbar-admin-shop")
      fireEvent.click(shopSite)
    })
    const item = window.localStorage.getItem(DATABASE_ADMIN_PAGE);
    expect(item).toEqual("shop");
  });
});