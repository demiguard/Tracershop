/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals'


import { InjectionModal } from "~/components/modals/injection_modal.js"
import { WebsocketContextProvider, StateContextProvider } from "~/components/tracer_shop_context.js";
import { PROP_MODAL_ORDER, PROP_ON_CLOSE } from "~/lib/constants.js";
import { AppState, testState } from "~/tests/app_state.js";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_FREE_INJECTION, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;

const onClose = jest.fn();

let modalProps = null;


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
  modalProps = {
    [PROP_MODAL_ORDER] : 1,
    [PROP_ON_CLOSE] : onClose,
  };
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
  modalProps = null;
});


describe("Injection modal test suite", () =>{
  it("Standard Render test status 1", async () => {

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(await screen.findByRole('button', {name : "Accepter Ordre"})).toBeVisible();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Accept Order", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);


    fireEvent.click(await screen.findByRole('button', {name : "Accepter Ordre"}));
    expect(websocket.sendEditModel).toHaveBeenCalled();
  });

  it("Standard Render test status 2", () => {
    modalProps[PROP_MODAL_ORDER] = 2

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Start freeing empty Order", async () => {
    modalProps[PROP_MODAL_ORDER] = 2

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    expect(await screen.findByText("Lot nummeret er ikke i det korrekte format")).toBeVisible();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Edit Freeing Order", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const input = await screen.findByLabelText("lot-input")
    fireEvent.change(input, {target : {value : "test-111111-1"}});

    expect(input.value).toBe("test-111111-1");

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    fireEvent.click(screen.queryByRole('button', {name : "Rediger Ordre"}));
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Failed Freeing Freeing Order", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
          return new Promise(async function(resolve) {resolve({
            isAuthenticated : false
          })
        });
      })
    }

    websocket = ResolvingWebsocket
    modalProps[PROP_MODAL_ORDER] = 2

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    fireEvent.change(await screen.findByLabelText("lot-input"), {target : {value : "test-111111-1"}});

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));

    expect(await screen.findByText("Forkert Login")).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
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

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={ResolvingWebsocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act(() => {
      fireEvent.change(screen.getByLabelText("lot-input"), {target : {value : "test-111111-1"}});
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', {name : "Frigiv Ordre"}));
    });

    act(() => {
      fireEvent.change(screen.getByLabelText("username"), {target : { value : "test_username"}})
      fireEvent.change(screen.getByLabelText("password"), {target : { value : "test_password"}})
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name : "Frigiv Ordre"}));
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

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>)

    expect(screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Canceling an order", () => {
    modalProps[PROP_MODAL_ORDER] = 2;

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionModal {...modalProps} />
      </WebsocketContextProvider>
    </StateContextProvider>);



  })

})