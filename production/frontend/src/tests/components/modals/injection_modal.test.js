/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'


import { InjectionModal } from "~/components/modals/injection_modal.js"
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { PROP_MODAL_ORDER, PROP_ON_CLOSE } from "~/lib/constants.js";
import { AppState } from "~/tests/app_state.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;

const onClose = jest.fn();

const modalProps = {...AppState}

modalProps[PROP_MODAL_ORDER] = 1
modalProps[PROP_ON_CLOSE] = onClose


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
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


describe("Injection modal test suite", () =>{
  it("Standard Render test status 1", async () => {

    render(<WebsocketContextProvider value={websocket}>
      <InjectionModal {...modalProps} />
    </WebsocketContextProvider>);

    expect(await screen.findByRole('button', {name : "Accepter Ordre"})).toBeVisible();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Accept Order", async () => {
    render(<WebsocketContextProvider>
      <InjectionModal {...modalProps} />
    </WebsocketContextProvider>);

    fireEvent.click(await screen.findByRole('button', {name : "Accepter Ordre"}));

    expect(websocket.getMessage).toBeCalled()
    expect(websocket.send).toBeCalled()
  });

  it("Standard Render test status 2", async () => {
    modalProps[PROP_MODAL_ORDER] = 2

    render(<WebsocketContextProvider value={websocket}>
      <InjectionModal {...modalProps} />
    </WebsocketContextProvider>);

    expect(screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Start freeing empty Order", async () => {
    modalProps[PROP_MODAL_ORDER] = 2

    render(<WebsocketContextProvider>
      <InjectionModal {...modalProps} />
    </WebsocketContextProvider>);

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    expect(await screen.findByText("Batch nummeret er ikke i det korrekte format")).toBeVisible();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Edit Freeing Order", async () => {
    render(<WebsocketContextProvider value={websocket}>
      <InjectionModal {...modalProps} />
    </WebsocketContextProvider>);

    const input = await screen.findByLabelText("batchnr-input")
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

    const newProps = {...modalProps}
    websocket = ResolvingWebsocket
    newProps[PROP_MODAL_ORDER] = 2

    render(<WebsocketContextProvider value={websocket}>
      <InjectionModal {...newProps} />
    </WebsocketContextProvider>);

    fireEvent.change(await screen.findByLabelText("batchnr-input"), {target : {value : "test-111111-1"}});

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));

    expect(await screen.findByText("Forkert Login")).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Success Freeing Freeing Order", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
          return new Promise(async function(resolve) {resolve({
            isAuthenticated : true
          })
        });
      })
    }

    const newProps = {...modalProps}
    websocket = ResolvingWebsocket;
    newProps[PROP_MODAL_ORDER] = 2;

    render(<WebsocketContextProvider value={websocket}>
      <InjectionModal {...newProps} />
    </WebsocketContextProvider>);

    fireEvent.change(await screen.findByLabelText("batchnr-input"), {target : {value : "test-111111-1"}});

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));

    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Standard Render test status 3", async () => {
    const newProps = {...modalProps}
    newProps[PROP_MODAL_ORDER] = 3

    render(<InjectionModal
      {...newProps}
    />)


    expect( screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull();
    expect( screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeNull();
    expect( screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

})