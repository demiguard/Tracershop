/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ActivityModal } from '~/components/modals/activity_modal.js'
import {  ERROR_BACKGROUND_COLOR, ORDER_STATUS, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE,
  PROP_ACTIVE_TRACER, PROP_ORDER_MAPPING, PROP_OVERHEAD_MAP, PROP_TIME_SLOT_ID, PROP_TRACER_CATALOG
} from "~/lib/constants.js";
import { DATA_ACTIVITY_ORDER, DATA_VIAL } from "~/lib/shared_constants.js"

import { AppState, testState } from "../../app_state.js";
import { StateContextProvider, WebsocketContextProvider } from "~/components/tracer_shop_context.js";
import { OrderMapping, TracerCatalog } from "~/lib/data_structures.js";
import { applyFilter, dailyActivityOrderFilter } from "~/lib/filters.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const websocket_module = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;


const todays_orders = applyFilter(testState.activity_orders,
                                  dailyActivityOrderFilter(testState.deliver_times,
                                                      testState.production,
                                                      "2020-05-04",
                                                      1))

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");

  websocket = websocket_module.TracerWebSocket;

  props = {
    [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,33,26),
    [PROP_ACTIVE_TRACER] : 1,
    [PROP_ORDER_MAPPING] : new OrderMapping(todays_orders,
                                            testState.deliver_times,
                                            testState.delivery_endpoint),
    [PROP_TIME_SLOT_ID] : 1,
    [PROP_TRACER_CATALOG] : new TracerCatalog(testState.tracer_mapping, testState.tracer),
  }
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()
  if(container != null) container.remove();
  container = null;
  websocket = null;
  props = null;

});



