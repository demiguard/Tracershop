/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CreateInjectionOrderModal } from "~/components/modals/create_injection_modal.js"
import { PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_USER } from "~/lib/constants.js";

import {AppState, testState} from '~/tests/app_state.js'
import { act } from "react-dom/test-utils";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { users } from "~/tests/test_state/users";

const onClose = jest.fn()

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let props = null;

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}

  websocket = tracer_websocket.TracerWebSocket;
  props = {
    [PROP_ACTIVE_DATE] : new Date(2020,3,5),
    [PROP_ON_CLOSE] : onClose,
  };
});


afterEach(() => {
  cleanup();
  module.clearAllMocks();
  props = null;
  websocket = null;
});

describe("Create injection Order", () => {
  it("Standard Render Test", async () => {
    render(<StateContextProvider value={testState}>
             <WebsocketContextProvider value={websocket}>
               <CreateInjectionOrderModal {...props} />
             </WebsocketContextProvider>
           </StateContextProvider>);

    expect(screen.getByLabelText("select-customer")).toBeVisible();
    expect(screen.getByLabelText("select-endpoint")).toBeVisible();
    expect(screen.getByLabelText("tracer-select")).toBeVisible();
    expect(screen.getByLabelText("usage-select")).toBeVisible();
    expect(screen.getByLabelText("injection-input")).toBeVisible();
    expect(screen.getByLabelText("delivery-time-input")).toBeVisible();
    expect(screen.getByLabelText("comment-input")).toBeVisible();
    // Buttons
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible()
    expect(screen.getByRole('button', {name : "Opret Ordre"})).toBeVisible()
  });

  it("Missing Injections!", async () => {
    render(<StateContextProvider value={testState}>
             <WebsocketContextProvider value={websocket}>
               <CreateInjectionOrderModal {...props} />
            </WebsocketContextProvider>
          </StateContextProvider>);

  const createOrderButton = await screen.findByRole('button',
                                                    {name : "Opret Ordre"});
  act(() => {createOrderButton.click()});

  expect(await screen.findByText(
    "Injektioner er ikke tasted ind"))
  });

  it("Error - Bannans Injections", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "a"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() =>{createOrderButton.click()});

    expect(screen.getByText("Injektioner er ikke et tal"))
  });

  it("Error - Negative Injections", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "-3"}});
    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {createOrderButton.click()});


    expect(screen.getByText("Injektioner kan ikke være negativ"))
  });

  it("Error - half a Injections", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "2.5"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {createOrderButton.click();});

    expect(screen.getByText("Injektioner er ikke et helt tal"));
  });


  it("Error - half a Injections + plus danish numbers", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "2,5"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {createOrderButton.click();});

    expect(await screen.findByText("Injektioner er ikke et helt tal"))
  });


  it("Error - Missing Delivery Time", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "4"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => { createOrderButton.click(); });

    expect(await screen.findByText("Leverings tid er ikke tasted ind"))
  });

  it("Success order", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "4"}});

    const deliveryTimeInput = await screen.findByLabelText("delivery-time-input");
    fireEvent.change(deliveryTimeInput, {target : {value : "11:33:55"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {createOrderButton.click();})

    expect(websocket.sendCreateInjectionOrder).toBeCalled()

    expect(onClose).toBeCalled()
  });
});