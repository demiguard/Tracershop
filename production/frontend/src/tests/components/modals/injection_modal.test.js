/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals'


import { InjectionModal } from "~/components/modals/injection_modal.js"
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";
import { PROP_MODAL_ORDER, PROP_ON_CLOSE } from "~/lib/constants.js";
import { AppState, testState } from "~/tests/app_state.js";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_FREE_INJECTION, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;

const onClose = jest.fn();
let modalProps = null;

beforeEach(() => {
  websocket = tracer_websocket.TracerWebSocket;
  modalProps = {
    [PROP_MODAL_ORDER] : 1,
    [PROP_ON_CLOSE] : onClose,
  };
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
  modalProps = null;
});


describe("Injection modal test suite", () =>{
  it("Standard Render test status 1", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    expect(screen.getByRole('button', {name : "Accepter ordre"})).toBeVisible();
    expect(screen.queryByRole('button', {name : "Frigiv ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Rediger ordre"})).toBeNull();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Accept Order", async () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    await act(async () => {
      screen.getByRole('button', {name : "Accepter ordre"}).click()
    });

    expect(websocket.sendEditModel).toHaveBeenCalled();
  });

  it("Standard Render test status 2", () => {
    modalProps[PROP_MODAL_ORDER] = 2;

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    expect(screen.queryByRole('button', {name : "Accepter ordre"})).toBeNull();
    expect(screen.getByRole('button', {name : "Frigiv ordre"})).toBeVisible();
    expect(screen.queryByRole('button', {name : "Rediger ordre"})).toBeNull();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Start freeing empty Order", async () => {
    modalProps[PROP_MODAL_ORDER] = 2;

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    act(() => {
      screen.getByRole('button', {name : "Frigiv ordre"}).click();
    })

    expect(screen.getByText("Lot nummeret er ikke i det korrekte format")).toBeVisible();
    expect(screen.getByRole('button', {name : "Frigiv ordre"})).toBeVisible();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Edit Freeing Order", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    const input = screen.getByLabelText("lot-input");
    fireEvent.change(input, {target : {value : "test-111111-1"}});

    expect(input.value).toBe("test-111111-1");

    fireEvent.click(screen.getByRole('button', {name : "Frigiv ordre"}));
    fireEvent.click(screen.getByRole('button', {name : "Rediger ordre"}));
    expect(screen.getByRole('button', {name : "Frigiv ordre"})).toBeVisible();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Failed Freeing No Password Order", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),

      send : jest.fn((message) => Promise.resolve({isAuthenticated : false}))
    }

    modalProps[PROP_MODAL_ORDER] = 2

    render(
      <TracerShopContext tracershop_state={testState} websocket={ResolvingWebsocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    act(() => {
      fireEvent.change(screen.getByLabelText("lot-input"), {target : {value : "test-111111-1"}});
    });

    act(() => { // To get the authenticate to appear
      screen.getByRole('button', {name : "Frigiv ordre"}).click();
    });

    await act(async () => { // To get the authenticate to confirm the missing password
      screen.getByRole('button', {name : "Frigiv ordre"}).click();
    });

    expect(await screen.findByText("Dit kodeord er ikke tastet ind.")).toBeVisible();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();

    expect(ResolvingWebsocket.send).not.toHaveBeenCalled();
  });

  it("Success Freeing Freeing Order", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        [WEBSOCKET_MESSAGE_TYPE] : input
      }}),
      send : jest.fn((message) => Promise.resolve({
        [AUTH_IS_AUTHENTICATED] : true
      }))
    };
    modalProps[PROP_MODAL_ORDER] = 2;

    render(
      <TracerShopContext tracershop_state={testState} websocket={ResolvingWebsocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    act(() => {
      fireEvent.change(screen.getByLabelText("lot-input"), {target : {value : "test-111111-1"}});
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', {name : "Frigiv ordre"}));
    });

    act(() => {
      fireEvent.change(screen.getByLabelText("username"), {target : { value : "test_username"}})
      fireEvent.change(screen.getByLabelText("password"), {target : { value : "test_password"}})
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name : "Frigiv ordre"}));
    });

    expect(ResolvingWebsocket.send).toHaveBeenCalledWith(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_FREE_INJECTION,
      [DATA_AUTH] : {
        [AUTH_USERNAME] : "test_username",
        [AUTH_PASSWORD] : "test_password",
      },
      [WEBSOCKET_DATA] : {
        lot_number : "test-111111-1",
        [WEBSOCKET_DATA_ID] : 2
      }
    }));

    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Standard Render test status 3", () => {
    modalProps[PROP_MODAL_ORDER] = 3;

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );

    expect(screen.queryByRole('button', {name : "Accepter ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Frigiv ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Rediger ordre"})).toBeNull();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Canceling an order", () => {
    modalProps[PROP_MODAL_ORDER] = 2;

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionModal {...modalProps}/>
      </TracerShopContext>
    );
  });
});
