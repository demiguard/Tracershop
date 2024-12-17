/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest, test } from '@jest/globals'

import { ActivityModal, WRONG_DATE_WARNING_MESSAGE } from '~/components/modals/activity_modal.js'
import {  ERROR_BACKGROUND_COLOR, ORDER_STATUS, PROP_ACTIVE_DATE,
  PROP_ACTIVE_TRACER, PROP_ORDER_MAPPING, PROP_TIME_SLOT_ID, PROP_TRACER_CATALOG
} from "~/lib/constants.js";
import { AUTH_PASSWORD, AUTH_USERNAME, DATA_ACTIVITY_ORDER, DATA_AUTH, DATA_VIAL, WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js"

import { testState } from "../../app_state.js";
import { StateContextProvider, WebsocketContextProvider } from "~/contexts/tracer_shop_context.js";
import { TracerCatalog } from "~/lib/data_structures.js";
import { OrderMapping } from "~/lib/data_structures/order_mapping.js";
import { applyFilter, dailyActivityOrderFilter } from "~/lib/filters.js";
import { ActivityOrder, TracershopState, Vial } from "~/dataclasses/dataclasses.js";
import { toMapping } from "~/lib/utils.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const websocket_module = require("../../../lib/tracer_websocket.js");

const today_string = "2020-05-04";
const active_tracer = 1;
const tracer_catalog = new TracerCatalog(testState.tracer_mapping, testState.tracer);

const nowMock = new Date(2020,4,4,10,33,26);


const websocket = websocket_module.TracerWebSocket;
const todays_orders = applyFilter(testState.activity_orders,
  dailyActivityOrderFilter(testState.deliver_times,
                      testState.production,
                      today_string,
                      1));
const props = {
  [PROP_ACTIVE_DATE] : nowMock,
  [PROP_ACTIVE_TRACER] : 1,
  [PROP_ORDER_MAPPING] : new OrderMapping(todays_orders,
    today_string,
    tracer_catalog,
    active_tracer,
    testState
  ),
  [PROP_TIME_SLOT_ID] : 1,
  [PROP_TRACER_CATALOG] : tracer_catalog,
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(nowMock)
});

afterEach(() => {
  cleanup();
  module.clearAllMocks()
});

