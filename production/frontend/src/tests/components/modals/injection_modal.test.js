/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { InjectionModal } from "../../../components/modals/injection_modal.js"

import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";

const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;

const onClose = jest.fn();

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
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

const order_status_1 = {
  BID: 1,
  n_injections : 2,

  status : 1,
  batchnr : "",
  anvendelse : 1,
  deliver_datetime : "2023-11-22 08:00:00",
  tracer : 2,
  username : "BAMD0001",
}

const order_status_2= {
  BID: 1,
  n_injections : 2,
  comment : "Test Comment",
  status : 2,
  batchnr : "",
  anvendelse : 1,
  deliver_datetime : "2023-11-22 08:00:00",
  tracer : 2,
  username : "BAMD0001",
}
const order_status_3 = {
  BID: 1,
  n_injections : 2,

  status : 3,
  batchnr : "test-111111-1",
  anvendelse : 1,
  deliver_datetime : "2023-11-22 08:00:00",
  tracer : 2,
}

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
}]]);

const isotopes = new Map([[1, {
  ID : 1,
  name : "TestIsotope",
  halflife: 6543,
}]]);

const tracers = new Map([[1,{
  id : 1,
  name : "Tracer",
  isotope : 1,
  n_injections : -1,
  order_block : -1,
  in_use : true,
  tracer_type : 1,
  longName : "Test Tracer",
}],[2, {
  id: 2,
  name: "Tracer_2",
  isotope: 1,
  n_injections: -1,
  order_block: -1,
  in_use: true,
  tracer_type: 1,
  longName: "Test Tracer 2",
}]]);

describe("Injection modal test suite", () =>{
  it("Standard Render test status 1", async () => {
    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_1}
      onClose={onClose}
      websocket={websocket}
    />)
    expect(await screen.findByRole('button', {name : "Accepter Ordre"})).toBeVisible();
    expect(await screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeNull();
    expect(await screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });
  it("Accept Order", async () => {
    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_1}
      onClose={onClose}
      websocket={websocket}
    />)
    fireEvent.click(await screen.findByRole('button', {name : "Accepter Ordre"}));

    expect(websocket.send).toBeCalled()
    expect(websocket.getMessage).toBeCalled()
  });

  it("Standard Render test status 2", async () => {
    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_2}
      onClose={onClose}
      websocket={websocket}
    />)
    expect(screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Start freeing empty Order", async () => {
    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_2}
      onClose={onClose}
      websocket={websocket}
    />)

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    expect(await screen.findByText("Batch nummeret er ikke i det korrekte format")).toBeVisible();
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Edit Freeing Order", async () => {
    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_2}
      onClose={onClose}
      websocket={websocket}
    />)

    fireEvent.change(await screen.findByLabelText("batchnr-input"), {target : {value : "test-111111-1"}});

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));

    fireEvent.click(screen.queryByRole('button', {name : "Rediger Ordre"}));
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Failed Freeing Freeing Order", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
          return new Promise(async function(resolve) {resolve({
            isAuthenticated : false
          })
        });
      })
    }

    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_2}
      onClose={onClose}
      websocket={ResolvingWebsocket}
    />);

    fireEvent.change(await screen.findByLabelText("batchnr-input"), {target : {value : "test-111111-1"}});

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));

    expect(await screen.findByText("Forkert Login")).toBeVisible();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Success Freeing Freeing Order", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
          return new Promise(async function(resolve) {resolve({
            isAuthenticated : true
          })
        });
      })
    }

    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_2}
      onClose={onClose}
      websocket={ResolvingWebsocket}
    />);

    fireEvent.change(await screen.findByLabelText("batchnr-input"), {target : {value : "test-111111-1"}});

    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));
    fireEvent.click(screen.queryByRole('button', {name : "Frigiv Ordre"}));

    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

  it("Standard Render test status 3", async () => {
    render(<InjectionModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={order_status_3}
      onClose={onClose}
      websocket={websocket}
    />)
    expect( screen.queryByRole('button', {name : "Accepter Ordre"})).toBeNull();
    expect( screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeNull();
    expect( screen.queryByRole('button', {name : "Rediger Ordre"})).toBeNull();
    expect(await screen.findByRole('button', {name : "Luk"})).toBeVisible();
  });

})