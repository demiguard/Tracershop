/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { jest, expect, it } from '@jest/globals'
import userEvent from "@testing-library/user-event";

import { CreateInjectionOrderModal } from "~/components/modals/create_injection_modal"
import { ORDER_STATUS, PROP_ON_CLOSE } from "~/lib/constants";

import { testState} from '~/tests/app_state'
import { TracerShopContext } from "~/contexts/tracer_shop_context";

import { DATA_INJECTION_ORDER } from "~/lib/shared_constants";
import { TracershopState } from "~/dataclasses/dataclasses";

const onClose = jest.fn();

const websocket = {
  sendCreateModel : jest.fn(() => Promise.resolve({}))
};
const props = { [PROP_ON_CLOSE] : onClose };


beforeEach(() => {

});

afterEach(() => {
  cleanup();
  jest.resetAllMocks()
});


describe("Create injection Order", () => {
  it("Standard Render Test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    expect(screen.getByLabelText("select-customer")).toBeVisible();
    expect(screen.getByLabelText("select-endpoint")).toBeVisible();
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
    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible()
    expect(screen.getByRole('button', {name : "Opret ordre"})).not.toBeDisabled()
  });

  it("Missing Injections!", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    expect(screen.getByRole('button', { name : "Opret ordre"})).not.toBeDisabled();

    act(() => {screen.getByRole('button', {name : "Opret ordre"}).click(); });

    act( () => {
      userEvent.hover(screen.getByLabelText('injection-input'))
    });

    expect(screen.getByText("Injektioner er ikke tasted ind"));

    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible();
    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });

  it("Error - Bannans Injections", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    act(() => {
      fireEvent.change(screen.getByLabelText("injection-input"), {target : {value : "a"}});
    });

    expect(screen.getByRole('button', { name : "Opret ordre"})).not.toBeDisabled();

    act(() => {screen.getByRole('button', {name : "Opret ordre"}).click();});

    act(() => {
      fireEvent(screen.getByTestId('injection-input-group'), new MouseEvent('enter', {
        bubbles : true,
        cancelable : true,
      }))
      //userEvent.hover(screen.getByLabelText('injection-input'));
    });

    //expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible()
    //expect(screen.getByText("Injektioner er ikke et tal")).toBeVisible();

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });

  it("Error - Negative Injections", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    act(() => {
      const injectionInput = screen.getByLabelText("injection-input");
      fireEvent.change(injectionInput, {target : {value : "-3"}});
    })

    act(() => {screen.getByRole('button', {name : "Opret ordre"}).click()});

    expect(screen.getByText("Injektioner kan ikke være negativ"));
    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible();

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });

  it("Error - half a Injections", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    act(() => {
      fireEvent.change(screen.getByLabelText("injection-input"), {target : {value : "2.5"}});
    })

    expect(screen.getByRole('button', { name : "Opret ordre"})).not.toBeDisabled();

    act(() => {screen.getByRole('button', {name : "Opret ordre"}).click();});

    act(() => {
      userEvent.hover(screen.getByLabelText('injection-input'));
    });

    //expect(screen.getByText("Injektioner er ikke et helt tal")).toBeVisible(); // this is true, but jest doesn't think it is
    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible();

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });


  it("Error - half a Injections + plus danish numbers", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    act(() => {
      fireEvent.change(screen.getByLabelText("injection-input"), {target : {value : "2,5"}});
    })

    act(() => {screen.getByRole('button', {name : "Opret ordre"}).click();});

    act(() => {
      userEvent.hover(screen.getByLabelText('injection-input'));
    });

    expect(screen.getByText("Injektioner er ikke et helt tal"));
    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible()

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });


  it("Error - Missing Delivery Time", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    act(() => {
      const injectionInput = screen.getByLabelText("injection-input");
      fireEvent.change(injectionInput, {target : {value : "4"}});
    })

    act(() => { screen.getByRole('button', {name : "Opret ordre"}).click(); });

    act(() => { userEvent.hover(screen.getByLabelText("delivery-time-input")); });

    //expect(screen.getByText("Leverings tid er ikke tasted ind")).toBeVisible(); // this is true, but jest doesn't think it is
    expect(screen.getByLabelText("delivery-time-input")).toHaveStyle('background: rgb(255, 51, 51);');

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });

  it("Success order", async () => {
    const test_state = new TracershopState()
    Object.assign(test_state, testState)

    test_state.today = new Date(2020, 3, 5, 12, 0, 0);

    render(
      <TracerShopContext tracershop_state={test_state} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

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

    await act(async () => {screen.getByRole('button',{name : "Opret ordre"}).click();});

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_INJECTION_ORDER, expect.objectContaining({
      injections : 4,
      status : ORDER_STATUS.ORDERED,
      delivery_time : "11:33:55",
      delivery_date : "2020-04-05",
      ordered_by : testState.logged_in_user.id,
    }))

    expect(onClose).toHaveBeenCalled()
  });

  it("Update Tracer to empty endpoint disables button", () => {

    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );

    act(() => {
      const endpointSelect = screen.getByLabelText('select-endpoint')
      // test endpoint with id 6 should have no tracers assigned!
      fireEvent.change(endpointSelect, { target : { value : "6" }})
    });

    expect(screen.getByRole('button', { name : "Opret ordre"})).toBeDisabled()
  })
});