describe("Activity Modal Test", () => {
  it("Standard Render Test status 1", () => {
    const newOrders = [new ActivityOrder(
      1, 1000, today_string, ORDER_STATUS.ORDERED, "Test Comment", 1, null, null, 1, null
    )];

    const customState = new TracershopState();
    Object.assign(customState, testState);
    customState.activity_orders = toMapping(newOrders);

    const props = {
      [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,33,26),
      [PROP_ACTIVE_TRACER] : 1,
      [PROP_ORDER_MAPPING] : new OrderMapping(
        newOrders,
        today_string,
        tracer_catalog,
        active_tracer,
        customState),
      [PROP_TIME_SLOT_ID] : 1,
      [PROP_TRACER_CATALOG] : new TracerCatalog(customState.tracer_mapping, customState.tracer),
    }

    render(
      <StateContextProvider value={customState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    expect(screen.getByRole('button', {name : "Accepter"})).toBeVisible();

    expect(screen.queryByLabelText('vial-usage-2')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-3')).toBeNull();
  });

  it("Standard Render Test status 2", () => {
    const other_date_string = "2020-05-11";

    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               other_date_string,
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
      other_date_string, tracer_catalog, active_tracer, testState);
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


  it("Click - Accept Order", () => {
    const newOrders = [new ActivityOrder(
      1, 1000, "2020-05-04", ORDER_STATUS.ORDERED, "Test Comment", 1, null, null, 1, null
    ), new ActivityOrder(
      2, 1000, "2020-05-04", ORDER_STATUS.ORDERED, "Test Comment", 1, null, null, 1, null
    ), new ActivityOrder(
      3, 1000, "2020-05-04", ORDER_STATUS.ORDERED, "Test Comment", 1, null, null, 1, null
    )];

    const customState = new TracershopState();
    Object.assign(customState, testState);
    customState.activity_orders = toMapping(newOrders);

    const props = {
      [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,33,26),
      [PROP_ACTIVE_TRACER] : 1,
      [PROP_ORDER_MAPPING] : new OrderMapping(newOrders, today_string, tracer_catalog, active_tracer, customState),
      [PROP_TIME_SLOT_ID] : 1,
      [PROP_TRACER_CATALOG] : new TracerCatalog(customState.tracer_mapping, customState.tracer),
    }

    render(
      <StateContextProvider value={customState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    act(() => {
      screen.getByRole('button', {name : "Accepter"}).click();
    })

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER, [
      expect.objectContaining({ status : ORDER_STATUS.ACCEPTED }),
      expect.objectContaining({ status : ORDER_STATUS.ACCEPTED }),
      expect.objectContaining({ status : ORDER_STATUS.ACCEPTED }),
    ]);
  });

  it("Use a vial", () => {
    const status_order_date = "2020-05-11";

    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               status_order_date,
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(todays_orders,
      status_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vial = testState.vial.get(4);

    act(() => {
      screen.getByLabelText('vial-usage-7').click();
    })

    expect(screen.getAllByText(vial.activity + " MBq").length).toBeGreaterThanOrEqual(2);
  });

  it("Use a vial and stop using it ", () => {
    const status_2_order_date = "2020-05-11";
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          status_2_order_date,
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vial = testState.vial.get(7);

    act(() => {
      screen.getByLabelText('vial-usage-7').click();
    });

    expect(screen.getAllByText(`${vial.activity} MBq` ).length).toBeGreaterThanOrEqual(2);

    act(() => {
      screen.getByLabelText('vial-usage-7').click();
    });

    // To do assert this
  });

  it("start creating a new vial", async () => {
    const status_2_order_date = "2020-05-11";

    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          status_2_order_date,
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState);

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    act(() => {
      screen.getByLabelText("add-new-vial").click();
    });

    expect(await screen.findByLabelText('lot_number--1')).toBeVisible();
    expect(await screen.findByLabelText('fill_time--1')).toBeVisible();
    expect(await screen.findByLabelText('volume--1')).toBeVisible();
    expect(await screen.findByLabelText('activity--1')).toBeVisible();
    expect(await screen.findByLabelText('vial-commit--1')).toBeVisible();
    expect(await screen.findByLabelText('vial-edit-decline--1')).toBeVisible();
  });

  it("start and stop creating a new vial", async () => {
    const status_2_order_date = "2020-05-11";
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               status_2_order_date,
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26);
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    act(() => {
      screen.getByLabelText("add-new-vial").click();
    });

    act(() => {
      screen.getByLabelText('vial-edit-decline--1').click();
    });

    expect(screen.queryByLabelText('lot_number--1')).toBeNull();
    expect(screen.queryByLabelText('fill_time--1')).toBeNull();
    expect(screen.queryByLabelText('volume--1')).toBeNull();
    expect(screen.queryByLabelText('activity--1')).toBeNull();
    expect(screen.queryByLabelText('vial-commit--1')).toBeNull();
    expect(screen.queryByLabelText('vial-edit-decline--1')).toBeNull();
  });

  it("Create a new vial", async () => {
    const status_2_order_date = "2020-05-11";
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               status_2_order_date,
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState);

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

  it("Edit a vial success", async () => {
    const status_2_order_date = "2020-05-11";

    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          status_2_order_date,
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    act(() => {
      screen.getByLabelText('edit-vial-7').click();
    })

    act(() => {
      const lotForm = screen.getByLabelText('lot_number-7');
      fireEvent.change(lotForm, {target : {value : "test-200511-1"}});
    });

    act(() => {
      const fillTimeForm = screen.getByLabelText('fill_time-7');
      fireEvent.change(fillTimeForm, {target : {value : "11:22:33"}})
    });

    act(() => {
      const volumeForm = screen.getByLabelText('volume-7');
      fireEvent.change(volumeForm, {target : {value : "13,49"}})
    });

    act(() => {
      const activityForm = screen.getByLabelText('activity-7');
      fireEvent.change(activityForm, {target : {value : "578291"}})
    });

    await act(async () => {
      screen.getByLabelText("vial-commit-7").click();
    });

    expect(websocket.sendEditModel).toHaveBeenCalled();
  });

  it("edit a vial failed", async () => {
    const status_2_order_date = "2020-05-11"
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                          testState.production,
                          status_2_order_date,
                          1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

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
      screen.getByLabelText("vial-commit-7").click()
    });

    expect(websocket.sendEditModel).not.toHaveBeenCalled();
    expect(screen.getByLabelText('lot_number-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    expect(screen.getByLabelText('fill_time-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    expect(screen.getByLabelText('volume-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});
    expect(screen.getByLabelText('activity-7')).toHaveStyle({background : ERROR_BACKGROUND_COLOR});

  });

  it("Select and unselect, then assert you can't free", async () => {
    const status_2_order_date = "2020-05-11";

    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                               testState.production,
                               status_2_order_date,
                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

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
    const status_2_order_date = "2020-05-11";
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               status_2_order_date,
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState);

    const websocket = {
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

    expect(screen.getByText(WRONG_DATE_WARNING_MESSAGE)).toBeVisible();

    await act(async () => {
      const usernameInput = await screen.findByLabelText('username')
      const passwordInput = await screen.findByLabelText('password')

      fireEvent.change(usernameInput, {target : { value : "Username"}})
      fireEvent.change(passwordInput, {target : { value : "password"}})

      const freeButton = await screen.findByRole('button', {name : "Frigiv Ordre"});
      freeButton.click()
    });
  });

  it("free an order at the date", async () => {
    const todays_orders = [new ActivityOrder(1, 10000, today_string, ORDER_STATUS.ACCEPTED, null, 1, null, null, 1, null)]
    const newState = new TracershopState();
    Object.assign(newState, testState);
    newState.activity_orders = toMapping(todays_orders);

    props[PROP_ACTIVE_DATE] = nowMock
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      today_string,
      tracer_catalog,
      active_tracer,
      newState);

    const websocket = {
      getMessage : jest.fn((input) => {return { messageType : input}}),
      send : jest.fn(() => Promise.resolve({
        isAuthenticated : true
      })),
    }

    render(
      <StateContextProvider value={newState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const vial = newState.vial.get(9);

    act(() => {
      screen.getByLabelText('vial-usage-9').click();
    })

    expect(screen.getByTestId('allocation-col').innerHTML).toEqual(`${vial.activity} MBq`);

    act(() => {
      screen.getByRole('button', {name : "Godkend"}).click();
    });

    expect(screen.queryByText(WRONG_DATE_WARNING_MESSAGE)).toBeNull();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('username'), {target : { value : "Username"}});
      fireEvent.change(screen.getByLabelText('password'), {target : { value : "Password"}});
      screen.getByRole('button', {name : "Frigiv Ordre"}).click();
    });

    expect(websocket.send).toHaveBeenCalledWith(expect.objectContaining({
      [DATA_AUTH] : expect.objectContaining({
        [AUTH_USERNAME] : "Username",
        [AUTH_PASSWORD] : "Password"
      })
    }))
  });

  it("free an order Failed", async () => {
    const status_2_order_date = "2020-05-11";

    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               status_2_order_date,
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26);
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

    const websocket = {
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

    expect(websocket.send).toHaveBeenCalledWith(
      expect.objectContaining({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
      })
    )
  });

  it("Edit an order successfully", async () => {
    const status_2_order_date = "2020-05-11";
    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               status_2_order_date,
                                                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    // Start editing the order
    act(() => {screen.getByLabelText("edit-order-activity-5").click()});
    // edit the order
    act(() => {
      fireEvent.change(
        screen.getByLabelText("edit-form-order-activity-5"),
        {target :{ value : "59420"}}
      );
    });
    // Accept the Edit
    await act(async () => {
      screen.getByLabelText("edit-accept-order-activity-5").click()
    });

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER,
      expect.objectContaining({
        ordered_activity : 59420
      })
    );
  });

  it("Edit an order failed", async () => {
    const status_2_order_date = "2020-05-11";

    const todays_orders = applyFilter(testState.activity_orders,
                                      dailyActivityOrderFilter(testState.deliver_times,
                                                               testState.production,
                                                               status_2_order_date,
                                                               1));

    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      status_2_order_date,
      tracer_catalog,
      active_tracer,
      testState
    );

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

  it("cancel, then stop canceling, then cancel that an order", () => {
    const other_today_string = "2020-05-11";
    const todays_orders = applyFilter(testState.activity_orders,
      dailyActivityOrderFilter(testState.deliver_times,
                               testState.production,
                               other_today_string,
                               1));
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new OrderMapping(
      todays_orders,
      other_today_string,
      tracer_catalog,
      active_tracer,
      testState
    );

    render(
      <StateContextProvider value={testState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    act(() => {
      screen.getByRole('button', {name : 'Afvis'}).click();
    });

    expect(screen.getByText("Vil du afvise?")).toBeVisible();
    act(() => { screen.getByTestId("CancelBoxBack").click(); });
    expect(screen.queryByText("Vil du afvise?")).toBeNull();
    // Delete for real
    act(() => {
      screen.getByRole('button', {name : 'Afvis'}).click();
    });

    act(() => {
      screen.getByTestId("CancelBoxCancel").click();
    });

    expect(websocket.sendEditModel).toHaveBeenCalledWith(DATA_ACTIVITY_ORDER,[
      expect.objectContaining({status : ORDER_STATUS.CANCELLED})
    ])
  });

  it("Update vial from state",() => {
    const newOrders = [new ActivityOrder(
      1, 1000, "2020-05-04", ORDER_STATUS.ORDERED, "Test Comment", 1, null, null, 1, null
    )];

    const customState = new TracershopState();
    Object.assign(customState, testState);
    customState.activity_orders = toMapping(newOrders);

    const props = {
      [PROP_ACTIVE_DATE] : new Date(2020,4,4,10,33,26),
      [PROP_ACTIVE_TRACER] : 1,
      [PROP_ORDER_MAPPING] : new OrderMapping(
        todays_orders,
        today_string,
        tracer_catalog,
        active_tracer,
        customState
      ),
      [PROP_TIME_SLOT_ID] : 1,
      [PROP_TRACER_CATALOG] : new TracerCatalog(customState.tracer_mapping, customState.tracer),
    }
    const {rerender} = render(
      <StateContextProvider value={customState}>
        <WebsocketContextProvider value={websocket}>
          <ActivityModal {...props}/>
        </WebsocketContextProvider>
      </StateContextProvider>);

    const newState = new TracershopState();
    Object.assign(newState, customState);

    const newVials = [
      new Vial(10, 1, 10000, 10.01, "TEST-200504-1", "07:43:11", today_string, null, 1),
      new Vial(11, 1, 11000, 10.01, "TEST-200504-1", "07:43:11", today_string, null, 1),
      new Vial(12, 1, 13000, 10.01, "TEST-200504-1", "07:43:11", today_string, null, 1),
    ]

    newState.vial = toMapping(newVials);

    const updated_props = {
      [PROP_ACTIVE_DATE] : nowMock,
      [PROP_ACTIVE_TRACER] : 1,
      [PROP_ORDER_MAPPING] : new OrderMapping(
        todays_orders,
        today_string,
        tracer_catalog,
        active_tracer,
        newState),
      [PROP_TIME_SLOT_ID] : 1,
      [PROP_TRACER_CATALOG] : new TracerCatalog(newState.tracer_mapping, newState.tracer),
    }

    rerender(<StateContextProvider value={newState}>
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...updated_props}/>
      </WebsocketContextProvider>
    </StateContextProvider>);

    expect(screen.getByTestId("vial-id-10")).toBeVisible();
    expect(screen.getByTestId("vial-id-11")).toBeVisible();
    expect(screen.getByTestId("vial-id-12")).toBeVisible();
  });
});
