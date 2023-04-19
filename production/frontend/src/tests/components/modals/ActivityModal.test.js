/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, waitFor, queryByAttribute } from "@testing-library/react";
import { jest } from '@jest/globals'

import { ActivityModal } from '../../../components/modals/activity_modal.js'
import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../../lib/constants.js";

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
}]]);

const orders = new Map([[1, {
  deliver_datetime : "2011-06-07 11:30:00",
  oid : 1,
  status : 2,
  amount : 10000,
  amount_o : 12000,
  total_amount : 10000,
  total_amount_o : 12000,
  tracer : 1,
  run : 1,
  BID : 1,
  batchnr : "",
  COID : -1,
  comment : "Test Comment",
  username : "user",
}], [2, {
  deliver_datetime : "2011-06-07 11:30:00",
  oid : 2,
  status : 1,
  amount : 10000,
  amount_o : 12000,
  total_amount : 10000,
  total_amount_o : 12000,
  tracer : 1,
  run : 1,
  BID : 1,
  batchnr : "",
  COID : -1,
  comment : "Test Comment",
  username : "employee 1",
}],[3, {
  deliver_datetime : "2011-06-07 08:30:00",
  oid : 3,
  status : 3,
  amount : 10000,
  amount_o : 12000,
  total_amount : 10000,
  total_amount_o : 12000,
  tracer : 1,
  run : 1,
  BID : 1,
  batchnr : "",
  COID : -1,
  comment : "Test Comment",
  username : "employee 1",
  frigivet_af : 3,
  frigivet_amount : 13337,
  volume : 13.37,
  frigivet_datetime : "2011-06-07 08:44:11",
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

const vials = new Map([[1,{
  customer: 2,
  charge: "Test batch nr",
  filldate: "2011-06-07",
  filltime: "11:11:01",
  volume: 15.57,
  activity: 14551,
  ID: 1,
}], [2, {
  customer: 3,
  charge: "Test Batch nr",
  filldate: "2011-06-07",
  filltime: "11:33:66",
  volume: 6.21,
  activity: 9421,
  ID: 2,
}],[3, {
  customer: 2,
  charge: "Test Batch nr",
  filldate: "2011-06-08",
  filltime: "11:33:11",
  volume: 14.47,
  activity: 61152,
  ID: 3,
}],[4, {
  customer: 2,
  charge: "Test Batch nr",
  filldate: "2011-06-07",
  filltime: "08:32:11",
  volume: 13.37,
  activity: 13337,
  ID: 4,
  order_id: 3,
}], ])


describe("Activity Modal Test", () => {
  it("Standard Render Test status 1", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={2}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const AM = screen.getByTestId("test")

    expect(AM).toHaveTextContent(/Ordre 2/)
    expect(AM).toHaveTextContent(/Customer 1/)
    expect(AM).toHaveTextContent(/Kunde 1/)
    expect(AM).toHaveTextContent(/Kørsel 1/)

    const button = screen.getByRole('button', {name : "Accepter Ordre"});

    expect(screen.queryByRole('checkbox', {name : "vial-usage-1"})).toBeVisible();
    expect(screen.queryByRole('checkbox', {name : "vial-usage-2"})).toBeNull();
    expect(screen.queryByRole('checkbox', {name : "vial-usage-3"})).toBeNull();
    expect(screen.queryByRole('checkbox', {name : "vial-usage-4"})).toBeNull();
  });

  it("Status 1 Accept", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={2}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const AM = screen.getByTestId("test")

    expect(AM).toHaveTextContent(/Ordre 2/)
    expect(AM).toHaveTextContent(/Customer 1/)
    expect(AM).toHaveTextContent(/Kunde 1/)
    expect(AM).toHaveTextContent(/Kørsel 1/)

    const button = screen.getByRole('button', {name : "Accepter Ordre"});
    fireEvent.click(button);

  });

  it("Standard Render Test status 2", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
    />);

    const AM = screen.getByTestId("test")

    expect(AM).toHaveTextContent(/Ordre 1/)
    expect(AM).toHaveTextContent(/Customer 1/)
    expect(AM).toHaveTextContent(/Kunde 1/)
    expect(AM).toHaveTextContent(/Kørsel 1/)

    const button = screen.getByRole('button', {name : "Godkend Ordre"});
    expect(button).toHaveAttribute("disabled","")

    expect(screen.queryByRole('checkbox', {name : "vial-usage-1"})).toBeVisible();
    expect(screen.queryByRole('checkbox', {name : "vial-usage-2"})).toBeNull();
    expect(screen.queryByRole('checkbox', {name : "vial-usage-3"})).toBeNull();
    expect(screen.queryByRole('checkbox', {name : "vial-usage-4"})).toBeNull();
  });

  it("Standard Render Test status 3", () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={3}
      orders={orders}
      vials={vials}
    />);

  });

  it("See PDF", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={3}
      orders={orders}
      vials={vials}
    />);

    fireEvent.click(await (await screen.findByText('Se føgleseddel')).closest('button'))

  });

  it("Toggle vial Test", async () => {
    const elem = render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
    />, container)

    const button = await screen.findByText("Godkend Ordre");
    //expect(button).toBeDisabled()
    const input = await screen.findByRole('checkbox', {name : "vial-usage-1"});
    fireEvent.click(input);
    // Test
    //expect(button).not.toHaveAttribute("disabled")
    fireEvent.click(input);
    //expect(button).toHaveAttribute("disabled")
  });

  it("Start Freeing Test", async () => {
    const elem = render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
    />, container)

    const input = await screen.findByRole('checkbox', {name : "vial-usage-1"});
    fireEvent.click(input);
    const button = screen.getByRole('button', {name : "Godkend Ordre"});
    fireEvent.click(button);

    expect(await screen.findByRole('button', {name: "Frigiv Ordre"})).toBeVisible()
    expect(await screen.findByRole('button', {name: "Rediger Ordre"})).toBeVisible()
  });

  it("Cancel Freeing Test", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
    />);

    const input = await screen.findByRole('checkbox', {name : "vial-usage-1"});
    fireEvent.click(input);
    const button = screen.getByRole('button', {name : "Godkend Ordre"});
    fireEvent.click(button);

    const editButton = screen.getByRole('button', {name : "Rediger Ordre"});
    fireEvent.click(editButton);
    expect(screen.queryByRole('button', {name : "Frigiv Ordre"})).toBeNull();
    expect(screen.getByRole('button', {name : "Godkend Ordre"})).toBeVisible();
  });

  it("Show Calculator", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
    />);
    const calculatorButton = await screen.findByAltText("edit-order");
    fireEvent.click(calculatorButton);
  });

  it("Hide Calculator", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);
    const calculatorButton = await screen.findByAltText("edit-order");
    fireEvent.click(calculatorButton);
    const calculateButton = await screen.queryByRole('button', {name : "Tilbage"})
    fireEvent.click(calculateButton);
    expect(websocket.send).not.toHaveBeenCalled();
    expect(websocket.getMessage).not.toHaveBeenCalled();

    expect(await screen.queryByRole('button', {name : "Tilbage"})).toBeNull()
  })

  it("Calculate", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);
    const calculatorButton = await screen.findByAltText("edit-order");
    fireEvent.click(calculatorButton);
    const calculateButton = await screen.findByRole('button', {name: "Udregn"})
    fireEvent.click(calculateButton)
    expect(websocket.send).toHaveBeenCalled();
    expect(websocket.getMessage).toHaveBeenCalledWith(WEBSOCKET_MESSAGE_EDIT_STATE);
    expect(await screen.queryByText("Ny")).toBeNull();
  });

  it("Start Adding New vial", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const addNewButton = await screen.findByAltText("add-new-vial")
    fireEvent.click(addNewButton)
    expect(await screen.findByText("Ny")).toBeVisible();
  });

  it("Stop Adding New vial", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const addNewButton = await screen.findByAltText("add-new-vial")
    await fireEvent.click(addNewButton)
    const stopAddingButton = await screen.findByAltText("decline-new")
    fireEvent.click(stopAddingButton)
  });

  it("Editing New vial", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const addNewButton = await screen.findByAltText("add-new-vial")
    fireEvent.click(addNewButton)

    const chargeInput = await screen.findByLabelText('charge-new');
    const fillTimeInput = await screen.findByLabelText('filltime-new');
    const volumeInput = await screen.findByLabelText('volume-new');
    const activityInput = await screen.findByLabelText('activity-new');

    fireEvent.change(chargeInput, {target: {value: "asdf"}});
    fireEvent.change(fillTimeInput, {target: {value: "qwer"}});
    fireEvent.change(volumeInput, {target: {value: "zxcv"}});
    fireEvent.change(activityInput, {target: {value: "tyui"}});

    expect(chargeInput.value).toBe("asdf");
    expect(fillTimeInput.value).toBe("qwer");
    expect(volumeInput.value).toBe("zxcv");
    expect(activityInput.value).toBe("tyui");
  });

  it("Cant create invalid new vial", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const addNewButton = await screen.findByAltText("add-new-vial")
    fireEvent.click(addNewButton)

    const chargeInput = await screen.findByLabelText('charge-new');
    const fillTimeInput = await screen.findByLabelText('filltime-new');
    const volumeInput = await screen.findByLabelText('volume-new');
    const activityInput = await screen.findByLabelText('activity-new');

    fireEvent.change(chargeInput, {target: {value: "asdf"}});
    fireEvent.change(fillTimeInput, {target: {value: "qwer"}});
    fireEvent.change(volumeInput, {target: {value: "zxcv"}});
    fireEvent.change(activityInput, {target: {value: "tyui"}});

    const acceptEdit = await screen.findByAltText("accept-new");
    // Test
    fireEvent.click(acceptEdit);

    expect(websocket.getMessage).not.toBeCalledWith(WEBSOCKET_MESSAGE_EDIT_STATE);
    expect(websocket.send).not.toBeCalled();
  });

  it("Create New vial", async () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const addNewButton = await screen.findByAltText("add-new-vial")
    fireEvent.click(addNewButton)

    const chargeInput = await screen.findByLabelText('charge-new');
    const fillTimeInput = await screen.findByLabelText('filltime-new');
    const volumeInput = await screen.findByLabelText('volume-new');
    const activityInput = await screen.findByLabelText('activity-new');

    fireEvent.change(chargeInput, {target: {value: "test-201122-1"}});
    fireEvent.change(fillTimeInput, {target: {value: "12:34:56"}});
    fireEvent.change(volumeInput, {target: {value: "16.23"}});
    fireEvent.change(activityInput, {target: {value: "48112"}});

    const acceptNew = await screen.findByAltText("accept-new");

    fireEvent.click(acceptNew);

    expect(websocket.getMessage).toBeCalledWith(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
    expect(websocket.send).toBeCalled();
  });

  it("Natural input, filling time new", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("add-new-vial");
    fireEvent.click(editButton);
    const filltimeInput = await screen.findByLabelText('filltime-new');
    fireEvent.change(filltimeInput, {target: {value: "1"}});
    expect(filltimeInput.value).toBe("1");
    fireEvent.change(filltimeInput, {target: {value: "12"}});
    expect(filltimeInput.value).toBe("12:");
    fireEvent.change(filltimeInput, {target: {value: "12:1"}});
    expect(filltimeInput.value).toBe("12:1");
    fireEvent.change(filltimeInput, {target: {value: "12:11"}});
    expect(filltimeInput.value).toBe("12:11:");
    fireEvent.change(filltimeInput, {target: {value: "12:11:1"}});
    expect(filltimeInput.value).toBe("12:11:1");
    fireEvent.change(filltimeInput, {target: {value: "12:11:11"}});
    expect(filltimeInput.value).toBe("12:11:11");
    fireEvent.change(filltimeInput, {target: {value: "12:11:1"}});
    expect(filltimeInput.value).toBe("12:11:1");
    fireEvent.change(filltimeInput, {target: {value: "12:11:"}});
    expect(filltimeInput.value).toBe("12:11:");
    fireEvent.change(filltimeInput, {target: {value: "12:11"}});
    expect(filltimeInput.value).toBe("12:11");
  });

  it("Start Editing Vial", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);

    expect(await screen.findByAltText("accept-1")).toBeVisible();
    expect(await screen.findByAltText("decline-1")).toBeVisible();
  });

  it("Start Edit then decline", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);

    const chargeInput = await screen.findByLabelText('charge-1');
    const fillTimeInput = await screen.findByLabelText('filltime-1');
    const volumeInput = await screen.findByLabelText('volume-1');
    const activityInput = await screen.findByLabelText('activity-1');

    fireEvent.change(chargeInput, {target: {value: "asdf"}});
    fireEvent.change(fillTimeInput, {target: {value: "qwer"}});
    fireEvent.change(volumeInput, {target: {value: "zxcv"}});
    fireEvent.change(activityInput, {target: {value: "tyui"}});

    fireEvent.click(await screen.findByAltText("decline-1"));

    expect(screen.queryByText("asdf")).toBeNull();
    expect(screen.queryByText("qwer")).toBeNull();
    expect(screen.queryByText("zxcv")).toBeNull();
    expect(screen.queryByText("tyui")).toBeNull();

    expect(websocket.getMessage).not.toHaveBeenCalled()
    expect(websocket.send).not.toHaveBeenCalled()
  });

  it("Edit vial successfully", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);

    const chargeInput = await screen.findByLabelText('charge-1');
    const fillTimeInput = await screen.findByLabelText('filltime-1');
    const volumeInput = await screen.findByLabelText('volume-1');
    const activityInput = await screen.findByLabelText('activity-1');

    fireEvent.change(chargeInput, {target: {value: "test-201122-1"}});
    fireEvent.change(fillTimeInput, {target: {value: "12:34:56"}});
    fireEvent.change(volumeInput, {target: {value: "16.23"}});
    fireEvent.change(activityInput, {target: {value: "48112"}});

    const acceptEdit = await screen.findByAltText("accept-1");

    fireEvent.click(acceptEdit);

    expect(websocket.getMessage).toBeCalledWith(WEBSOCKET_MESSAGE_EDIT_STATE);
    expect(websocket.send).toBeCalled();
    });

  it("Missing Batchnumber", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const chargeInput = await screen.findByLabelText('charge-1');
    fireEvent.change(chargeInput, {target: {value: ""}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Batch nummer er ikke tastet ind')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });


  it("incorrect Batchnumber", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const chargeInput = await screen.findByLabelText('charge-1');
    fireEvent.change(chargeInput, {target: {value: "test-11111-1"}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Batch nummer ikke i korrekt format')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("Missing filling time", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const filltimeInput = await screen.findByLabelText('filltime-1');
    fireEvent.change(filltimeInput, {target: {value: ""}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('produktions tidpunktet er ikke tastet ind')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("natural addition filling time edit", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const filltimeInput = await screen.findByLabelText('filltime-1');
    fireEvent.change(filltimeInput, {target: {value: "1"}});
    expect(filltimeInput.value).toBe("1");
    fireEvent.change(filltimeInput, {target: {value: "12"}});
    expect(filltimeInput.value).toBe("12:");
    fireEvent.change(filltimeInput, {target: {value: "12:1"}});
    expect(filltimeInput.value).toBe("12:1");
    fireEvent.change(filltimeInput, {target: {value: "12:11"}});
    expect(filltimeInput.value).toBe("12:11:");
    fireEvent.change(filltimeInput, {target: {value: "12:11:1"}});
    expect(filltimeInput.value).toBe("12:11:1");
    fireEvent.change(filltimeInput, {target: {value: "12:11:11"}});
    expect(filltimeInput.value).toBe("12:11:11");
    fireEvent.change(filltimeInput, {target: {value: "12:11:1"}});
    expect(filltimeInput.value).toBe("12:11:1");
    fireEvent.change(filltimeInput, {target: {value: "12:11:"}});
    expect(filltimeInput.value).toBe("12:11:");
    fireEvent.change(filltimeInput, {target: {value: "12:11"}});
    expect(filltimeInput.value).toBe("12:11");
  });

  it("Incorrectly formatted filling time", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const filltimeInput = await screen.findByLabelText('filltime-1');
    fireEvent.change(filltimeInput, {target: {value: "11:2a"}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Tidspunktet er ikke formateret korrekt: HH:MM:SS')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("Missing Volume", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const volumeInput = await screen.findByLabelText('volume-1');
    fireEvent.change(volumeInput, {target: {value: ""}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Volumen er ikke indtastet')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("Nan Volume", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const volumeInput = await screen.findByLabelText('volume-1');
    fireEvent.change(volumeInput, {target: {value: "Hello World"}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Volumen er ikke et tal')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("Negative Volume", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const volumeInput = await screen.findByLabelText('volume-1');
    fireEvent.change(volumeInput, {target: {value: "-12.2"}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Volumen kan ikke være negativ')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("Missing Volume", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const activityInput = await screen.findByLabelText('activity-1');
    fireEvent.change(activityInput, {target: {value: ""}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Aktiviten er ikke indtastet')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("Nan Volume", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const activityInput = await screen.findByLabelText('activity-1');
    fireEvent.change(activityInput, {target: {value: "Hello World"}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Aktiviten er ikke et tal')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });

  it("Negative Activitity", async () =>{
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
      websocket={websocket}
    />);

    const editButton = await screen.findByAltText("edit-vial-1");
    fireEvent.click(editButton);
    const activityInput = await screen.findByLabelText('activity-1');
    fireEvent.change(activityInput, {target: {value: "-12.2"}});
    const acceptEdit = await screen.findByAltText("accept-1");
    // Test
    fireEvent.click(acceptEdit);

    // assert
    expect(await screen.findByText('Aktiviten kan ikke være negativ')).toBeVisible();

    expect(websocket.getMessage).not.toBeCalled();
    expect(websocket.send).not.toBeCalled();
  });
});
