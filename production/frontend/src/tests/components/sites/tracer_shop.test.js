/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { AppState } from "../../app_state.js";
import { db } from "../../../lib/local_storage_driver.js";
import { TracerShop } from "../../../components/sites/tracer_shop.js"
import { PROP_USER, PROP_WEBSOCKET } from "../../../lib/constants.js";
import { ANON, users } from "../../test_state/users.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


let websocket = null;
let container = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44)


beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket;
  props[PROP_USER] = ANON;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});

describe("Tracer shop test suite", () => {
  it("standard test", () => {
    render(<TracerShop
      {...props}
    />);
  })

  it("standard test Site admin", () => {
    props[PROP_USER] = users.get(1);
    render(<TracerShop
      {...props}
    />);
  })

  it("standard test Production Admin", () => {
    props[PROP_USER] = users.get(2);

    render(<TracerShop
      {...props}
    />);
  })

  it("standard test Production user", () => {
    props[PROP_USER] = users.get(3);

    render(<TracerShop
      {...props}
    />);
  })

  it("standard test Shop Admin", () => {
    props[PROP_USER] = users.get(4);
    render(<TracerShop
      {...props}
    />);
  })

  it("standard test shop user", () => {
    props[PROP_USER] = users.get(5);
    render(<TracerShop
      {...props}
    />);
  })

  it("standard test shop external", () => {
    props[PROP_USER] = users.get(6);
    render(<TracerShop
      {...props}
    />);
  })

})
