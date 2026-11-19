/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, render, screen, cleanup } from "@testing-library/react"
import { beforeAll, beforeEach, afterEach, describe, it, expect } from "@jest/globals"

import { SetupShop, DEADLINE_KEY } from "../../../components/production_pages/setup_pages/setup_shop";
import { WebsocketContextProvider } from "~/contexts/tracer_shop_context";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

jest.mock('../../../components/production_pages/setup_pages/customer_page', () =>
  ({CustomerPage : () => <div>CustomerPageMocked</div>}))
jest.mock('../../../components/production_pages/setup_pages/close_days_page', () =>
  ({CloseDaysPage : () => <div>CloseDaysPageMocked</div>}))
jest.mock('../../../components/production_pages/setup_pages/deadline_setup', () =>
  ({DeadlineSetup : () => <div>DeadlineSetupMocked</div>}))
jest.mock('../../../components/production_pages/setup_pages/tracer_page', () =>
  ({TracerPage : () => <div>TracerPageMocked</div>}))
jest.mock('../../../components/production_pages/setup_pages/production_user_setup', () =>
  ({ProductionUserSetup : () => <div>ProductionUserSetupMocked</div>}))


const websocket = new tracer_websocket.TracerWebSocket();;


beforeAll(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44));
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()
});


describe("Setup Shop page test", () => {
  it("Standard Render test", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <SetupShop />
    </WebsocketContextProvider>);
  })

  it("Switch to deadlines", () => {
    const {rerender} = render(<WebsocketContextProvider value={websocket}>
      <SetupShop />
    </WebsocketContextProvider>);

    expect(screen.queryByText('DeadlineSetupMocked')).toBeNull();

    rerender(
      <WebsocketContextProvider value={websocket}>
        <SetupShop hint={DEADLINE_KEY} />
      </WebsocketContextProvider>
    );

    expect(screen.getByText('DeadlineSetupMocked')).toBeVisible();
  });
});
