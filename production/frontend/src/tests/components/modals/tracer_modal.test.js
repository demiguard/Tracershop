/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { TracerModal } from "~/components/modals/tracer_modal"
import { PROP_ACTIVE_TRACER, PROP_ON_CLOSE } from "~/lib/constants";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { testState } from "~/tests/app_state";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");

const onClose = jest.fn();

let websocket = null;
let container = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop" }
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
});


const props = {
  [PROP_ACTIVE_TRACER] : 2,
  [PROP_ON_CLOSE] : onClose,
};

describe("Tracer Modal test suite", () => {
  it("Standard Render test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TracerModal {...props}/>
      </TracerShopContext>
    );

    // TODO : Create short hand for displaying each endpoint, that's isn't a JSX

  });

  it("Filter tests", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TracerModal {...props}/>
      </TracerShopContext>
    );

    const filterInput = await screen.findByLabelText('input-filter')
    act(() => {
      fireEvent.change(filterInput, {target : {value : "2" }})
    })

    /**
     *  This check is invalid with the rewrite to endpoint tracers.
    expect(screen.queryByText("Customer_1")).toBeNull();
    expect(screen.queryByText("Customer_2")).toBeVisible();
    expect(screen.queryByText("Customer_3")).toBeNull();
    */
  });

  it("Add tracer to customer 4", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TracerModal {...props}/>
      </TracerShopContext>
    );

    const customer2CheckBox = screen.getByLabelText("check-4")

    act(() => {
      fireEvent.click(customer2CheckBox);
    })

    expect(websocket.send).toHaveBeenCalled();
  });

  it("Remove tracer to customer 1", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TracerModal {...props}/>
      </TracerShopContext>
    );

    const customer2CheckBox = screen.getByLabelText("check-1");

    act(() => {
      fireEvent.click(customer2CheckBox);
    });

    expect(websocket.send).toHaveBeenCalled();
  });

  it("You can close the modal by pressing the close button", () => {
    const on_close = jest.fn();

    const newProps = {...props, on_close : on_close}

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <TracerModal {...newProps}/>
      </TracerShopContext>
    );

    act(() => {
      screen.getByRole('button', { name : "Luk"}).click();
    });

    expect(on_close).toHaveBeenCalledTimes(1);
  });
});