describe("Activity Modal Test", () => {
  it("Standard Render Test status 1", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    expect(await screen.findByRole('button', {name : "Accepter"}))
    expect(await screen.findByLabelText('vial-usage-1')).toBeVisible();
    expect(screen.queryByLabelText('vial-usage-2')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-3')).toBeNull();
  });

  it("Standard Render Test status 2", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                  testState.deliver_times,
                                                 testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    expect(screen.queryByRole('button', {name : "Accepter"})).toBeNull()
    expect(screen.queryByLabelText('vial-usage-1')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-2')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-3')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-4')).toBeNull();
  });


  it("Click - Accept Order", async () => {
    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    act(() => {
      screen.getByRole('button', {name : "Accepter"}).click()
    })

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER, [
      expect.objectContaining({ status : ORDER_STATUS.ACCEPTED }),
      expect.objectContaining({ status : ORDER_STATUS.ACCEPTED }),
      expect.objectContaining({ status : ORDER_STATUS.ACCEPTED }),
    ]);
  });

  it("Use a vial", () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vial = testState.vial.get(4)
    const vialUsage = screen.queryByLabelText('vial-usage-7');

    act(() => {
      vialUsage.click();
    })

    expect(screen.getAllByText(vial.activity + " MBq").length).toBeGreaterThanOrEqual(2);
  });

  it("Use a vial and stop using it ", () => {
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          "2020-05-11",
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
      testState.deliver_times,
      testState.delivery_endpoint),

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vial = testState.vial.get(7)
    const vialUsage = screen.getByLabelText('vial-usage-7');

    act(() => {
      vialUsage.click();
    });

    expect(screen.getAllByText(`${vial.activity} MBq` ).length).toBeGreaterThanOrEqual(2);

    act(() => {
      vialUsage.click();
    });

    // To do assert this
  });


  it("start creating a new vial", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          "2020-05-11",
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
      testState.deliver_times,
      testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click();
    });

    expect(await screen.findByLabelText('lot_number--1')).toBeVisible();
    expect(await screen.findByLabelText('fill_time--1')).toBeVisible();
    expect(await screen.findByLabelText('volume--1')).toBeVisible();
    expect(await screen.findByLabelText('activity--1')).toBeVisible();
    expect(await screen.findByLabelText('vial-commit--1')).toBeVisible();
    expect(await screen.findByLabelText('vial-edit-decline--1')).toBeVisible();
  });

  it("start and stop creating a new vial", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26);
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint);

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);


    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click();
    })
    const stopAdding = await screen.findByLabelText('vial-edit-decline--1');
    await act(async () => {
      stopAdding.click();
    });
    expect(screen.queryByLabelText('lot_number--1')).toBeNull();
    expect(screen.queryByLabelText('fill_time--1')).toBeNull();
    expect(screen.queryByLabelText('volume--1')).toBeNull();
    expect(screen.queryByLabelText('activity--1')).toBeNull();
    expect(screen.queryByLabelText('vial-commit--1')).toBeNull();
    expect(screen.queryByLabelText('vial-edit-decline--1')).toBeNull();
  });

  it("Create a new vial", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click();
    })
    const lotNumberInput = screen.queryByLabelText('lot_number--1');
    const fillTimeInput = screen.queryByLabelText('fill_time--1');
    const volumeInput = screen.queryByLabelText('volume--1');
    const activityInput = screen.queryByLabelText('activity--1');

    await act(async () => {
      fireEvent.change(lotNumberInput, {target : { value : "fdg-200504-1"}});
      fireEvent.change(fillTimeInput, {target :{ value : "11:33:44"}});
      fireEvent.change(volumeInput, {target : {value : "13,44"}});;
      fireEvent.change(activityInput, {target : {value : "13665"}});
    })

    const accept = screen.queryByLabelText('vial-commit--1');
    await act(async () => {
      accept.click();
    });

    // Assert
    expect(websocket.sendCreateModel).toHaveBeenCalledWith(DATA_VIAL,
      expect.objectContaining({
        lot_number : "fdg-200504-1",
        volume : 13.44,
        fill_date : "2020-05-11",
        fill_time : "11:33:44",
        tracer : 1,
        assigned_to : null,
        owner : 1,
        activity : 13665
      }));
    });

  it("edit a vial success", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          "2020-05-11",
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
      testState.deliver_times,
      testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vialEdit = screen.getByLabelText('edit-vial-7');

    act(() => {
      vialEdit.click()
    })

    await act(async () => {
      const lotForm= await screen.findByLabelText('lot_number-7');
      const fillTimeForm= await screen.findByLabelText('fill_time-7');
      const volumeForm= await screen.findByLabelText('volume-7');
      const activityForm= await screen.findByLabelText('activity-7');

      fireEvent.change(lotForm, {target : {value : "test-200511-1"}})
      fireEvent.change(fillTimeForm, {target : {value : "11:22:33"}})
      fireEvent.change(volumeForm, {target : {value : "13,49"}})
      fireEvent.change(activityForm, {target : {value : "578291"}})
    });

    await act(async () => {
      const acceptIcon = await screen.findByLabelText("vial-commit-7");
      acceptIcon.click();
    });

    expect(websocket.sendEditModel).toHaveBeenCalled();
  });

  it("edit a vial failed", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          "2020-05-11",
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    await act(async () => {
      screen.getByLabelText('edit-vial-7').click();
    });

    await act(async () => {
      const lotForm = screen.getByLabelText('lot_number-7');
      const fillTimeForm = screen.getByLabelText('fill_time-7');
      const volumeForm = screen.getByLabelText('volume-7');
      const activityForm = screen.getByLabelText('activity-7');

      fireEvent.change(lotForm, {target : {value : "not a batch number"}})
      fireEvent.change(fillTimeForm, {target : {value : "not time"}})
      fireEvent.change(volumeForm, {target : {value : "not volume"}})
      fireEvent.change(activityForm, {target : {value : "not activity"}})
    });

    await act(async () => {
      const acceptIcon = await screen.findByLabelText("vial-commit-7")
      acceptIcon.click();
    });

    expect(websocket.sendEditModel).not.toHaveBeenCalled();
    expect(screen.getByLabelText('lot_number-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    expect(screen.getByLabelText('fill_time-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    expect(screen.getByLabelText('volume-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    expect(screen.getByLabelText('activity-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});

  });

  it("Select and unselect, then assert you can't free", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                               testState.production,
                               "2020-05-11",
                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint);

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    // Click
    await act(async () => {
      screen.queryByLabelText('vial-usage-7').click();
    });
    // And click again

    await act(async () => {
      screen.queryByLabelText('vial-usage-7').click();
    });

    expect(screen.getByRole('button', {'name' : "Godkend"})).toBeDisabled()
  })

  it("free an order success", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint)

    websocket = {
      getMessage : jest.fn((input) => {return { messageType : input}}),
      send : jest.fn(() => Promise.resolve({
        isAuthenticated : true
      })),
    }

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vial = testState.vial.get(7)
    const vialUsage = screen.queryByLabelText('vial-usage-7');

    act(() => {
      vialUsage.click();
    })

    const allocColumn = await screen.findByTestId('allocation-col');
    expect(allocColumn.innerHTML).toEqual(`${vial.activity} MBq`);

    const freeButton = await screen.findByRole('button', {name : "Godkend"});

    act(() => {
      freeButton.click()
    });

    await act(async () => {
      const usernameInput = await screen.findByLabelText('username')
      const passwordInput = await screen.findByLabelText('password')

      fireEvent.change(usernameInput, {target : { value : "Username"}})
      fireEvent.change(passwordInput, {target : { value : "password"}})

      const freeButton = await screen.findByRole('button', {name : "Frigiv Ordre"});
      freeButton.click()
    });
  });

  it("free an order Failed", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26);
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint);

    websocket = {
      getMessage : jest.fn((input) => {return { messageType : input}}),
      send : jest.fn(() => Promise.resolve({
        isAuthenticated : false
      })),
    }

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vial = testState.vial.get(7);
    const vialUsage = screen.queryByLabelText('vial-usage-7');

    act(() => {
      vialUsage.click();
    })

    const allocColumn = await screen.findByTestId('allocation-col');
    expect(allocColumn.innerHTML).toEqual(`${vial.activity} MBq`);

    const freeButton = await screen.findByRole('button', {name : "Godkend"});

    act(() => {
      freeButton.click()
    });

    await act(async () => {
      const usernameInput = await screen.findByLabelText('username')
      const passwordInput = await screen.findByLabelText('password')

      fireEvent.change(usernameInput, {target : { value : "Username"}})
      fireEvent.change(passwordInput, {target : { value : "password"}})

      const freeButton = await screen.findByRole('button', {name : "Frigiv Ordre"});
      freeButton.click()
    });
  });

  it("Edit an order successfully", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    // Start editing the order
    await act(async () => {
      const editIcon = await screen.findByLabelText("edit-order-activity-5")
      editIcon.click();
    });
    // edit the order
    await act(async () => {
      const editForm = await screen.findByLabelText("edit-form-order-activity-5")
      fireEvent.change(editForm,{target :{ value : "59420"}});
    });
    // Accept the Edit
    await act(async () => {
      const editAccept = await screen.findByLabelText("edit-accept-order-activity-5")
      editAccept.click();
    });
  });

  it("Edit an order failed", async () => {
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               "2020-05-11",
                                                               1));

    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
                                                 testState.deliver_times,
                                                 testState.delivery_endpoint)

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    // Start editing the order
    await act(async () => {
      screen.getByLabelText("edit-order-activity-5").click()
    });
    // edit the order
    await act(async () => {
      const editForm = screen.getByLabelText("edit-form-order-activity-5")
      fireEvent.change(editForm,{target :{ value : "a59420"}});
    });
    expect(websocket.sendEditModel).not.toHaveBeenCalled();
    // Accept the Edit
    await act(async () => {
      screen.getByLabelText("edit-accept-order-activity-5").click();
    });
    expect(websocket.sendEditModel).not.toHaveBeenCalled();
    expect(screen.getByLabelText('edit-form-order-activity-5')).toHaveStyle({
      background : ERROR_BACKGROUND_COLOR
    });

    await act(async () => {
      fireEvent.mouseEnter(screen.getByLabelText('edit-form-order-activity-5'));
    });

    expect(screen.getByText('Aktiviteten er ikke et tal')).toBeVisible();
  });


  });