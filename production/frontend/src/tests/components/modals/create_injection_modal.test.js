/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { jest, expect, it } from '@jest/globals'
import userEvent from "@testing-library/user-event";

import { CreateInjectionOrderModal } from "~/components/modals/create_injection_modal.js"
import { ORDER_STATUS, PROP_ON_CLOSE } from "~/lib/constants.js";

import { testState} from '~/tests/app_state.js'
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";

import { DATA_INJECTION_ORDER } from "~/lib/shared_constants.js";
import { TracershopState } from "~/dataclasses/dataclasses.js";

const onClose = jest.fn()

const websocket = {
  sendCreateModel : jest.fn(() => Promise.resolve({}))
};
const props = { [PROP_ON_CLOSE] : onClose };;

describe("Create injection Order", () => {
  beforeEach(() => {});

  afterEach(() => {
    cleanup();

  });

  it("Standard Render Test", async () => {
    await waitFor(async() => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    })

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

  it("Missing Injections!", async () => {
    await waitFor(async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <CreateInjectionOrderModal {...props} />
      </TracerShopContext>
    );
    })

    expect(screen.getByRole('button', { name : "Opret ordre"})).not.toBeDisabled();

    act(() => {screen.getByRole('button', {name : "Opret ordre"}).click(); });

    await act(async () => {
      userEvent.hover(screen.getByLabelText('injection-input'))
    });

    expect(screen.getByText("Injektioner er ikke tasted ind"));

    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible()
  });

  it("Error - Bannans Injections", async () => {
    await waitFor(async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText("injection-input"), {target : {value : "a"}});
    });

    expect(screen.getByRole('button', { name : "Opret ordre"})).not.toBeDisabled();

    await act(async () => {(await screen.findByRole('button', {name : "Opret ordre"})).click();});

    await act(async () => {
      fireEvent(await screen.findByTestId('injection-input-group'), new MouseEvent('enter', {
        bubbles : true,
        cancelable : true,
      }))
      //userEvent.hover(screen.getByLabelText('injection-input'));
    });

    //expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible()
    //expect(screen.getByText("Injektioner er ikke et tal")).toBeVisible();


  });

  it("Error - Negative Injections", async () => {
    await waitFor(() => {
        render(
          <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    });

    act(() => {
      const injectionInput = screen.getByLabelText("injection-input");
      fireEvent.change(injectionInput, {target : {value : "-3"}});
    })

    await act(async () => {screen.getByRole('button', {name : "Opret ordre"}).click()});
    expect(await screen.findByText("Injektioner kan ikke være negativ"));
    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible();
  });

  it("Error - half a Injections", async () => {
    await waitFor(async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    })

    act(() => {
      fireEvent.change(screen.getByLabelText("injection-input"), {target : {value : "2.5"}});
    })

    expect(screen.getByRole('button', { name : "Opret ordre"})).not.toBeDisabled();

    await act(async () => {screen.getByRole('button', {name : "Opret ordre"}).click();});

    await act(async () => {
      userEvent.hover(screen.getByLabelText('injection-input'));
    });

    expect(await screen.findByText("Injektioner er ikke et helt tal")).toBeVisible();  // These need to be find
    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible();
  });


  it("Error - half a Injections + plus danish numbers", async () => {
    await waitFor(() => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    });

    act(() => {
      fireEvent.change(screen.getByLabelText("injection-input"), {target : {value : "2,5"}});
    })

    await act(async () => {screen.getByRole('button', {name : "Opret ordre"}).click();});

    await act(async () => {
      userEvent.hover(screen.getByLabelText('injection-input'));
    });

    expect(await screen.findByText("Injektioner er ikke et helt tal"));
    expect(screen.getByRole('button', {name : "Opret ordre"})).toBeVisible()
  });


  it("Error - Missing Delivery Time", async () => {
    await waitFor(async () => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    });

    act(() => {
      const injectionInput = screen.getByLabelText("injection-input");
      fireEvent.change(injectionInput, {target : {value : "4"}});
    })

    await act(async () => { screen.getByRole('button', {name : "Opret ordre"}).click(); });

    act(() => { userEvent.hover(screen.getByLabelText("delivery-time-input")); });

    expect(screen.getByLabelText("delivery-time-input")).toHaveStyle('background: rgb(255, 51, 51);');
    expect(await screen.findByText("Leverings tid er ikke tasted ind")).toBeVisible();

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
  });

  it("Success order", async () => {
    const test_state = new TracershopState()
    Object.assign(test_state, testState)

    test_state.today = new Date(2020, 3, 5, 12, 0, 0);

    await waitFor(async () => {
      render(
        <TracerShopContext tracershop_state={test_state} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    });

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

  it("Update Tracer to empty endpoint disables button", async () => {

    await waitFor(() => {
      render(
        <TracerShopContext tracershop_state={testState} websocket={websocket}>
          <CreateInjectionOrderModal {...props} />
        </TracerShopContext>
      );
    })

    await act(async () => {
      const endpointSelect = screen.getByLabelText('select-endpoint')
      // test endpoint with id 6 should have no tracers assigned!
      fireEvent.change(endpointSelect, { target : { value : "6" }})
    });

    expect(screen.getByRole('button', { name : "Opret ordre"})).toBeDisabled()
  })
});
