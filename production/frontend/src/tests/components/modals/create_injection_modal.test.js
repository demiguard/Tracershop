/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CreateInjectionOrderModal } from "../../../components/modals/create_injection_modal.js"
import { PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";

import {AppState} from '../../app_state.js'
import { act } from "react-dom/test-utils";

const onClose = jest.fn()
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket
  props[PROP_ACTIVE_DATE] = new Date(2020,3,5);
  props[PROP_ON_CLOSE] = onClose
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
});

describe("Create injection Order", () => {
  it("Standard Render Test", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />)

    expect(await screen.findByLabelText("select-customer")).toBeVisible();
    expect(await screen.findByLabelText("select-endpoint")).toBeVisible();
    expect(await screen.findByLabelText("tracer-select")).toBeVisible();
    expect(await screen.findByLabelText("usage-select")).toBeVisible();
    expect(await screen.findByLabelText("injection-input")).toBeVisible();
    expect(await screen.findByLabelText("delivery-time-input")).toBeVisible();
    expect(await screen.findByLabelText("comment-input")).toBeVisible();
    // Buttons
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible()
    expect(await screen.findByRole('button', {name : "Opret Ordre"})).toBeVisible()
  });

  it("Missing Injections!", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />);

  const createOrderButton = await screen.findByRole('button',
                                                    {name : "Opret Ordre"});
  act(() => {
    createOrderButton.click()
  })

  expect(await screen.findByText(
    "Der er ikke indtastet hvor mange injektioner der skal bestilles")).toBeVisible
  })

  it("Error - Bannans Injections", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "a"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() =>{
      createOrderButton.click()
    })

    expect(await screen.findByText("Injektionerne er ikke et tal"))
  });

  it("Error - Negative Injections", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "-3"}});
    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {
      createOrderButton.click()
    })


    expect(await screen.findByText("Der skal bestilles et positivt mængde af injectioner"))
  });

  it("Error - half a Injections", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "2.5"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {
      createOrderButton.click()
    })

    expect(await screen.findByText("Der kan kun bestilles et helt antal injektioners"))
  });


  it("Error - half a Injections + plus danish numbers", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "2,5"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {
      createOrderButton.click()
    })

    expect(await screen.findByText("Der kan kun bestilles et helt antal injektioners"))
  });


  it("Error - Missing Delivery Time", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "4"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {
      createOrderButton.click()
    })

    expect(await screen.findByText("Leverings tidspunktet er ikke et valid"))
  });

  it("Success order", async () => {
    render(<CreateInjectionOrderModal
      {...props}
    />);

    const injectionInput = await screen.findByLabelText("injection-input");
    fireEvent.change(injectionInput, {target : {value : "4"}});

    const deliveryTimeInput = await screen.findByLabelText("delivery-time-input");
    fireEvent.change(deliveryTimeInput, {target : {value : "11:33:55"}});

    const createOrderButton = await screen.findByRole('button',
                                                      {name : "Opret Ordre"});
    act(() => {
      createOrderButton.click();
    })

    expect(websocket.getMessage).toBeCalled()
    expect(websocket.send).toBeCalled()
    expect(onClose).toBeCalled()
  });
});