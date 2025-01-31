/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"
import { jest, expect } from '@jest/globals'

import { ORDER_STATUS, PROP_ACTIVE_DATE } from "../../../lib/constants.js";
import { testState } from "../../app_state.js";

import { InjectionTable } from "../../../components/production_pages/injection_table.js";
import { TracerShopContext } from "~/contexts/tracer_shop_context.js";
import { InjectionOrder, TracershopState } from "~/dataclasses/dataclasses.js";
import { toMapping } from "~/lib/utils.js";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, DATA_INJECTION_ORDER, TRACER_USAGE, WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_RELEASE_MULTI, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js";


const module = jest.mock('../../../lib/tracer_websocket.js');
const websocket = {
  send : jest.fn(() => Promise.resolve()),
  sendEditModel : jest.fn(() => Promise.resolve())
}

const today = new Date(2020,4, 4, 10, 36, 44)

const props = {
  [PROP_ACTIVE_DATE] : today
};

beforeAll(() => {
  jest.useFakeTimers('modern')
  jest.setSystemTime(today)
})

beforeEach(() => {

});

afterEach(() => {
  cleanup()
  window.localStorage.clear();
  module.clearAllMocks();
});


describe("Deadline Setup tests", () => {
  it("Standard render test", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionTable {...props}/>
      </TracerShopContext>
    );

    //TODO: ADD expectations!
  });

  it(("Change Sorting"), () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionTable {...props}/>
      </TracerShopContext>
    );

    const sort_status = screen.getByLabelText('sort-status');
    act(() => {
      sort_status.click();
    });
    // TODO: Assert sort

    // Invert The Sort
    act(() => {
      sort_status.click();
    });
    // TODO: Assert Sort


    const sort_order_id = screen.getByLabelText('sort-order-id');
    act(() => {
      sort_order_id.click();
    });
    // TODO: Assert sort

    const sort_destination = screen.getByLabelText('sort-destination');
    act(() => {
      sort_destination.click();
    });
    // TODO: Assert sort

    const sort_tracer = screen.getByLabelText('sort-tracer');
    act(() => {
      sort_tracer.click();
    });
    // TODO: Assert sort

    const sort_injections = screen.getByLabelText('sort-injections');
    act(() => {
      sort_injections.click();
    });
    // TODO: Assert sort

    const sort_deliver_time = screen.getByLabelText('sort-deliver-time');
    act(() => {
      sort_deliver_time.click();
    });
    // TODO: Assert sort

    const sort_usage = screen.getByLabelText('sort-usage');
    act(() => {
      sort_usage.click();
    });
    // TODO: Assert sort
  });

  it("Open Create injection Order Modal", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionTable {...props}/>
      </TracerShopContext>
    );

    const createNewOrderButton = screen.getByRole('button', {name : "Opret ny ordre"});

    act(() => {
      createNewOrderButton.click();
    });

    // TODO: Assert

    // Close it again
    act(() => {
      screen.getByRole('button', {name : "Luk"}).click()
    });
  });

  it("Open order modal", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionTable {...props}/>
      </TracerShopContext>
    );

    const statusIcon1 = screen.getByLabelText('status-icon-1');

    act(() => {
      statusIcon1.click();
    })
  });

  it("Display cancelled Order", async () => {
    const newState = new TracershopState();
    Object.assign(newState, testState);

    newState.injection_orders = toMapping([
      new InjectionOrder(
        1, "11:00:00", "2020-05-04", 1, ORDER_STATUS.CANCELLED, TRACER_USAGE.human, null, "AAAA0000", 1, 1, null, null, null
      ),
      new InjectionOrder(
        2, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ORDERED, TRACER_USAGE.human, null, "AAAA0000", 1, 1, null, null, null
      )
    ]);

    testState.today = today;

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <InjectionTable {...props}/>
      </TracerShopContext>
    );

    expect(screen.queryByTestId('accept-1')).toBeNull();
    expect(screen.queryByTestId('check-1')).toBeNull();
    expect(screen.queryByTestId('delivery-1')).toBeNull();
  });


  it("Accept an order from the table", async () => {
    const newState = new TracershopState();
    Object.assign(newState, testState);

    newState.injection_orders = toMapping([new InjectionOrder(
      1, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ORDERED, TRACER_USAGE.human, null, "AAAA0000", 1, 1, null, null, null
    )]);

    render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <InjectionTable {...props}/>
      </TracerShopContext>
    );

    await act(async () => {
      screen.getByTestId('accept-1').click();
    });

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_INJECTION_ORDER, [expect.objectContaining({
      id : 1, status : ORDER_STATUS.ACCEPTED
    })]);
  });

  it("Release many orders", async () => {
    const newState = new TracershopState();
    Object.assign(newState, testState);


    const websocket = {
      send : jest.fn(() => Promise.resolve({
        [AUTH_IS_AUTHENTICATED] : true
      }))
    }

    newState.injection_orders = toMapping([
      new InjectionOrder(
        1, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ACCEPTED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
      ),
      new InjectionOrder(
        2, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ACCEPTED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
      ),
      new InjectionOrder(
        3, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ACCEPTED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
      ),
      new InjectionOrder(
        4, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ACCEPTED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
      ),
      new InjectionOrder(
        5, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ACCEPTED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
      ),
      new InjectionOrder(
        6, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ACCEPTED, TRACER_USAGE.human, null, "AAAA0000", 1, 4, null, null, null
      )]);

    const { } = render(
      <TracerShopContext tracershop_state={newState} websocket={websocket}>
        <InjectionTable {...props}/>
      </TracerShopContext>
    );

    act(() => {
      screen.getByTestId('check-1').click();
    });
    expect(screen.getByTestId('check-6')).toBeDisabled();

    act(() => {
      screen.getByTestId('check-2').click();
    });
    act(() => {
      screen.getByTestId('check-3').click();
    });
    act(() => {
      screen.getByTestId('check-4').click();
    });
    act(() => {
      screen.getByTestId('check-5').click();
    });
    act(() => {
      screen.getByRole('button', { name : "Frigiv flere ordre"}).click()
    });

    expect(screen.getByTestId('release_many_injections')).toBeVisible();
    expect(screen.getByTestId('release-injection-1')).toBeVisible();
    expect(screen.getByTestId('release-injection-2')).toBeVisible();
    expect(screen.getByTestId('release-injection-3')).toBeVisible();
    expect(screen.getByTestId('release-injection-4')).toBeVisible();
    expect(screen.getByTestId('release-injection-5')).toBeVisible();
    expect(screen.queryByTestId('release-injection-6')).toBeNull();

    const test_batch_number = "fdgd-111222-1"
    act(() => {
      const input = screen.getByTestId('batch');
      fireEvent.change(input, {target : { value : test_batch_number}});
    });

    const username = "asdf";
    const password = "qwer";

    act(() => {
      fireEvent.change(
        screen.getByLabelText('username'),
        {target : { value : username }}
      );

      fireEvent.change(
        screen.getByLabelText('password'),
        {target : { value : password }}
      );
    });

    await act(async () => {
      screen.getByRole('button', {name : "Frigiv ordre"}).click();
    });

    expect(websocket.send).toHaveBeenCalledWith(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_RELEASE_MULTI,
      [WEBSOCKET_DATA] : test_batch_number,
      [WEBSOCKET_DATA_ID] : [1,2,3,4,5],
      [DATA_AUTH] : {
        [AUTH_USERNAME] : username,
        [AUTH_PASSWORD] : password
      }
    })); // with should have been made

    // expect modal to close after success
    expect(screen.queryByTestId('release_many_injections')).toBeNull();
  });
});