/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { CreateInjectionOrderModal } from "../../../components/modals/create_injection_modal.js"
import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";
import { custom } from "babel-loader";

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


describe("Create injection Order", () => {
  it("Standard Render Test", async () => {
    render(<CreateInjectionOrderModal
      customers={customers}
      date={new Date(2011,11,22,13,45,11)}
      tracers={tracers}
      onClose={onClose}
      websocket={websocket}
    />, container);
  });

  it("Successful Order", async () => {
    render(<CreateInjectionOrderModal
      customers={customers}
      tracers={tracers}
      onClose={onClose}
      date={new Date(2011,11,22,13,45,11)}
      websocket={websocket}
    />, container);

    fireEvent.change(
      await screen.findByLabelText("injection-input"),
      {target: {value: "1"}}
    )
    fireEvent.change(
      await screen.findByLabelText("delivery-input"),
      {target: {value: "11:33:00"}}
    )
    fireEvent.click(
      await screen.findByRole("button", {name : "Opret Ordre"})
    );

    expect(websocket.send).toHaveBeenCalled()
    expect(websocket.getMessage).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  });

  it("Failed injections Order", async () => {
    render(<CreateInjectionOrderModal
      customers={customers}
      tracers={tracers}
      onClose={onClose}
      date={new Date(2011,11,22,13,45,11)}
      websocket={websocket}
    />, container);

    fireEvent.change(
      await screen.findByLabelText("injection-input"),
      {target: {value: "asd"}}
    )
    fireEvent.change(
      await screen.findByLabelText("delivery-input"),
      {target: {value: "11:33:00"}}
    )
    fireEvent.click(
      await screen.findByRole("button", {name : "Opret Ordre"})
    );

    expect(await screen.findByText("Injektionerne er ikke et tal")).toBeVisible();

    expect(websocket.send).not.toHaveBeenCalled()
    expect(websocket.getMessage).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  });

  it("Failed order time", async () => {
    render(<CreateInjectionOrderModal
      customers={customers}
      tracers={tracers}
      onClose={onClose}
      date={new Date(2011,11,22,13,45,11)}
      websocket={websocket}
    />, container);

    fireEvent.change(
      await screen.findByLabelText("injection-input"),
      {target: {value: "1"}}
    )
    fireEvent.change(
      await screen.findByLabelText("delivery-input"),
      {target: {value: "hello world"}}
    )
    fireEvent.click(
      await screen.findByRole("button", {name : "Opret Ordre"})
    );

    expect(await screen.findByText("Leverings tidspunktet er ikke et valid")).toBeVisible();

    expect(websocket.send).not.toHaveBeenCalled()
    expect(websocket.getMessage).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  });
});