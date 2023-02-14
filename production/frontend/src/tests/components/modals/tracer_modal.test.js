/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { TracerModal } from "../../../components/modals/tracer_modal.js"


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

const customers = new Map([[1, {
  UserName : "Customer 1",
  ID : 1,
  overhead : 20,
  kundenr : 2,
  Realname : "Kunde 1",
  email : "",
  email2 : "",
  email3 : "",
  email4 : "",
  contact : "",
  tlf : "",
  addr1 : "",
  addr2 : "",
  addr3 : "",
  addr4 : "",
}],[2, {
  UserName : "Customer 2",
  ID : 2,
  overhead : 50,
  kundenr : 3,
  Realname : "Kunde 2",
  email : "",
  email2 : "",
  email3 : "",
  email4 : "",
  contact : "",
  tlf : "",
  addr1 : "",
  addr2 : "",
  addr3 : "",
  addr4 : "",
}], [3, {
  UserName : "Customer 3",
  ID : 3,
  overhead : 50,
  kundenr : 4,
  Realname : "Kunde 3",
  email : "",
  email2 : "",
  email3 : "",
  email4 : "",
  contact : "",
  tlf : "",
  addr1 : "",
  addr2 : "",
  addr3 : "",
  addr4 : "",
}]]);

const tracerMapping = new Map([
  [1, {
    id : 1,
    customer_id : 1,
    tracer_id : 1
  }],
  [2, {
    id : 1,
    customer_id : 1,
    tracer_id : 2
  }],
])

describe("Tracer Modal test suite", () => {
  it("Standard Render test", () => {
    render(<TracerModal
      tracerID={1}
      customers={customers}
      tracerMapping={tracerMapping}
      websocket={websocket}
    />)

    expect(screen.queryByText("Customer 1")).toBeVisible();
    expect(screen.queryByText("Customer 2")).toBeVisible();
    expect(screen.queryByText("Customer 3")).toBeVisible();
  });

  it("Filter tests", async () => {
    render(<TracerModal
      tracerID={1}
      customers={customers}
      tracerMapping={tracerMapping}
      websocket={websocket}
    />)

    const filterInput = await screen.findByLabelText('input-filter')
    fireEvent.change(filterInput, {target : {value : "2" }})

    expect(screen.queryByText("Customer 1")).toBeNull();
    expect(screen.queryByText("Customer 2")).toBeVisible();
    expect(screen.queryByText("Customer 3")).toBeNull();
  });

  it("Filter tests", async () => {
    render(<TracerModal
      tracerID={1}
      customers={customers}
      tracerMapping={tracerMapping}
      websocket={websocket}
    />)

    const filterInput = await screen.findByLabelText('check-1')
    fireEvent.click(filterInput)

    expect(websocket.getMessage).toBeCalledTimes(1)
    expect(websocket.send).toBeCalledTimes(1)

    fireEvent.click(filterInput)

    expect(websocket.getMessage).toBeCalledTimes(2)
    expect(websocket.send).toBeCalledTimes(2)
  });
})