/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";

import { jest } from '@jest/globals'
import { AppState, testState } from '../../app_state.js';
import { CustomerModal } from '../../../components/modals/customer_modal.js'
import { ERROR_BACKGROUND_COLOR, PROP_ACTIVE_CUSTOMER, PROP_ON_CLOSE, cssError } from "~/lib/constants.js";
import { DATA_CUSTOMER, DATA_DELIVER_TIME } from "~/lib/shared_constants.js"
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const onClose = jest.fn();

let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
  delete window.location;
  window.location = { href : "tracershop" };
  container = document.createElement("div");
  websocket = tracer_websocket.TracerWebSocket;
  props = {
    [PROP_ACTIVE_CUSTOMER] : 1,
    [PROP_ON_CLOSE] : onClose
  };
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;
});

describe("Customer modal list", () => {
  it("Customer 1 Modal Render test", async () => {
    render(<StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <CustomerModal {...props} />
        </WebsocketContextProvider>
      </StateContextProvider>);

    expect(screen.getByLabelText('active-endpoint-1')).toBeVisible();
    expect(screen.getByLabelText('active-time-slot--1')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).toBeNull();

    expect(screen.getByLabelText('time-slot-1'));
    expect(screen.getByLabelText('time-slot-2'));

  });

  it("Customer 2 Modal Render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 2
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.getByLabelText('active-endpoint-3')).toBeVisible();
    expect(screen.getByLabelText('active-time-slot--1')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).toBeNull();
    expect(screen.getByLabelText('time-slot-3'));
  });

  it("Customer 3 Modal Render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 3
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.getByLabelText('active-endpoint-4')).toBeVisible();
    expect(screen.getByLabelText('active-time-slot--1')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).toBeNull();
    expect(screen.getByLabelText('time-slot-4'));
  });

  it("Customer no endpoint render test", async () => {
    props[PROP_ACTIVE_CUSTOMER] = 4
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.getByLabelText('active-endpoint--1')).toBeVisible();
    expect(screen.getByLabelText('active-time-slot--1')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).toBeNull();
  });

  it("Customer 1, click on time slot 2", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 = screen.getByLabelText('time-slot-2');

    act(() => {
      fireEvent.click(timeSlot2);
    })

    const targetTimeSlot = testState.deliver_times.get(2)
    const timeSlotForm = screen.getByLabelText('time-slot-delivery-time');
    const weeklySelect = screen.getByLabelText('weekly-select');
    const productionSelect = screen.getByLabelText('production-select');
    expect(screen.getByLabelText('active-time-slot-2')).toBeVisible();
    expect(timeSlotForm.value).toEqual(targetTimeSlot.delivery_time);
    expect(Number(weeklySelect.value)).toEqual(targetTimeSlot.weekly_repeat);
    expect(Number(productionSelect.value)).toEqual(targetTimeSlot.production_run)
  })

  it("Customer 1, change time slot", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 = await screen.findByLabelText('time-slot-2');
    act(() => {fireEvent.click(timeSlot2);});

    const timeSlotForm = await screen.findByLabelText('time-slot-delivery-time');
    const weeklySelect = await screen.findByLabelText('weekly-select');
    const productionSelect = await screen.findByLabelText('production-select');


    const /**@type {ActivityDeliveryTimeSlot} */ targetTimeSlot = testState.deliver_times.get(2);

    expect(timeSlotForm.value).toEqual(targetTimeSlot.delivery_time);
    expect(Number(weeklySelect.value)).toEqual(targetTimeSlot.weekly_repeat);
    expect(Number(productionSelect.value)).toEqual(targetTimeSlot.production_run);
    expect(screen.queryByLabelText("time-slot-initialize")).not.toBeNull();
  })

  it("Customer 1, change time slot 2 - delivery time", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 = screen.getByLabelText('time-slot-2');
    const timeSlotForm = screen.getByLabelText('time-slot-delivery-time');

    act(() => {
      fireEvent.click(timeSlot2);
      fireEvent.change(timeSlotForm, {target : {value : "14:30:00"}});
    });

    expect(timeSlotForm.value).toEqual("14:30:00");
    expect(screen.getByLabelText("time-slot-commit")).toBeVisible();
    expect(screen.getByLabelText("time-slot-initialize")).toBeVisible();
  });

  it("Customer 1, edit time slot 2 - delivery time", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 = screen.getByLabelText('time-slot-2');
    const timeSlotForm = screen.getByLabelText('time-slot-delivery-time');

    act(() => {
      fireEvent.click(timeSlot2);
      fireEvent.change(timeSlotForm, {target : {value : "14:30:00"}});
    });

    await act(async () => {
      const editButton = screen.getByLabelText("time-slot-commit");
      fireEvent.click(editButton);
    });

    expect(websocket.sendCreateModel).not.toBeCalled();
    expect(websocket.sendEditModel).toBeCalled();
    //expect(screen.getByLabelText("time-slot-edit")).toBeVisible();
  });

  it("Attempt to create delivery endpoint without endpoint",  () => {
    props[PROP_ACTIVE_CUSTOMER] = 4
    render(<StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <CustomerModal {...props} />
        </WebsocketContextProvider>
      </StateContextProvider>);

    const timeSlotForm = screen.getByLabelText('time-slot-delivery-time');
    act(() => {
      fireEvent.change(timeSlotForm, {target : {value : "14:30:00"}});
    });

    const timeSlotCommit = screen.getByLabelText('time-slot-commit');

    act(() => {
      timeSlotCommit.click();
    });

    const endpointSelect = screen.getByLabelText('endpoint-select');

    expect(endpointSelect).toHaveStyle({
      background : ERROR_BACKGROUND_COLOR
    });
    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
    expect(websocket.sendEditModel).not.toHaveBeenCalled();
  });

  it("Change endpoint while an Delivery Time was selected", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 =  screen.getByLabelText('time-slot-2');
    act(() => {
      timeSlot2.click();
    });

    const endpointSelect = screen.getByLabelText('endpoint-select');
    act(() => {
      fireEvent.change(endpointSelect, {target: {value : "2"}});
    });

    expect(screen.getByLabelText('active-time-slot--1')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).toBeNull();
    expect(screen.getByLabelText("overhead-input").value).toBe("50")
  });

  it("Change endpoint to the same endpoint while an Delivery Time was selected", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 =  screen.getByLabelText('time-slot-2');
    act(() => {
      timeSlot2.click();
    });

    const endpointSelect = screen.getByLabelText('endpoint-select');
    act(() => {
      fireEvent.change(endpointSelect, {target: {value : "1"}});
    });

    expect(screen.getByLabelText('active-time-slot-2')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).not.toBeNull();
    expect(screen.getByLabelText("overhead-input").value).toBe("25");
  });

  it("Change Tracer to the same Tracer while an Delivery Time was selected", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 =  screen.getByLabelText('time-slot-2');
    act(() => {
      timeSlot2.click();
    });

    const activeTracerSelect = screen.getByLabelText('active-tracer-select');
    act(() => {
      fireEvent.change(activeTracerSelect, {target: {value : "1"}});
    });

    expect(screen.getByLabelText('active-time-slot-2')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).not.toBeNull();
    expect(screen.getByLabelText("overhead-input").value).toBe("25");
  });

  it("Change Tracer to the same Tracer while an Delivery Time was selected", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const timeSlot2 =  screen.getByLabelText('time-slot-2');
    act(() => {
      timeSlot2.click();
    });

    const activeTracerSelect = screen.getByLabelText('active-tracer-select');
    act(() => {
      fireEvent.change(activeTracerSelect, {target: {value : "3"}});
    });

    expect(screen.getByLabelText('active-time-slot--1')).toBeVisible();
    expect(screen.queryByLabelText("time-slot-initialize")).toBeNull();
    expect(screen.getByLabelText("overhead-input").value).toBe("15");
  });

  it("Change Dispenser ID - correct", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const dispenserInput = screen.getByLabelText('dispenser-input');

    act(() => {
      fireEvent.change(dispenserInput, {target : {value : "13"}});
    });

    const customerCommit = screen.getByLabelText('customer-commit');

    await act( async () => {
      customerCommit.click()
    });

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_CUSTOMER,
      expect.objectContaining({ id : 1, dispenser_id : 13 }));
  });

  it("Change Dispenser ID - incorrect", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    const dispenserInput = screen.getByLabelText('dispenser-input');

    act(() => {
      fireEvent.change(dispenserInput, {target : {value : "asdf13"}});
    });

    const customerCommit = screen.getByLabelText('customer-commit');

    await act( async () => {
      customerCommit.click();
    });

    expect(websocket.sendEditModel).not.toHaveBeenCalled();
    expect(dispenserInput).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
  });

  it("Create Endpoint", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);
    const endpointSelect = screen.getByLabelText('endpoint-select');

    act(() => {
      fireEvent.change(endpointSelect, {target : {value : "-1"}});
    });
  })

});