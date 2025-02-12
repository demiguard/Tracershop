/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, render, screen, cleanup } from "@testing-library/react"

import { AppState } from "../../app_state.js";
import { SetupShop, siteNames } from "../../../components/production_pages/setup_pages/setup_shop.js";
import { WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";

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


let websocket = null;
let container = null;
let props = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
    container = document.createElement("div");
    websocket = new tracer_websocket.TracerWebSocket()
    props = {...AppState};
});

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  props=null
});


describe("Setup Shop page test", () => {
  it("Standard Render test", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <SetupShop {...props} />
    </WebsocketContextProvider>)


    for(const siteName of Object.values(siteNames)){
      expect(await screen.findByRole('button', {name : siteName})).toBeVisible();
    }
  })

  it("Switch to deadlines", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <SetupShop {...props} />
    </WebsocketContextProvider>);

    await act(async () => {
      const button = await screen.findByRole('button', {name : 'Deadlines'});
      button.click();
    })

    expect(await screen.findByText('DeadlineSetupMocked')).toBeVisible();
  });
});
