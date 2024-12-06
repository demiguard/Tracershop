/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals';
import { testState } from "~/tests/app_state.js";
import { StateContextProvider, WebsocketContextProvider,
  DispatchContextProvider } from "~/components/tracer_shop_context.js";
import { ERROR_MISSING_SERIES_DESCRIPTION, ProcedureTable } from "~/components/shop_pages/shop_injectables/procedure_table.js";
import { DATA_PROCEDURE, SUCCESS_STATUS_CRUD } from "~/lib/shared_constants.js";
import { ERROR_BACKGROUND_COLOR } from "~/lib/constants.js";
const module = jest.mock('../../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../../lib/tracer_websocket.js");

const websocket = tracer_websocket.TracerWebSocket;
const now = new Date(2020,4, 4, 10, 36, 44);
const dispatch = jest.fn();

beforeEach(async () => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  delete window.location;
  window.location = { href : "tracershop"};
});

afterEach(() => {
  cleanup();
  module.clearAllMocks();
  window.localStorage.clear();
});

describe("Procedure Table test suite", () => {
  it("Standard Render test", async() => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <DispatchContextProvider value={dispatch}>
          <ProcedureTable relatedCustomer={testState.customer}/>
        </DispatchContextProvider>
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.getByTestId("procedure-identifier--1")).toBeVisible();
    expect(screen.getByTestId("tracer--1")).toBeVisible();
    expect(screen.getByTestId("units--1")).toBeVisible();
    expect(screen.queryByLabelText("commit--1")).toBeNull();

    for(const production_identifier of testState.procedure_identifier.values()){
      // Either a pi is in a row or in the option, both visible
      expect(screen.getByText(production_identifier.description)).toBeVisible();
    }
  });

  it("Change to customer 2 and create a procedure", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => { return Promise.resolve(
        {status : SUCCESS_STATUS_CRUD.SUCCESS}
      )}),
      sendCreateModel : jest.fn(() => {
        return Promise.resolve({status : SUCCESS_STATUS_CRUD.SUCCESS})
      })
    }

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={ResolvingWebsocket}>
        <ProcedureTable relatedCustomer={testState.customer}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const endpointSelect = screen.getByLabelText("select-customer");

    act(() => {
      fireEvent.change(endpointSelect, {target: {value: 2 }});
    })

    const piSelect = screen.getByTestId("procedure-identifier--1");
    const tracerSelect = screen.getByTestId("tracer--1");
    const unitsInput = screen.getByTestId("units--1");

    act(() => {
      fireEvent.change(piSelect, {target: {value : 2}});
      fireEvent.change(tracerSelect, {target: {value : 3}});
      fireEvent.change(unitsInput, {target: {value : "2000"}});
    });

    await act(async () => { screen.getByLabelText("commit--1").click(); });

    expect(ResolvingWebsocket.sendCreateModel).toHaveBeenCalledWith(
      DATA_PROCEDURE,
      expect.objectContaining({
        series_description : 2,
        tracer : 3,
        tracer_units : 2000,
        delay_minutes : 0,
        owner : 3,
      }
    ));

    expect(screen.getByTestId("tracer--1")).toHaveValue("");
    expect(screen.getByTestId("units--1")).toHaveValue("0")
    expect(screen.getByTestId("procedure-identifier--1")).toHaveValue("")
  });

  it("Change to customer 2 and attempt Type non sense in", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {return new Promise(async function(resolve) {
        return {status : SUCCESS_STATUS_CRUD.SUCCESS};
      })}),
      sendCreateModel : jest.fn()
    }
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={ResolvingWebsocket}>
        <ProcedureTable relatedCustomer={testState.customer}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const endpointSelect = screen.getByLabelText("select-customer");

    act(() => {
      fireEvent.change(endpointSelect, {target: {value: 2}});
    })

    const piSelect = screen.getByTestId("procedure-identifier--1");
    const unitsInput = screen.getByTestId("units--1");

    act(() => {
      fireEvent.change(piSelect, {target: {value : 2}});
      fireEvent.change(unitsInput, {target: {value : "asdf2000"}});
    });

    await act(async () => {
      const createButton = screen.getByLabelText("commit--1");
      fireEvent.click(createButton);
    })
    expect(websocket.sendCreateModel).not.toHaveBeenCalled();

    act(() => {
      const unitsInputParent = screen.getByTestId("units--1").closest("div");
      fireEvent.mouseEnter(unitsInputParent);
    })

    expect(screen.getByText("Enheder er ikke et tal")).toBeVisible();
  })

  //#region edit Tests
  it("Edit Procedure 1 successfully", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable relatedCustomer={testState.customer}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const tracerSelect = screen.getByTestId("tracer-1");
    const unitsInput = screen.getByTestId("units-1");

    act(() => {
      fireEvent.change(tracerSelect, {target: {value : "1"}});
      fireEvent.change(unitsInput, {target: {value : "2000"}});
    });

    await act(async () => {
      const editButton = screen.getByLabelText("commit-1");
      fireEvent.click(editButton);
    })

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_PROCEDURE, expect.objectContaining({
      id : 1,
      series_description : 1,
      tracer : 1,
      delay_minutes : 15,
      tracer_units : 2000,
      owner : 1,
    }));
  })


  it("Edit procedure 1 with nonsense units", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable relatedCustomer={testState.customer}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const unitsInput = screen.getByTestId("units-1");

    act(() => { fireEvent.change(unitsInput, {target: {value : "asdf2000"}}); });
    await act(async () => { screen.getByLabelText("commit-1").click(); });

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();

    act(() => {
      const unitsInputParent = screen.getByTestId("units-1").closest("div");
      fireEvent.mouseEnter(unitsInputParent);
    })

    expect(screen.getByText("Enheder er ikke et tal")).toBeVisible();
  });

  it("Edit procedure 1 with nonsense Delay", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable relatedCustomer={testState.customer}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const delayInput = screen.getByTestId("delay-1");

    act(() => {
      fireEvent.change(delayInput, {target: {value : "-5"}});
    });

    await act(async () => { screen.getByLabelText("commit-1").click(); });

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();

    act(() => {
      const delayInputParent = screen.getByTestId("delay-1").closest("div");
      fireEvent.mouseEnter(delayInputParent);
    })

    expect(screen.getByText("Forsinkelsen kan ikke være negativ")).toBeVisible();
  });

  it("Create a procedure without selecting a series description", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable relatedCustomer={testState.customer}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const tracerSelect = screen.getByTestId("tracer--1");
    const unitsInput = screen.getByTestId("units--1");

    act(() => {
      fireEvent.change(tracerSelect, {target: {value : 3}});
      fireEvent.change(unitsInput, {target: {value : "2000"}});
    });

    await act(async () => { screen.getByLabelText("commit--1").click(); });

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();

    const piSelect = screen.getByTestId("procedure-identifier--1");
    expect(piSelect).toHaveStyle({backgroundColor : ERROR_BACKGROUND_COLOR});

    act(() => {fireEvent.mouseEnter(piSelect); });

    expect(screen.getByText(ERROR_MISSING_SERIES_DESCRIPTION)).toBeVisible();
  });
});
