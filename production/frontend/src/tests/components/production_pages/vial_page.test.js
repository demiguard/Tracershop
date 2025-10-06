/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute, act } from "@testing-library/react";
import { jest } from '@jest/globals'

import { VialPage } from "~/components/production_pages/vial_page"
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { testState } from "~/tests/app_state";
import { UpdateToday } from "~/lib/state_actions";
import { ERROR_BACKGROUND_COLOR } from "~/lib/constants";

const module = jest.mock('../../../lib/tracer_websocket');
const tracer_websocket = require("../../../lib/tracer_websocket");

let websocket = null;
const dispatch = jest.fn()
const now = new Date(2019,5,11,20,11,2);

// So this component is fucked for testing because the rendering of vialRows
// is behind a useEffect and behind


describe("Vial page tests suite", () => {
  beforeEach(() => {

    delete window.location
    jest.useFakeTimers('modern');
    jest.setSystemTime(now);
    window.location = { href : "tracershop"}
    websocket = tracer_websocket.TracerWebSocket;
  });

  afterEach(() => {
    jest.restoreAllMocks()
    cleanup();
    module.clearAllMocks()
  });


  it("Standard Render Tests", async () => {
    const addEventListenerMock = jest.spyOn(window, 'addEventListener')
    const removeEventListenerMock = jest.spyOn(window, 'removeEventListener')

    const renderedObject = render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    expect(addEventListenerMock).toHaveBeenCalled();
    expect(removeEventListenerMock).not.toHaveBeenCalled();
    renderedObject.unmount();
    expect(removeEventListenerMock).toHaveBeenCalled();
  });

  it("Change sorting - ID", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

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
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

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
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lotTableHeader = screen.getByText('Lot nummer')
      fireEvent.click(lotTableHeader)
    })

    const lotNumbers = screen.getAllByTestId('lot_field').map(ele => ele.textContent);
  });

  it("Change sorting - Date", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lotTableHeader = screen.getByTestId('header-DATE')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - time", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lotTableHeader = screen.getByText('Tappe tidspunkt')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - volume", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lotTableHeader = screen.getByText('Volumen')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - aktivitet", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lotTableHeader = screen.getByText('Aktivitet');
      fireEvent.click(lotTableHeader);
    })
  });

  it("Change sorting - Owner", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lotTableHeader = screen.getByText('Ejer')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Change sorting - order", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lotTableHeader = screen.getByText('Ordre')
      fireEvent.click(lotTableHeader)
    })
  });

  it("Filter lot number", () => {
    render(
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

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
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

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
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

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
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

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
      <TracerShopContext tracershop_state={testState} dispatch={dispatch} websocket={websocket}>
        <VialPage/>
      </TracerShopContext>
    );

    act(() => {
      const lot_filter = screen.getByTestId("date-input");
      fireEvent.change(lot_filter, {target : {value : "21019/11/04"}})
    });

    act(() => {
      screen.getByRole("button",{name : "Søg"}).click();
    });

    expect(dispatch).not.toHaveBeenCalled();
  });
});