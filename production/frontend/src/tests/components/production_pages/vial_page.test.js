/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute, act } from "@testing-library/react";
import { jest } from '@jest/globals'

import { VialPage } from "~/components/production_pages/vial_page.js"

import { StateContextProvider, WebsocketContextProvider, DispatchContextProvider } from "~/contexts/tracer_shop_context.js";
import { testState } from "~/tests/app_state.js";
import { UpdateToday } from "~/lib/state_actions.js";
import { ERROR_BACKGROUND_COLOR } from "~/lib/constants.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
const dispatch = jest.fn()
const now = new Date(2019,5,11,20,11,2);

beforeEach(() => {
  delete window.location
  jest.useFakeTimers('modern');
  jest.setSystemTime(now);
  window.location = { href : "tracershop"}
  websocket = tracer_websocket.TracerWebSocket;
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
});


describe("Vial page tests suite", () => {
  it("Standard Render Tests", async () => {
    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <VialPage/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    for(const vial of testState.vial.values()){
      // Note that multiple vials may have the same lot number, hence this.
      expect(screen.getAllByText(vial.lot_number).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("Change sorting - ID", () => {
    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <VialPage/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const idTableHeader = screen.getByText('ID')
      fireEvent.click(idTableHeader)
    })

    const vial_ids = screen.getAllByTestId('id_field').map(ele => Number(ele.textContent))

    // I don't have ram to both vs code and firefox, so I can't check if this exists in jest / testing library...

    let min_id = Infinity;

    for(const vial_id of vial_ids){
      expect(vial_id).toBeLessThan(min_id);
      min_id = vial_id;
    }
  });

  it("Change sorting - double ID", () => {
    render(
    <StateContextProvider value={testState}>
      <DispatchContextProvider value={dispatch}>
        <WebsocketContextProvider value={websocket}>
          <VialPage/>
        </WebsocketContextProvider>
      </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const idTableHeader = screen.getByText('ID')
      fireEvent.click(idTableHeader);
    })

    act(() => {
      const idTableHeader = screen.getByText('ID')
      fireEvent.click(idTableHeader);
    })

    const vial_ids = screen.getAllByTestId('id_field').map(ele => Number(ele.textContent))

    // I don't have ram to both vs code and firefox, so I can't check if this exists in jest / testing library...

    let min_id = 0;

    for(const vial_id of vial_ids){
      expect(vial_id).toBeGreaterThan(min_id);
      min_id = vial_id;
    }
  });

  it("Change sorting - Lot", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lotTableHeader = screen.getByText('Lot nummer')
      fireEvent.click(lotTableHeader)
    })

    const lotNumbers = screen.getAllByTestId('lot_field').map(ele => ele.textContent);
  });

  it("Change sorting - Date", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lotTableHeader = screen.getByTestId('header-DATE')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - time", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lotTableHeader = screen.getByText('Tappe tidspunkt')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - volume", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lotTableHeader = screen.getByText('Volumen')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - aktivitet", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lotTableHeader = screen.getByText('Aktivitet');
      fireEvent.click(lotTableHeader);
    })
  });

  it("Change sorting - Owner", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lotTableHeader = screen.getByText('Ejer')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - order", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lotTableHeader = screen.getByText('Ordre')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Filter lot number", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lot_filter = screen.getByTestId("lot_filter")
      fireEvent.change(lot_filter, {target : {value : "test-200511"}})
    })

    const lotNumbers = screen.getAllByTestId('lot_field').map(ele => ele.textContent)

    for(const lot_number of lotNumbers){
      expect(lot_number).toMatch(/test-200511/)
    }
  })

  it("Filter Customer", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lot_filter = screen.getByTestId("customer-select")
      fireEvent.change(lot_filter, {target : {value : "1"}})
    })

    const customers = screen.getAllByTestId('owner_field').map(ele => ele.textContent)

    for(const customer of customers){
      expect(customer).toEqual(testState.customer.get(1).short_name);
    }
  });

  it("Filter Customer", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lot_filter = screen.getByTestId("customer-select")
      fireEvent.change(lot_filter, {target : {value : "1"}})
    })

    const customers = screen.getAllByTestId('owner_field').map(ele => ele.textContent)

    for(const customer of customers){
      expect(customer).toEqual(testState.customer.get(1).short_name);
    }
  });

  it("Fetch new vials - success", async () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    await act(async () => {
      const dateInput = screen.getByTestId("date-input");
      fireEvent.change(dateInput, {target : {value : "04/11/2019"}});
    });

    expect(screen.getByTestId("date-input")).toHaveValue('04/11/2019');

    await act(async () => {
      const searchButton = screen.getByRole("button",{name : "Søg"});
      fireEvent.mouseDown(searchButton);
    });

    expect(screen.getByTestId("date-input")).not.toHaveStyle({
      background : ERROR_BACKGROUND_COLOR
    });

    expect(dispatch).toHaveBeenCalledWith(
      // 1 Is because of time zone, so expect this test to be flaky
      // Keeping track of time is hard...
      expect.objectContaining(new UpdateToday(new Date(2019,10,4,1,0,0,0), websocket)));
  });

  it("Fetch new vials - Failure", () => {
    render(
      <StateContextProvider value={testState}>
        <DispatchContextProvider value={dispatch}>
          <WebsocketContextProvider value={websocket}>
            <VialPage/>
          </WebsocketContextProvider>
        </DispatchContextProvider>
    </StateContextProvider>);

    act(() => {
      const lot_filter = screen.getByTestId("date-input")
      fireEvent.change(lot_filter, {target : {value : "21019/11/04"}})
    });

    act(() => {
      const lot_filter = screen.getByRole("button",{name : "Søg"})
      fireEvent.click(lot_filter)
    })

    expect(dispatch).not.toHaveBeenCalled();
  });
});