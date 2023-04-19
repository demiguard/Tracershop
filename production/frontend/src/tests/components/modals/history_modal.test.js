/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { HistoryModal } from "../../../components/modals/history_modal.js";


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

const customer = {
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
};

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
  tracer_type: 2,
  longName: "Test Tracer 2",
}], [3, {
  id: 3,
  name: "Tracer_3",
  isotope: 1,
  n_injections: -1,
  order_block: -1,
  in_use: true,
  tracer_type: 2,
  longName: "Test Tracer 3",
}]]);


describe("History modal test suite", () =>{
  it("Standard Render test", () => {
    render(<HistoryModal
    activeCustomer={customer}
    onClose={onClose}
    tracers={tracers}
    websocket={websocket}
    />);
  });

  it("Get History button press, Loading", async () => {
    render(<HistoryModal
      activeCustomer={customer}
      tracers={tracers}
      websocket={websocket}
      onClose={onClose}
    />);

    fireEvent.click(await screen.findByRole('button', {name : "Hent historik"}));

    expect(screen.findByText("Loading"));
  });

  it("Resolving History fetching", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
        return new Promise(async function(resolve) {resolve({
          data : {
            "1" : []
          }
        })});
      })
    }
    render(<HistoryModal
      activeCustomer={customer}
      tracers={tracers}
      websocket={ResolvingWebsocket}
      onClose={onClose}
    />);
    await act(async () => { // The extra Act is needed because the modal depends on the websocket response.
      // Therefore an extra update is triggered which this act catches.
      const getHistoryButton = await screen.findByRole('button', {name : "Hent historik"});
      fireEvent.click(getHistoryButton);
    });
    const date = new Date();
    expect(await screen.findByText(`Der er ingen ordre i ${date.getMonth() + 1}/${date.getFullYear()}`));
  });

  it("Reset history", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
        return new Promise(async function(resolve) {resolve({
          data : {
            "1" : []
          }
        })});
      })
    }
    render(<HistoryModal
      activeCustomer={customer}
      tracers={tracers}
      websocket={ResolvingWebsocket}
      onClose={onClose}
    />);
    await act(async () => {
      const getHistoryButton = await screen.findByRole('button', {name : "Hent historik"});
      fireEvent.click(getHistoryButton);
    })
    fireEvent.click(await screen.findByRole('button', {name: "Ny Historik"}))

    expect(await screen.findByRole('button', {name : "Hent historik"})).toBeVisible();
    expect(await screen.findByLabelText("month-selector")).toBeVisible();
    expect(await screen.findByLabelText("year-selector")).toBeVisible();
  });

  it("Resolving History with data", async () => {
    const ResolvingWebsocket = {
      getMessage : jest.fn((input) => {return {
        WEBSOCKET_MESSAGE_TYPE : input
      }}),
      send : jest.fn((message) => {
        return new Promise(async function(resolve) {resolve({
          data : {
            "1" : [
              [1, "test-111111-1", "2023-02-01 08:00:00", 6381, 7423],
              [2, "test-111111-2", "2023-02-01 11:00:00", 2752, 3411]
            ],
            "2" : [
              [1, "test-111111-1", "2023-02-01 09:15:00", 2, 1],
              [2, "test-111111-2", "2023-02-01 10:00:00", 2, 2]
            ],
          }
        })});
      })
    }
    render(<HistoryModal
      activeCustomer={customer}
      tracers={tracers}
      websocket={ResolvingWebsocket}
      onClose={onClose}
    />);
    await act(async () => { // The extra Act is needed because the modal depends on the websocket response.
      // Therefore an extra update is triggered which this act catches.
      const getHistoryButton = await screen.findByRole('button', {name : "Hent historik"});
      fireEvent.click(getHistoryButton);
    });
    expect(await screen.findByText("Download")).toBeVisible();
  });
});
