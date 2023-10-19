/**
 * @jest-environment jsdom
 */

import React, {useContext} from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals';
import { testState } from "~/tests/app_state.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { ERROR_MISSING_SERIES_DESCRIPTION, ProcedureTable } from "~/components/shop_pages/shop_injectables/procedure_table.js";
import { DATA_PROCEDURE } from "~/lib/shared_constants.js";
const module = jest.mock('../../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../../lib/tracer_websocket.js");


let websocket = null;

const now = new Date(2020,4, 4, 10, 36, 44);

beforeEach(async () => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(now)
  delete window.location
  window.location = { href : "tracershop"}
  websocket = tracer_websocket.TracerWebSocket;
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
  window.localStorage.clear()
  websocket = null;

});

describe("Procedure Table test suite", () => {
  it("Standard Render test", async() => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.getByTestId("new-procedure-identifier")).toBeVisible()
    expect(screen.getByTestId("new-tracer")).toBeVisible()
    expect(screen.getByTestId("new-units")).toBeVisible()
    expect(screen.getByTestId("new-delay")).toBeVisible()
    expect(screen.getByLabelText("new-create")).toBeVisible()

    for(const pi of testState.procedure_identifier.values()){
      // Either a pi is in a row or in the option, both visible
      expect(screen.getByText(pi.description)).toBeVisible();
    }
  });

  it("Change to customer 2 and create a procedure", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const endpointSelect = screen.getByLabelText("select-customer");

    act(() => {
      fireEvent.change(endpointSelect,{target: {value: 2}});
    })

    const piSelect = screen.getByTestId("new-procedure-identifier");
    const tracerSelect = screen.getByTestId("new-tracer");
    const unitsInput = screen.getByTestId("new-units");
    const delayInput = screen.getByTestId("new-delay");
    const createButton = screen.getByLabelText("new-create");

    act(() => {
      fireEvent.change(piSelect, {target: {value : 2}});
      fireEvent.change(tracerSelect, {target: {value : 3}});
      fireEvent.change(unitsInput, {target: {value : "2000"}});
      fireEvent.change(delayInput, {target: {value : "0"}});
      fireEvent.click(createButton);
    });

    expect(websocket.sendCreateModel).toBeCalledWith(DATA_PROCEDURE, [expect.objectContaining({
      series_description : 2,
      tracer : 3,
      tracer_units : 2000,
      delay_minutes : 0,
      owner : 3,
    })]);
  })

  it("Change to customer 2 and attempt to create a blank", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const endpointSelect = screen.getByLabelText("select-customer");

    act(() => {
      fireEvent.change(endpointSelect,{target: {value: 2}});
    })

    const createButton = screen.getByLabelText("new-create");

    act(() => {
      fireEvent.click(createButton);
    });

    const piSelect = screen.getByTestId("new-procedure-identifier");
    act(() => {
      fireEvent.mouseEnter(piSelect)
    })

    expect(websocket.sendCreateModel).not.toBeCalled();
    expect(screen.getByText(ERROR_MISSING_SERIES_DESCRIPTION)).toBeVisible();
  })

  it("Change to customer 2 and attempt Type non sense in", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const endpointSelect = screen.getByLabelText("select-customer");

    act(() => {
      fireEvent.change(endpointSelect,{target: {value: 2}});
    })

    const piSelect = screen.getByTestId("new-procedure-identifier");
    const unitsInput = screen.getByTestId("new-units");
    const delayInput = screen.getByTestId("new-delay");
    const createButton = screen.getByLabelText("new-create");


    act(() => {
      fireEvent.change(piSelect, {target: {value : 2}});

      fireEvent.change(unitsInput, {target: {value : "asdf2000"}});
      fireEvent.change(delayInput, {target: {value : "asdf0"}});
      fireEvent.click(createButton);
    });

    expect(websocket.sendCreateModel).not.toBeCalled();

    act(() => {
      fireEvent.mouseEnter(unitsInput)
    })

    expect(screen.getByText("Enheder")).toBeVisible();
  })

  // EDIT TESTS!
  it("Edit Procedure 1 successfully", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const tracerSelect = screen.getByTestId("tracer-1");
    const unitsInput = screen.getByTestId("units-1");
    const delayInput = screen.getByTestId("delay-1");
    const editButton = screen.getByLabelText("update-1");

    act(() => {
      fireEvent.change(tracerSelect, {target: {value : ""}});
      fireEvent.change(unitsInput, {target: {value : "2000"}});
      fireEvent.change(delayInput, {target: {value : "0"}});
      fireEvent.click(editButton);
    });

    expect(websocket.sendEditModel).toBeCalledWith(DATA_PROCEDURE, [expect.objectContaining({
      id : 1,
      series_description : 1,
      tracer : null,
      tracer_units : 2000,
      delay_minutes : 0,
      owner : 1,
    })]);
  })


  it("Edit procedure 1 with nonsense", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <ProcedureTable/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const unitsInput = screen.getByTestId("units-1");
    const delayInput = screen.getByTestId("delay-1");
    const editButton = screen.getByLabelText("update-1");


    act(() => {
      fireEvent.change(unitsInput, {target: {value : "asdf2000"}});
      fireEvent.change(delayInput, {target: {value : "asdf0"}});
      fireEvent.click(editButton);
    });

    expect(websocket.sendCreateModel).not.toBeCalled();

    act(() => {
      fireEvent.mouseEnter(unitsInput)
    })

    expect(screen.getByText("Enheder")).toBeVisible();
  })


});
