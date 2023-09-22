/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals';
import { AppState } from "../../app_state.js";


let websocket = null;

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");


const now = new Date(2020,4, 4, 10, 36, 44);

beforeEach(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket
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

describe("Future Bookings Test Suite", () => {
  it("Standard render test", () => {
    
  } )


})