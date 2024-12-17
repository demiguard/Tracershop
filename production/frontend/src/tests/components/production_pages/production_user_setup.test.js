/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react"

import { AppState, testState } from "~/tests/app_state.js";

import { ProductionUserSetup } from "~/components/production_pages/setup_pages/production_user_setup.js"
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const websocket = tracer_websocket.TracerWebSocket;
let props = null;

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44))
})

beforeEach(() => {
  props = {...AppState};
});

afterEach(() => {
  cleanup()
  window.localStorage.clear();
  module.clearAllMocks();
});

describe("Production User Setup tests", () => {
  it("Standard Render tests", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionUserSetup {...props}/>
      </TracerShopContext>
    );
  });

  it("Add user assignment", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionUserSetup {...props}/>
      </TracerShopContext>
    );

    const customerSelect9 = screen.getByLabelText('related-customer-9');

    await act( async () => {
      fireEvent.change(customerSelect9, {target : {value : 2}});
    })

    expect(websocket.sendCreateModel).toHaveBeenCalled()
  });

  it("Delete user assignment", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionUserSetup {...props}/>
      </TracerShopContext>
    );

    const customerSelect6 = screen.getByLabelText('related-customer-6');

    await act( async () => {
      fireEvent.change(customerSelect6, {target : {value : ""}});
    })

    expect(websocket.sendDeleteModel).toHaveBeenCalled()
  });

  it("Change user assignment", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <ProductionUserSetup {...props}/>
      </TracerShopContext>
    );

    const customerSelect6 = screen.getByLabelText('related-customer-6');

    await act( async () => {
      fireEvent.change(customerSelect6, {target : {value : "2"}});
    })

    expect(websocket.sendDeleteModel).toHaveBeenCalled();
    expect(websocket.sendCreateModel).toHaveBeenCalled();
  });
});
