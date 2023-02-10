/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CustomerModal } from '../../../components/modals/customer_modal.js'
import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

const onClose = jest.fn();

let websocket = null;
let container = null;

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop" }
  container = document.createElement("div");
  websocket = new tracer_websocket.TracerWebSocket();
});


afterEach(() => {
  cleanup();
  module.clearAllMocks()

  if(container != null) container.remove();
  container = null;
  websocket = null;
});

const customer1 = {
  ID : 1,
  Realname : "Realname Kunde 1",
  contact : "contant",
  tlf : "tlf", // this might be an int?
  email : "test@email.com",
  email2 : "",
  email3 : "",
  email4 : "",
  addr1 : "customer_1_add_1",
  addr2 : "customer_1_add_2",
  addr3 : "customer_1_add_3",
  addr4 : "customer_1_add_4",
  overhead : 50,
  username : "customer 1",
}

const deliverTimeMapping = new Map([
  [1, {
    DTID : 1,
    BID : 1,
    day : 1,
    dtime : "08:00:00",
    run : 1,
    repeat_t : 1,
  }],
  [2, {
    DTID : 2,
    BID : 1,
    day : 2,
    dtime : "08:00:00",
    run : 1,
    repeat_t : 1,
  }],
  [3, {
    DTID : 3,
    BID : 2,
    day : 2,
    dtime : "08:00:00",
    run : 1,
    repeat_t : 1,
  }],
])

const runs = new Map([
  [ 1, {
    PTID : 1,
    day : 1,
    run : 1,
    dtime : "07:00:00",
  }],
  [ 2, {
    PTID : 2,
    day : 1,
    run : 2,
    dtime : "11:00:00",
  }],
  [ 3, {
    PTID : 3,
    day : 2,
    run : 1,
    dtime : "07:00:00",
  }],
  [ 4, {
    PTID : 4,
    day : 2,
    run : 2,
    dtime : "11:00:00",
  }],
  [ 5, {
    PTID : 5,
    day : 3,
    run : 1,
    dtime : "07:00:00",
  }],
  [ 6, {
    PTID : 6,
    day : 3,
    run : 2,
    dtime : "11:00:00",
  }],
])


describe("Customer modal list", () => {
  it("standard render test", async () => {
    render(<CustomerModal
        onClose={onClose}
        activeCustomer={customer1}
        deliverTimes={deliverTimeMapping}
        runs={runs}
        websocket={websocket}
      />);

    expect(await screen.findByAltText("delete-delivertime-1")).toBeVisible();
    expect(await screen.findByLabelText('delivertime-day-1')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-dtime-1')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-run-1')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-repeat_t-1')).toBeVisible();

    expect(await screen.findByAltText("delete-delivertime-2")).toBeVisible();
    expect(await screen.findByLabelText('delivertime-day-2')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-dtime-2')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-run-2')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-repeat_t-2')).toBeVisible();

    expect(screen.queryByAltText("delete-delivertime-3")).toBeNull();
    expect(screen.queryByLabelText('delivertime-day-3')).toBeNull();
    expect(screen.queryByLabelText('delivertime-dtime-3')).toBeNull();
    expect(screen.queryByLabelText('delivertime-run-3')).toBeNull();
    expect(screen.queryByLabelText('delivertime-repeat_t-3')).toBeNull();

    expect(await screen.findByAltText("add-new-delivertime")).toBeVisible();
    expect(await screen.findByLabelText('delivertime-day-new')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-dtime-new')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-run-new')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-repeat_t-new')).toBeVisible();
  });

  it("Change day on deliver time 1", async () => {
    render(<CustomerModal
      onClose={onClose}
      activeCustomer={customer1}
      deliverTimes={deliverTimeMapping}
      runs={runs}
      websocket={websocket}
    />);

    const daySelect = await screen.findByLabelText('delivertime-day-1');
    fireEvent.change(daySelect, {target : {value : "3"}});

    // There is no on site update, relying on the fact that we get a value pushed from the server
    expect(daySelect.value).toBe("1");
    expect(websocket.getMessage).toBeCalled()
    expect(websocket.send).toBeCalled()
  });

  it("Delete deliverTime 1", async () => {
    render(<CustomerModal
      onClose={onClose}
      activeCustomer={customer1}
      deliverTimes={deliverTimeMapping}
      runs={runs}
      websocket={websocket}
    />);

    const deleteButton = await screen.findByAltText("delete-delivertime-1");
    fireEvent.click(deleteButton);

    expect(await screen.findByAltText("delete-delivertime-1")).toBeVisible();
    expect(await screen.findByLabelText('delivertime-day-1')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-dtime-1')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-run-1')).toBeVisible();
    expect(await screen.findByLabelText('delivertime-repeat_t-1')).toBeVisible();

    expect(websocket.getMessage).toBeCalled();
    expect(websocket.send).toBeCalled();
  });

  it("Create empty deliver time", async () => {
    render(<CustomerModal
      onClose={onClose}
      activeCustomer={customer1}
      deliverTimes={deliverTimeMapping}
      runs={runs}
      websocket={websocket}
    />);

    fireEvent.click(await screen.findByAltText("add-new-delivertime"));

    expect(await screen.findByText("Modtage tiden er ikke et tidspunkt")).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });
});

