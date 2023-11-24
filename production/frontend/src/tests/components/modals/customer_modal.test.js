/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";

import { jest } from '@jest/globals'
import { AppState, testState } from '../../app_state.js';
import { CustomerModal } from '../../../components/modals/customer_modal.js'
import { ERROR_BACKGROUND_COLOR, PROP_ACTIVE_CUSTOMER, PROP_ON_CLOSE, cssError } from "~/lib/constants.js";
import { DATA_CUSTOMER, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_TRACER_MAPPING, WEBSOCKET_DATA } from "~/lib/shared_constants.js"
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
      customerCommit.click();
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
    await waitFor(() => {
      expect(screen.getByLabelText('dispenser-input')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    })
  });

  it("Create Endpoint, with all error", async () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);
    const endpointSelect = screen.getByLabelText('endpoint-select');

    await act(async () => {
      fireEvent.change(endpointSelect, {target : {value : "-1"}});
    });

    let endpointNameInput = screen.getByLabelText('endpoint-name');
    let endpointAddressInput = screen.getByLabelText('endpoint-address');
    let endpointCityInput = screen.getByLabelText('endpoint-city');
    let endpointZipCodeInput = screen.getByLabelText('endpoint-zip-code');
    let endpointPhoneInput = screen.getByLabelText('endpoint-phone');
    expect(endpointNameInput.value).toBe("Nyt");

    expect(endpointNameInput).toBeVisible();
    expect(endpointAddressInput).toBeVisible();
    expect(endpointCityInput).toBeVisible();
    expect(endpointZipCodeInput).toBeVisible();
    expect(endpointPhoneInput).toBeVisible();

    act(() => {fireEvent.change(screen.getByLabelText('endpoint-name'), {target : {value : ""}, bubbles : true});});
    act(() => {fireEvent.change(screen.getByLabelText('endpoint-address'), {target : { value : "a".repeat(129) }, bubbles : true});});
    act(() => {fireEvent.change(screen.getByLabelText('endpoint-city'), {target : { value : "a".repeat(129) }, bubbles : true});});
    act(() => {fireEvent.change(screen.getByLabelText('endpoint-zip-code'), {target : { value : "a".repeat(129) }, bubbles : true});});
    act(() => {fireEvent.change(screen.getByLabelText('endpoint-phone'), {target : { value : "a".repeat(129) }, bubbles : true});});

    expect(screen.getByLabelText('endpoint-name').value).toBe("");
    expect(screen.getByLabelText('endpoint-address').value).toBe("a".repeat(129));
    expect(screen.getByLabelText('endpoint-city').value).toBe("a".repeat(129));
    expect(screen.getByLabelText('endpoint-zip-code').value).toBe("a".repeat(129));
    expect(screen.getByLabelText('endpoint-phone').value).toBe("a".repeat(129));

    const commitButton = screen.getByLabelText('commit-endpoint');

    await act(async () => {
      commitButton.click();
    });

    expect(websocket.sendCreateModel).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByLabelText('endpoint-name')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
      expect(screen.getByLabelText('endpoint-address')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
      expect(screen.getByLabelText('endpoint-city')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
      expect(screen.getByLabelText('endpoint-zip-code')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
      expect(screen.getByLabelText('endpoint-phone')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    });
  });

  it("Create Endpoint", async () => {
    websocket = {
      sendCreateModel : jest.fn((message) => new Promise(async function(resolve) {resolve({
        [WEBSOCKET_DATA] : {
          [DATA_ENDPOINT] : [
            { pk : 6,
              fields : {
                name : "test name",
                owner : 1,
                zip_code : null,
                address : null,
                city : null,
                phone : null,
              }
            }
          ]
        }
      })})),
      sendEditModel : jest.fn((message) => new Promise(async function(resolve) {resolve()})),
    };

    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);
    const endpointSelect = screen.getByLabelText('endpoint-select');

    await act(async () => {
      fireEvent.change(endpointSelect, {target : {value : "-1"}});
    });

    const endpointNameInput = screen.getByLabelText('endpoint-name');
    expect(endpointNameInput.value).toBe("Nyt");

    act(() => {
      fireEvent.change(endpointNameInput, {target : {value : "test name  "}});
    })

    expect(endpointNameInput.value).toBe("test name  ");

    const commitButton = screen.getByLabelText('commit-endpoint');

    await act(async () => {
      commitButton.click();
    });

    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_ENDPOINT,{
      id : -1,
      name : "test name",
      city : null,
      address : null,
      zip_code : null,
      phone : null,
      owner : 1
    });
  });

  it("Set Overhead Correct", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act(() => {
      fireEvent.change(screen.getByLabelText('overhead-input'),
      {target : { value : "44"}});
    });

    act(() => {
      fireEvent.click(screen.getByLabelText('commit-overhead'));
    });

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_TRACER_MAPPING, expect.objectContaining({
      endpoint : 1,
      tracer : 1,
      overhead_multiplier : 1.44
    }));
  });

  it("Set Overhead incorrect", () => {
    render(<StateContextProvider value={testState}>
      <WebsocketContextProvider value={websocket}>
        <CustomerModal {...props} />
      </WebsocketContextProvider>
    </StateContextProvider>);

    act(() => {
      fireEvent.change(screen.getByLabelText('overhead-input'),
      {target : { value : "4a4"}});
    });

    act(() => {
      fireEvent.click(screen.getByLabelText('commit-overhead'));
    });

    expect(websocket.sendEditModel).not.toHaveBeenCalled();
    expect(screen.getByLabelText('overhead-input')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
  });
});