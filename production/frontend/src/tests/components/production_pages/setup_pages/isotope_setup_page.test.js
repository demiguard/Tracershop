/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { testState } from "~/tests/app_state.js";
import { IsotopeSetupPage } from "~/components/production_pages/setup_pages/isotope_setup_page.js";

const module = jest.mock('../../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../../lib/tracer_websocket.js");

let websocket = null;

beforeAll(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(2020,4, 4, 10, 36, 44));
})

beforeEach(() => {
  websocket = tracer_websocket.TracerWebSocket;
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  module.clearAllMocks();

});

describe("Isotope setup page", () => {
  it("Standard Render Test", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <IsotopeSetupPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    for(const isotope of testState.isotopes.values()){
      expect(screen.getByLabelText(`atomic-letter-${isotope.id}`)).toBeVisible();
      expect(screen.getByLabelText(`atomic-mass-${isotope.id}`)).toBeVisible();
      expect(screen.getByLabelText(`atomic-number-${isotope.id}`)).toBeVisible();
      expect(screen.getByLabelText(`halflife-${isotope.id}`)).toBeVisible();
    }
    expect(screen.getByLabelText(`atomic-letter--1`)).toBeVisible();
    expect(screen.getByLabelText(`atomic-mass--1`)).toBeVisible();
    expect(screen.getByLabelText(`atomic-number--1`)).toBeVisible();
    expect(screen.getByLabelText(`halflife--1`)).toBeVisible();
  });

  it("Create new isotope", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <IsotopeSetupPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const newLetterInput = screen.getByLabelText(`atomic-letter--1`);
    const newMassInput = screen.getByLabelText(`atomic-mass--1`);
    const newNumberInput = screen.getByLabelText(`atomic-number--1`);
    const newHalflife = screen.getByLabelText(`halflife--1`);
    const newMetastable = screen.getByLabelText('metastable--1');

    act(() => {
      fireEvent.change(newLetterInput, {target: {value : "O"}});
      fireEvent.change(newMassInput, {target: {value : "15" }});
      fireEvent.change(newNumberInput, {target: {value : "10" }});
      fireEvent.change(newHalflife, {target: {value : "150" }});
      fireEvent.click(newMetastable);
    });

    const commitButton = screen.getByLabelText('commit--1');

    await act(async () => {
      commitButton.click();
    });

    expect(websocket.sendCreateModel).toBeCalled();
  });

  it("failed to new isotope", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <IsotopeSetupPage/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    const newLetterInput = screen.getByLabelText(`atomic-letter--1`);
    const newMassInput = screen.getByLabelText(`atomic-mass--1`);
    const newNumberInput = screen.getByLabelText(`atomic-number--1`);
    const newHalflife = screen.getByLabelText(`halflife--1`);


    act(() => {
      fireEvent.change(newLetterInput, {target: {value : "O"}});
      fireEvent.change(newMassInput, {target: {value : "asd" }});
      fireEvent.change(newNumberInput, {target: {value : "asd" }});
      fireEvent.change(newHalflife, {target: {value : "asd" }});

    });

    const commitButton = screen.getByLabelText('commit--1');

    await act(async () => {
      commitButton.click();
    });

    expect(websocket.sendCreateModel).not.toBeCalled();
  });
});