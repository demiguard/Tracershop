/**
 * @jest-environment jsdom
 */

import React, {useContext} from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals';
import { AppState, testState } from "../../app_state.js";
import { FutureBooking } from "../../../components/shop_pages/future_bookings.js";
import { PROP_ACTIVE_DATE } from "../../../lib/constants.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";


import { TracerWebSocket } from "../../../lib/tracer_websocket.js";
jest.mock('../../../lib/tracer_websocket.js');

let container = null;
let websocket = null;
let props = null;

const now = new Date(2020,4, 4, 10, 36, 44);

beforeEach(async () => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new TracerWebSocket();


  props = {...AppState}
  props[PROP_ACTIVE_DATE] = now
});

afterEach(() => {
  cleanup();
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});

describe("Future Bookings Test Suite", () => {
  it("Standard render test", () => {

    render(<StateContextProvider value={testState}>
            <WebsocketContextProvider value={websocket}>
              <FutureBooking {...props}/>
            </WebsocketContextProvider>
          </StateContextProvider>);
  });
});