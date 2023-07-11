/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ActivityModal } from '../../../components/modals/activity_modal.js'
import { JSON_ACTIVITY_ORDER, JSON_VIAL, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_ACTIVE_TRACER, PROP_ORDER_MAPPING, PROP_OVERHEAD_MAP, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";
import { AppState } from "../../helpers.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

const ORDER_MAPPING = new Map([
  [1, [AppState[JSON_ACTIVITY_ORDER].get(1)]]
])


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
  props = {...AppState}
  props[PROP_WEBSOCKET] = websocket
  props[PROP_ACTIVE_CUSTOMER] = 1
  props[PROP_ORDER_MAPPING] = ORDER_MAPPING
  props[PROP_TIME_SLOT_ID] = 1
  props[PROP_ACTIVE_DATE] = new Date(2020,4,4,10,33,26)
  props[PROP_OVERHEAD_MAP] = new Map([
    [1, 1.25],
    [2, 1.5],
    [3, 2],
  ])
  props[PROP_ACTIVE_TRACER] = 1
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
    render(<ActivityModal
        {...props}
    />);

    expect(await screen.findByRole('button', {name : "Accepter Ordre"}))
    expect(await screen.findByLabelText('vial-usage-1')).toBeVisible();
    expect(await screen.queryByLabelText('vial-usage-2')).toBeNull();
    expect(await screen.queryByLabelText('vial-usage-3')).toBeNull();
  });

  it("Standard Render Test status 2", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    expect(await screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull()
    expect(await screen.queryByLabelText('vial-usage-1')).toBeNull();
    expect(await screen.queryByLabelText('vial-usage-2')).toBeNull();
    expect(await screen.queryByLabelText('vial-usage-3')).toBeNull();
    expect(await screen.queryByLabelText('vial-usage-4')).not.toBeNull();
  });


  it("Click - Accept Order", async () => {
    render(<ActivityModal
        {...props}
    />);

    const acceptButton = await screen.findByRole('button', {name : "Accepter Ordre"});

    act(() => {
      acceptButton.click()
    })

    expect(websocket.sendEditModel).toBeCalled();
  });

  it("Use a vial", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    const vial = props[JSON_VIAL].get(4)
    const vialUsage = await screen.queryByLabelText('vial-usage-4');

    act(() => {
      vialUsage.click()
    })

    expect(await screen.findByText(vial.activity)).toBeVisible()
  });

  it("Use a vial and stop using it ", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    const vial = props[JSON_VIAL].get(4)
    const vialUsage = await screen.queryByLabelText('vial-usage-4');

    act(() => {
      vialUsage.click()
    })

    expect(await screen.findByText(vial.activity)).toBeVisible();

    act(() => {
      vialUsage.click()
    })

    // To do assert this
  });


  it("start creating a new vial", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click()
    })

    expect(await screen.findByLabelText('lot_number-new')).toBeVisible()
    expect(await screen.findByLabelText('fill_time-new')).toBeVisible()
    expect(await screen.findByLabelText('volume-new')).toBeVisible()
    expect(await screen.findByLabelText('activity-new')).toBeVisible()
    expect(await screen.findByLabelText('accept-new')).toBeVisible()
    expect(await screen.findByLabelText('decline-new')).toBeVisible()
  });

  it("start and stop creating a new vial", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click();
    })
    const stopAdding = await screen.findByLabelText('decline-new')
    await act(async () => {
      stopAdding.click()
    })
    expect(await screen.queryByLabelText('lot_number-new')).toBeNull();
    expect(await screen.queryByLabelText('fill_time-new')).toBeNull();
    expect(await screen.queryByLabelText('volume-new')).toBeNull();
    expect(await screen.queryByLabelText('activity-new')).toBeNull();
    expect(await screen.queryByLabelText('accept-new')).toBeNull();
    expect(await screen.queryByLabelText('decline-new')).toBeNull();
  });

  it("Create a new vial", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click();
    })
    const lotNumberInput = await screen.queryByLabelText('lot_number-new');
    const fillTimeInput = await screen.queryByLabelText('fill_time-new');
    const volumeInput = await screen.queryByLabelText('volume-new');
    const activityInput = await screen.queryByLabelText('activity-new');

    await act(async () => {
      fireEvent.change(lotNumberInput, {target : { value : "fdg-200504-1"}});
      fireEvent.change(fillTimeInput, {target :{ value : "11:33:44"}});
      fireEvent.change(volumeInput, {target : {value : "13,44"}});;
      fireEvent.change(activityInput, {target : {value : "13665"}});
    })

    const accept = await screen.queryByLabelText('accept-new');
    await act(async () => {
      accept.click();
    })

  });

  it("edit a vial", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    const vialEdit = await screen.findByLabelText('edit-vial-4');

    await act(async () => {
      vialEdit.click()
    })

    expect(await screen.findByLabelText('lot_number-4')).toBeVisible()
    expect(await screen.findByLabelText('fill_time-4')).toBeVisible()
    expect(await screen.findByLabelText('volume-4')).toBeVisible()
    expect(await screen.findByLabelText('activity-4')).toBeVisible()
  });

  it("Start freeing", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[JSON_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<ActivityModal
        {...props}
    />);

    const vial = props[JSON_VIAL].get(4)
    const vialUsage = await screen.queryByLabelText('vial-usage-4');

    await act( async () => {
      vialUsage.click();
    })

    const freeButton = await screen.findByRole('button', {name : "Godkend Ordre"});

    act(() => {
      freeButton.click()
    })
  })

})