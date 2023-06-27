/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { VialPage } from "../../../components/production_pages/vial_page.js"
import { JSON_CUSTOMER, JSON_VIAL, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";

const onClose = jest.fn()
const module = jest.mock('../../../lib/tracer_websocket.js');
const tracer_websocket = require("../../../lib/tracer_websocket.js");

let websocket = null;
let container = null;

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

const vials = new Map([
  [1, {
    ID : 1,
    charge : "fdg-111111-1",
    filldate : "2011-11-03",
    filltime : "11:33:56",
    volume : 13.43,
    activity : 51221,
    kundenr : 1,
  }],

  [2, {
    ID : 2,
    charge : "fdg-111111-1",
    filldate : "2011-11-03",
    filltime : "11:33:56",
    volume : 13.43,
    activity : 51221,
    kundenr : 2,
    order_id : 1
  }],
])


describe("Vial page tests suite", () => {
  const props = {};
  props[JSON_VIAL] = new Map();
  props[JSON_CUSTOMER] = new Map();

  it("Standard Render Tests", async () => {
    render(<VialPage
      {...props}
    />);
  });
});