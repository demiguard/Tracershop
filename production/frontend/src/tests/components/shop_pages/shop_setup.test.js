/**
 * @jest-environment jsdom
 */

import React from "react";

import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ShopSetup } from '../../../components/shop_pages/shop_setup'
import { AppState } from "../../app_state.js";
import { WebsocketContextProvider } from "~/contexts/tracer_shop_context";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

jest.mock('../../../components/shop_pages/shop_injectables/location_table', () =>
  ({LocationTable : () => <div>LocationTableMock</div>}))

jest.mock('../../../components/shop_pages/shop_injectables/procedure_table', () =>
  ({ProcedureTable : () => <div>ProcedureTableMock</div>}))

const websocket = tracer_websocket.TracerWebSocket;
const now = new Date(2020,4, 4, 10, 36, 44)

beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  window.location = { href : "tracershop"};
});

afterEach(() => {
  cleanup();
  module.clearAllMocks();
  window.localStorage.clear();
});

describe("Shop Setup test suite",() => {
  it("Standard render test", async () => {

    render(<WebsocketContextProvider value={websocket}>
      <ShopSetup />
    </WebsocketContextProvider>);
    expect(await screen.findByLabelText('setup-Lokationer')).toBeVisible()
    expect(await screen.findByLabelText('setup-Procedure')).toBeVisible()

  })

  it("Switch to production", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <ShopSetup/>
    </WebsocketContextProvider>);

    await act(async () => {
      const switchButton = await screen.findByLabelText('setup-Procedure');
      switchButton.click();
    })
    expect(screen.getByText("ProcedureTableMock")).toBeVisible();
  });
});