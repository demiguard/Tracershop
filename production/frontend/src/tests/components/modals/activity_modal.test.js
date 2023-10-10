/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ActivityModal } from '~/components/modals/activity_modal.js'
import {  PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE,
  PROP_ACTIVE_TRACER, PROP_ORDER_MAPPING, PROP_OVERHEAD_MAP, PROP_TIME_SLOT_ID
} from "~/lib/constants.js";
import { DATA_ACTIVITY_ORDER, DATA_VIAL } from "~/lib/shared_constants.js"

import { AppState } from "../../app_state.js";
import { WebsocketContextProvider } from "~/components/tracer_shop_context.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const websocket_module = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;
let props = null;

const ORDER_MAPPING = new Map([
  [1, [AppState[DATA_ACTIVITY_ORDER].get(1)]]
])


beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");

  websocket = websocket_module.TracerWebSocket;

  props = {...AppState}
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
    render(
    <WebsocketContextProvider value={websocket}>
      <ActivityModal {...props}/>
    </WebsocketContextProvider>);

    expect(await screen.findByRole('button', {name : "Accepter Ordre"}))
    expect(await screen.findByLabelText('vial-usage-1')).toBeVisible();
    expect(screen.queryByLabelText('vial-usage-2')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-3')).toBeNull();
  });

  it("Standard Render Test status 2", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    expect(screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull()
    expect(screen.queryByLabelText('vial-usage-1')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-2')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-3')).toBeNull();
    expect(screen.queryByLabelText('vial-usage-4')).not.toBeNull();
  });


  it("Click - Accept Order", async () => {
    render(
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    const acceptButton = await screen.findByRole('button', {name : "Accepter Ordre"});

    act(() => {
      acceptButton.click()
    })

    //expect(websocket.sendEditModel).toBeCalled();
  });

  it("Use a vial", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    const vial = props[DATA_VIAL].get(4)
    const vialUsage = screen.queryByLabelText('vial-usage-4');

    act(() => {
      vialUsage.click()
    })

    expect(await screen.findByText(vial.activity)).toBeVisible()
  });

  it("Use a vial and stop using it ", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(
    <WebsocketContextProvider value={websocket}>
      <ActivityModal {...props}/>
    </WebsocketContextProvider>);

    const vial = props[DATA_VIAL].get(4)
    const vialUsage = screen.queryByLabelText('vial-usage-4');

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
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(
    <WebsocketContextProvider value={websocket}>
      <ActivityModal {...props}/>
    </WebsocketContextProvider>);

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
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(
    <WebsocketContextProvider value={websocket}>
      <ActivityModal {...props}/>
    </WebsocketContextProvider>);


    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click();
    })
    const stopAdding = await screen.findByLabelText('decline-new')
    await act(async () => {
      stopAdding.click()
    })
    expect(screen.queryByLabelText('lot_number-new')).toBeNull();
    expect(screen.queryByLabelText('fill_time-new')).toBeNull();
    expect(screen.queryByLabelText('volume-new')).toBeNull();
    expect(screen.queryByLabelText('activity-new')).toBeNull();
    expect(screen.queryByLabelText('accept-new')).toBeNull();
    expect(screen.queryByLabelText('decline-new')).toBeNull();
  });

  it("Create a new vial", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(<WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    const vialNew = await screen.findByLabelText("add-new-vial");

    await act(async () => {
      vialNew.click();
    })
    const lotNumberInput = screen.queryByLabelText('lot_number-new');
    const fillTimeInput = screen.queryByLabelText('fill_time-new');
    const volumeInput = screen.queryByLabelText('volume-new');
    const activityInput = screen.queryByLabelText('activity-new');

    await act(async () => {
      fireEvent.change(lotNumberInput, {target : { value : "fdg-200504-1"}});
      fireEvent.change(fillTimeInput, {target :{ value : "11:33:44"}});
      fireEvent.change(volumeInput, {target : {value : "13,44"}});;
      fireEvent.change(activityInput, {target : {value : "13665"}});
    })

    const accept = screen.queryByLabelText('accept-new');
    await act(async () => {
      accept.click();
    })

  });

  it("edit a vial success", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    const vialEdit = await screen.findByLabelText('edit-vial-4');

    act(() => {
      vialEdit.click()
    })

    await act(async () => {
      const lotForm= await screen.findByLabelText('lot_number-4');
      const fillTimeForm= await screen.findByLabelText('fill_time-4');
      const volumeForm= await screen.findByLabelText('volume-4');
      const activityForm= await screen.findByLabelText('activity-4');

      fireEvent.change(lotForm, {target : {value : "test-200511-1"}})
      fireEvent.change(fillTimeForm, {target : {value : "11:22:33"}})
      fireEvent.change(volumeForm, {target : {value : "13,49"}})
      fireEvent.change(activityForm, {target : {value : "578291"}})
    });

    await act(async () => {
      const acceptIcon = await screen.findByLabelText("vial-edit-accept-4")
      acceptIcon.click()
    });

    //expect(websocket.sendEditModel).toBeCalled()
  });

  it("edit a vial failed", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);

    render(
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    const vialEdit = await screen.findByLabelText('edit-vial-4');

    act(() => {
      vialEdit.click()
    })

    await act(async () => {
      const lotForm = await screen.findByLabelText('lot_number-4');
      const fillTimeForm = await screen.findByLabelText('fill_time-4');
      const volumeForm = await screen.findByLabelText('volume-4');
      const activityForm = await screen.findByLabelText('activity-4');

      fireEvent.change(lotForm, {target : {value : "not a batch number"}})
      fireEvent.change(fillTimeForm, {target : {value : "not time"}})
      fireEvent.change(volumeForm, {target : {value : "not volume"}})
      fireEvent.change(activityForm, {target : {value : "not activity"}})
    });

    await act(async () => {
      const acceptIcon = await screen.findByLabelText("vial-edit-accept-4")
      acceptIcon.click()
    });

    //expect(websocket.sendEditModel).not.toBeCalled();
    expect(await screen.findByText("Batch nr. er ikke formateret korrekt")).toBeVisible();
    expect(await screen.findByText("Produktions tidspunk er ikke formattet som et tidspunkt")).toBeVisible();
    expect(await screen.findByText("Volume er ikke et tal")).toBeVisible();
    expect(await screen.findByText("Aktiviten er ikke et tal")).toBeVisible();

  });

  it("free an order success", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);
    websocket = {
      getMessage : jest.fn((input) => {return { messageType : input}}),
      send : jest.fn(() => Promise.resolve({
        isAuthenticated : true
      })),
    }

    render(<WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    const vial = props[DATA_VIAL].get(4)
    const vialUsage = screen.queryByLabelText('vial-usage-4');

    act(() => {
      vialUsage.click();
    })

    const allocColumn = await screen.findByTestId('allocation-col');
    expect(allocColumn.innerHTML).toEqual(`${vial.activity} MBq`);

    const freeButton = await screen.findByRole('button', {name : "Godkend Ordre"});

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
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    props[PROP_ORDER_MAPPING] = new Map([
      [1, [AppState[DATA_ACTIVITY_ORDER].get(5)]]
    ]);
    websocket = {
      getMessage : jest.fn((input) => {return { messageType : input}}),
      send : jest.fn(() => Promise.resolve({
        isAuthenticated : false
      })),
    }

    render(<WebsocketContextProvider value={websocket}>
      <ActivityModal {...props}/>
    </WebsocketContextProvider>);

    const vial = props[DATA_VIAL].get(4)
    const vialUsage = screen.queryByLabelText('vial-usage-4');

    act(() => {
      vialUsage.click();
    })

    const allocColumn = await screen.findByTestId('allocation-col');
    expect(allocColumn.innerHTML).toEqual(`${vial.activity} MBq`);

    const freeButton = await screen.findByRole('button', {name : "Godkend Ordre"});

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
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26)
    render(
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    // Start editing the order
    await act(async () => {
      const editIcon = await screen.findByLabelText("edit-order-activity-1")
      editIcon.click();
    });
    // edit the order
    await act(async () => {
      const editForm = await screen.findByLabelText("edit-form-order-activity-1")
      fireEvent.change(editForm,{target :{ value : "59420"}});
    });
    // Accept the Edit
    await act(async () => {
      const editAccept = await screen.findByLabelText("edit-accept-order-activity-1")
      editAccept.click();
    });
  });

  it("Edit an order failed", async () => {
    props[PROP_ACTIVE_DATE] = new Date(2020,4,11,10,33,26);
    render(
      <WebsocketContextProvider value={websocket}>
        <ActivityModal {...props}/>
      </WebsocketContextProvider>);

    // Start editing the order
    await act(async () => {
      const editIcon = await screen.findByLabelText("edit-order-activity-1")
      editIcon.click();
    });
    // edit the order
    await act(async () => {
      const editForm = await screen.findByLabelText("edit-form-order-activity-1")
      fireEvent.change(editForm,{target :{ value : "a59420"}});
    });
    // Accept the Edit
    await act(async () => {
      const editAccept = await screen.findByLabelText("edit-accept-order-activity-1")
      editAccept.click();
    });
  });
});