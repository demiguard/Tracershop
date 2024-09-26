/**
 * @jest-environment jsdom
 */


import React from "react";
import { screen, render, cleanup, fireEvent, act } from "@testing-library/react";
import { jest } from '@jest/globals';
import { testState } from "~/tests/app_state.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";

import { InjectionOrderCard } from "~/components/shop_pages/shop_injectables/injection_order_card.js";
import { INJECTION_USAGE, ORDER_STATUS, TRACER_TYPE } from "~/lib/constants.js";
import { InjectionOrder } from "~/dataclasses/dataclasses.js";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants.js";
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

const InjectionTracers = [...testState.tracer.values()].filter((tracer) => tracer.tracer_type === TRACER_TYPE.DOSE);

describe("Injection order card test suite", () => {
  it("Standard Render Test - Status 1", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={testState.injection_orders.get(1)}
          valid_deadline={false}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const tracerInput       = screen.getByLabelText("tracer-input-1");
    const injectionInput    = screen.getByLabelText("injections-input-1");
    const deliveryTimeInput = screen.getByLabelText("delivery-time-input-1");
    const usageInput        = screen.getByLabelText("usage-input-1");

    expect(tracerInput).toBeVisible();
    expect(tracerInput).toHaveProperty('disabled');
    expect(injectionInput).toBeVisible();
    expect(injectionInput).toHaveProperty('readOnly');
    expect(deliveryTimeInput).toBeVisible();
    expect(deliveryTimeInput).toHaveProperty('readOnly');
    expect(usageInput).toBeVisible();
    expect(usageInput).toHaveProperty('disabled');

  });

  it("Standard Render Test - Status 2", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={testState.injection_orders.get(2)}
          valid_deadline={true}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);
  });

  it("Standard Render Test - Status 3", () => {
    const injectionOrder = testState.injection_orders.get(3)

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={injectionOrder}
          valid_deadline={true}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const lotNumberInput = screen.getByLabelText('lot-number-input-3')

    expect(lotNumberInput.value).toBe(injectionOrder.lot_number);
  });

  it("Standard Render Test - Status 3, old data", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={testState.injection_orders.get(4)}
          valid_deadline={true}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);
  });

  it("Standard Render Test - New order", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={new InjectionOrder(
            -1,
            "", // Delivery TIme
            "2020-05-04", //
            "", // injections
            ORDER_STATUS.AVAILABLE, // Status
            INJECTION_USAGE.human, // tracer_usage
            "", // comment
            null, // ordered_by
            1, // endpoint
            InjectionTracers[0].id, // tracer
            null, null , null)}
          valid_deadline={true}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);
  });

  it("Edit an order", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={testState.injection_orders.get(1)}
          valid_deadline={true}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const tracerInput       = screen.getByLabelText("tracer-input-1");
    const injectionInput    = screen.getByLabelText("injections-input-1");
    const deliveryTimeInput = screen.getByLabelText("delivery-time-input-1");
    const usageInput        = screen.getByLabelText("usage-input-1");

    act(() => {
      fireEvent.change(tracerInput, {target : { value : 5}})
      fireEvent.change(injectionInput, {target : { value : 2 }})
      fireEvent.change(deliveryTimeInput, {target : { value : "13:45" }})
      fireEvent.change(usageInput, {target : { value : INJECTION_USAGE.other}})
    });

    act(() => {
      screen.getByLabelText('commit-injection-1').click();
    });

    expect(websocket.sendEditModel).toBeCalledWith(DATA_INJECTION_ORDER, expect.objectContaining({
      tracer : 5,
      injections : 2,
      delivery_time : "13:45:00",
      tracer_usage : INJECTION_USAGE.other,
    }));
    });

    it("Create an order", async () => {
      render(<StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <InjectionOrderCard
            injection_tracers={InjectionTracers}
            injection_order={new InjectionOrder(
              -1,
              "", // Delivery TIme
              "2020-05-04", //
              "", // injections
              ORDER_STATUS.AVAILABLE, // Status
              INJECTION_USAGE.human, // tracer_usage
              "", // comment
              null, // ordered_by
              1, // endpoint
              InjectionTracers[0].id, // tracer
              null, null , null)}
            valid_deadline={true}
          />
        </WebsocketContextProvider>
      </StateContextProvider>);

      const tracerInput  = screen.getByLabelText("tracer-input--1");
      const injectionInput  = screen.getByLabelText("injections-input--1");
      const deliveryTimeInput = screen.getByLabelText("delivery-time-input--1");
      const usageInput = screen.getByLabelText("usage-input--1");

      act(() => {
        fireEvent.change(tracerInput, {target : { value : 5}})
        fireEvent.change(injectionInput, {target : { value : 2 }})
        fireEvent.change(deliveryTimeInput, {target : { value : "13:45" }})
        fireEvent.change(usageInput, {target : { value : INJECTION_USAGE.other}})
      })

      const createIcon = screen.getByLabelText('commit-injection--1');

      await act(async () => {
        createIcon.click();
      })

      expect(websocket.sendEditModel).not.toBeCalled();
      expect(websocket.sendCreateModel).toBeCalledWith(DATA_INJECTION_ORDER, expect.objectContaining({
        tracer : 5,
        injections : 2,
        delivery_time : "13:45:00",
        tracer_usage : INJECTION_USAGE.other,
      }));
    });

    it("fail to create an order", async () => {
      render(<StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <InjectionOrderCard
            injection_tracers={InjectionTracers}
            injection_order={new InjectionOrder(
              -1,
              "", // Delivery TIme
              "2020-05-04", //
              "", // injections
              ORDER_STATUS.AVAILABLE, // Status
              INJECTION_USAGE.human, // tracer_usage
              "", // comment
              null, // ordered_by
              1, // endpoint
              InjectionTracers[0].id, // tracer
              null, null , null)}
            valid_deadline={true}
          />
        </WebsocketContextProvider>
      </StateContextProvider>);

      const tracerInput  = screen.getByLabelText("tracer-input--1");
      const injectionInput  = screen.getByLabelText("injections-input--1");
      const deliveryTimeInput = screen.getByLabelText("delivery-time-input--1");
      const usageInput = screen.getByLabelText("usage-input--1");

      act(() => {
        fireEvent.change(tracerInput, {target : { value : 5}})
        fireEvent.change(injectionInput, {target : { value : "asd" }})
        fireEvent.change(deliveryTimeInput, {target : { value : "asdf" }})
        fireEvent.change(usageInput, {target : { value : INJECTION_USAGE.other}})
      })

      const createIcon = screen.getByLabelText('commit-injection--1');

      await act(async () => {
        createIcon.click();
      })

      expect(websocket.sendEditModel).not.toBeCalled();
      expect(websocket.sendCreateModel).not.toBeCalled();
    });

  it("Swtich to Delivery note", () => {
    const injectionOrder = testState.injection_orders.get(3)

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={injectionOrder}
          valid_deadline={true}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);
    const deliveryNote = screen.getByLabelText('to-delivery-3')

    act(() => {
      deliveryNote.click();
    });
  });

  it("Delete an order", () => {
    const injectionOrder = testState.injection_orders.get(1);

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <InjectionOrderCard
          injection_tracers={InjectionTracers}
          injection_order={injectionOrder}
          valid_deadline={true}
        />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act(() => {
      screen.getByLabelText('delete-injection-1').click();
    });

    expect(websocket.sendDeleteModel).toHaveBeenCalled();
  });
})
