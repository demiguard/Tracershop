/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"
import { jest, expect } from '@jest/globals'

import { ORDER_STATUS, PROP_ACTIVE_DATE } from "~/lib/constants";
import { getModifiedTestState, testState } from "~/tests/app_state";

import { InjectionTable } from "~/components/production_pages/injection_table";
import { TracerShopContext } from "~/contexts/tracer_shop_context";
import { InjectionOrder, TracershopState } from "~/dataclasses/dataclasses";
import { toMapping } from "~/lib/utils";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH,
  DATA_INJECTION_ORDER, TRACER_USAGE, WEBSOCKET_DATA, WEBSOCKET_DATA_ID,
  WEBSOCKET_MESSAGE_RELEASE_MULTI, WEBSOCKET_MESSAGE_TYPE
} from "~/lib/shared_constants";


const module = jest.mock('../../../lib/tracer_websocket');
const websocket = {
  send : jest.fn(() => Promise.resolve()),
  sendEditModel : jest.fn(() => Promise.resolve())
}

const today = new Date(2020,4, 4, 10, 36, 44)


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
        <InjectionTable/>
      </TracerShopContext>
    );

    //TODO: ADD expectations!
  });

  it(("Change Sorting"), () => {
    const customState = getModifiedTestState({
      today : new Date(2020,4, 4, 10, 36, 44),
    })


    render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <InjectionTable/>
      </TracerShopContext>
    );

    act(() => { screen.getByLabelText('sort-status').click(); });
    // TODO: Assert sort

    // Invert The Sort
    act(() => { screen.getByLabelText('sort-status').click(); });
    // TODO: Assert Sort

    const sort_order_id = screen.getByLabelText('sort-order-id');
    act(() => {  sort_order_id.click(); });
    // TODO: Assert sort

    const sort_destination = screen.getByLabelText('sort-destination');
    act(() => { sort_destination.click(); });
    // TODO: Assert sort

    const sort_tracer = screen.getByLabelText('sort-tracer');
    act(() => { sort_tracer.click(); });
    // TODO: Assert sort

    const sort_injections = screen.getByLabelText('sort-injections');
    act(() => { sort_injections.click(); });
    // TODO: Assert sort

    const sort_deliver_time = screen.getByLabelText('sort-deliver-time');
    act(() => { sort_deliver_time.click(); });
    // TODO: Assert sort

    const sort_usage = screen.getByLabelText('sort-usage');
    act(() => { sort_usage.click(); });
    // TODO: Assert sort
  });

  it("Open Create injection Order Modal", () => {
    render(
      <TracerShopContext tracershop_state={testState} websocket={websocket}>
        <InjectionTable/>
      </TracerShopContext>
    );

    act(() => { screen.getByRole('button', {name : "Opret ny ordre"}).click(); });

    // TODO: Assert

    // Close it again
    act(() => { screen.getByRole('button', {name : "Luk"}).click() });
  });

  it("Open order modal", () => {
    const customState = getModifiedTestState({ today : today, })

    render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <InjectionTable/>
      </TracerShopContext>
    );

    const statusIcon1 = screen.getByLabelText('status-icon-1');

    act(() => { statusIcon1.click(); });
  });

  it("Display cancelled Order", async () => {
    const customState = getModifiedTestState({
      [DATA_INJECTION_ORDER] : toMapping([
        new InjectionOrder(
          1, "11:00:00", "2020-05-04", 1, ORDER_STATUS.CANCELLED, TRACER_USAGE.human, null, "AAAA0000", 1, 1, null, null, null
        ),
        new InjectionOrder(
          2, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ORDERED, TRACER_USAGE.human, null, "AAAA0000", 1, 1, null, null, null
        )
      ]),
      today : today
    });

    render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <InjectionTable/>
      </TracerShopContext>
    );

    expect(screen.queryByTestId('accept-1')).toBeNull();
    expect(screen.queryByTestId('check-1')).toBeNull();
    expect(screen.queryByTestId('delivery-1')).toBeNull();
  });


  it("Accept an order from the table", async () => {
    const customState = getModifiedTestState({
      [DATA_INJECTION_ORDER] : toMapping([new InjectionOrder(
        1, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ORDERED, TRACER_USAGE.human, null, "AAAA0000", 1, 1, null, null, null
      )]),
      today : today,
    })


    render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <InjectionTable/>
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
    const customState = getModifiedTestState({
      [DATA_INJECTION_ORDER] : toMapping([
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
        )]),
        today : today
    })


    const websocket = {
      send : jest.fn(() => Promise.resolve({
        [AUTH_IS_AUTHENTICATED] : true
      }))
    }
    const { } = render(
      <TracerShopContext tracershop_state={customState} websocket={websocket}>
        <InjectionTable/>
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

  it("Can accept orders with a press of button on injection tables", async () => {
    const customState = getModifiedTestState({
      [DATA_INJECTION_ORDER] : toMapping([
        new InjectionOrder(
          1, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ORDERED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
        ),
        new InjectionOrder(
          2, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ACCEPTED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
        ),
        new InjectionOrder(
          3, "11:00:00", "2020-05-04", 1, ORDER_STATUS.RELEASED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
        ),
        new InjectionOrder(
          4, "11:00:00", "2020-05-04", 1, ORDER_STATUS.CANCELLED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
        ),
        new InjectionOrder(
          5, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ORDERED, TRACER_USAGE.human, null, "AAAA0000", 1, 2, null, null, null
        ),
        new InjectionOrder(
          6, "11:00:00", "2020-05-04", 1, ORDER_STATUS.ORDERED, TRACER_USAGE.human, null, "AAAA0000", 1, 4, null, null, null
        )]),
        today : today
    });

    render(<TracerShopContext tracershop_state={customState} websocket={websocket}>
      <InjectionTable/>
    </TracerShopContext>);

    expect(screen.queryByTestId("accept-1")).not.toBeNull();
    expect(screen.queryByTestId("accept-2")).toBeNull();
    expect(screen.queryByTestId("accept-3")).toBeNull();
    expect(screen.queryByTestId("accept-4")).toBeNull();

    await act(async () => {
      screen.getByTestId("accept-1").click();
    });

    expect(websocket.sendEditModel).toHaveBeenCalled();
  });

});