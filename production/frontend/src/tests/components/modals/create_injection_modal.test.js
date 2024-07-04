  /**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import userEvent from "@testing-library/user-event";

import { CreateInjectionOrderModal } from "~/components/modals/create_injection_modal.js"
import { ERROR_BACKGROUND_COLOR, ORDER_STATUS, PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_USER } from "~/lib/constants.js";

import { testState} from '~/tests/app_state.js'
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";

import { DATA_INJECTION_ORDER } from "~/lib/shared_constants.js";

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

    //screen.debug();

    expect(screen.getByLabelText("select-customer")).toBeVisible();
    expect(screen.getByLabelText("select-customer").value).toBe("2");

    expect(screen.getByLabelText("select-endpoint")).toBeVisible();
    expect(screen.getByLabelText("select-endpoint").value).toBe("3");
    expect(screen.getByLabelText("tracer-select")).toBeVisible();
    expect(screen.getByLabelText("tracer-select").value).not.toBe("NaN");
    expect(screen.getByLabelText("usage-select")).toBeVisible();
    expect(screen.getByLabelText("usage-select").value).toBe("0");
    expect(screen.getByLabelText("injection-input")).toBeVisible();
    expect(screen.getByLabelText("injection-input").value).toBe("");
    expect(screen.getByLabelText("delivery-time-input")).toBeVisible();
    expect(screen.getByLabelText("delivery-time-input").value).toBe("");
    expect(screen.getByLabelText("comment-input")).toBeVisible();
    expect(screen.getByLabelText("comment-input").value).toBe("");
    // Buttons
    expect(screen.getByRole('button', {name : "Luk"})).toBeVisible()
    expect(screen.getByRole('button', {name : "Opret Ordre"})).toBeVisible()
  });

  it.skip("Missing Injections!", async () => {
    render(<StateContextProvider value={testState}>
             <WebsocketContextProvider value={websocket}>
               <CreateInjectionOrderModal {...props} />
            </WebsocketContextProvider>
          </StateContextProvider>);


  await act(async () => {screen.findByRole('button',{name : "Opret Ordre"}).click()});

  await act(async () => {
    userEvent.hover(screen.getByLabelText('injection-input'))
  });

  expect(await screen.findByText("Injektioner er ikke tasted ind"))
  });

  it.skip("Error - Bannans Injections", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

  act(() => {
    fireEvent.change(screen.getByLabelText("injection-input"), {target : {value : "a"}});
  })

  act(() => {screen.getByRole('button',{name : "Opret Ordre"}).click()});


  await act(async () => {
    userEvent.hover(screen.getByLabelText('injection-input'));
  });

  expect(screen.getByText("Injektioner er ikke et tal")).toBeVisible()

  });

  it.skip("Error - Negative Injections", async () => {
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

  it.skip("Error - half a Injections", async () => {
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


  it.skip("Error - half a Injections + plus danish numbers", async () => {
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


  it("Error - Missing Delivery Time", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    act(() => {
      const injectionInput = screen.getByLabelText("injection-input");
      fireEvent.change(injectionInput, {target : {value : "4"}});
    })

    act(() => { screen.getByRole('button', {name : "Opret Ordre"}).click(); });

    act(() => {
      userEvent.hover(screen.getByLabelText("injection-input"));
    });

    //expect(screen.getByText("Leverings tid er ikke tasted ind")).toBeVisible();
    //expect(screen.getByLabelText("injection-input")).toHaveStyle('background: rgb(255, 51, 51);');
    //expect(await screen.findByText("Leverings tid er ikke tasted ind"))

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });

  it("Success order", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CreateInjectionOrderModal {...props} />
     </WebsocketContextProvider>
   </StateContextProvider>);

    act(() => {
      const endpointSelect = screen.getByLabelText('select-customer');
      fireEvent.change(endpointSelect, {target : {value : "1"}});
    });

    act(() => {
      const endpointSelect = screen.getByLabelText('tracer-select');
      fireEvent.change(endpointSelect, {target : {value : "2"}});
    });

    act(() => {
      const injectionInput = screen.getByLabelText("injection-input");
      fireEvent.change(injectionInput, {target : {value : "4"}});
    });


    act(() => {
      const deliveryTimeInput = screen.getByLabelText("delivery-time-input");
      fireEvent.change(deliveryTimeInput, {target : {value : "11:33:55"}});
    })

    await act(async () => {screen.getByRole('button',{name : "Opret Ordre"}).click();});

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_INJECTION_ORDER, expect.objectContaining({
      injections : 4,
      status : ORDER_STATUS.ORDERED,
      delivery_time : "11:33:55",
      delivery_date : "2020-04-05",
      ordered_by : testState.logged_in_user.id,
    }))

    expect(onClose).toHaveBeenCalled()
  });
});
