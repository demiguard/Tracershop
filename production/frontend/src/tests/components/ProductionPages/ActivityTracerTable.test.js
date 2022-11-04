/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, scryRenderedComponentsWithType } from "react-dom/test-utils";
import { fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"
import { createRoot } from "react-dom/client";

import { WS } from "jest-websocket-mock";
import { ActivityTable } from "../../../components/ProductionPages/ActivityTable.js"
import { TracerWebSocket} from "../../../lib/TracerWebsocket.js"
import { TRACER_TYPE_ACTIVITY } from "../../../lib/constants.js";

let container = null;
let root = null
beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount()
  })

  cleanup()

  container.remove();
  container = null;
  root = null;
});


class MasterState {
  state = {}
  setState(State) {
    this.state = State
  }
}

// TEST variables
const testDate = new Date(2011, 5, 8, 10, 10, 10);

const run_1_runtime = "07:11:11";
const run_2_runtime = "17:11:11";
const run_3_runtime = "20:22:33";

const testTracerName = "Test Tracer 1";
const testBatchNumber = "testBatchNumber";
const testEmployeeName = "testEmployeeName";

const wsMock = new WS("ws://localhost/ws");

function getProps(){
  const props = {
    customers : new Map(),
    date : testDate,
    deliverTimes : new Map(),
    employees : new Map(),
    isotopes : new Map(),
    orders : new Map(),
    runs : new Map(),
    tracer : 1,
    tracers : new Map(),
    t_orders : new Map(),
    vials : new Map(),
    username : "Test username Username",
    websocket : new TracerWebSocket(wsMock, new MasterState()),
  };
  // Set Tracers
  props.tracers.set(1, {
    id : 1,
    name : testTracerName,
    isotope : 1,
    n_injections : -1,
    order_block : 0,
    in_use : true,
    tracer_type : TRACER_TYPE_ACTIVITY,
    longName : "Test Activity Tracer 1"
  });

  return props;
}

function setRuns(props){
  props.runs.set(1,{
    day : 3,
    ptime : run_1_runtime,
    run : 1,
    PTID : 1,
  });

  props.runs.set(2,{
    day : 3,
    ptime : run_2_runtime,
    run : 2,
    PTID : 2,
  });

  props.runs.set(3,{
    day : 4,
    ptime : run_3_runtime,
    run : 3,
    PTID : 3,
  });
}

function setCustomerDeliverTimes(props){
  props.customers.set(1, {
    UserName : "Test Customer 1",
    ID : 1,
    overhead : 20,
    kundenr : 1,
    Realname : "Test RealName",
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
  })

  props.deliverTimes.set(1, {
    BID : 1,
    day : 3,
    repeat_t : 1,
    dtime : "10:10:00",
    run : 1,
    DTID : 1,
  });

  props.deliverTimes.set(2, {
    BID : 1,
    day : 3,
    repeat_t : 1,
    dtime : "20:10:00",
    run : 2,
    DTID : 2,
  });

  props.isotopes.set(1,  {
    ID : 1,
    name : "testIsotope",
    halflife : 15000,
  })

  props.employees.set(1,{
    Id : 1,
    Username : testEmployeeName
  })
}

function setOrders(props){
  props.orders.set(1, {
    deliver_datetime : "2011/06/08 20:10:00",
    oid : 1,
    status : 1,
    amount : 10000,
    amount_o : 12000,
    total_amount : 10000,
    total_amount_o : 12000,
    tracer : 1,
    run : 2,
    BID : 1,
    batchnr : "",
    COID : -1,
    comment : "",
    username : "Test Customer",
  });

  props.orders.set(2, {
    deliver_datetime : "2011/06/08 10:10:00",
    oid : 2,
    status : 3,
    amount : 10000,
    amount_o : 12000,
    total_amount : 10000,
    total_amount_o : 12000,
    tracer : 1,
    run : 1,
    BID : 1,
    batchnr : testBatchNumber,
    COID : -1,
    frigivet_af : 1,
    frigivet_amount : 13000,
    volume : 1.34,
    frigivet_datetime : "2011/06/08 10:53:00",
    comment : "",
    username : "Test Customer",
  });

  props.orders.set(411, {
    deliver_datetime : "2011/06/08 10:10:00",
    oid : 411,
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
    comment : "",
    username : "Test Customer",
  });

  props.orders.set(11, {
    deliver_datetime : "2011/06/08 10:10:00",
    oid : 11,
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
    comment : "",
    username : "Test Customer",
  });

  props.orders.set(51, {
    deliver_datetime : "2011/06/18 10:10:00",
    oid : 51,
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
    comment : "",
    username : "Test Customer",
  });
}

describe("The Activity Table tracer", () =>{
  it("Minimal render of the Activity Tracer Table", async () => {
    //Setup
    const props = getProps();
    // Act
    act(() => { root.render(<ActivityTable
      customers={props.customers}
      date={props.date}
      deliverTimes={props.deliverTimes}
      employees={props.employees}
      isotopes={props.isotopes}
      orders={props.orders}
      runs={props.runs}
      tracer={props.tracer}
      tracers={props.tracers}
      t_orders={props.t_orders}
      vials={props.vials}
      username={props.username}
      websocket={props.websocket}
    />);
  });

  // Validate
  const MainDiv = container.querySelector("div");
  const ExpectedDateStr = `${testDate.getDate()}/${testDate.getMonth() + 1}/${testDate.getFullYear()}`

  // Test the first div
  const ProductionDiv = MainDiv.childNodes[0];

  const ProductionRow = ProductionDiv.childNodes[0];
  const ProductionInfo = ProductionRow.childNodes[0];
  expect(ProductionInfo.textContent).toBe(`Produktioner - ${ExpectedDateStr}:` )

  const ButtonDiv = ProductionRow.childNodes[1];
  expect(ButtonDiv.textContent).toBe("Opret ny ordre");

  // Test the second div
  const NoOrderDiv = MainDiv.childNodes[1];
  expect(NoOrderDiv.textContent).toBe(
    `Der er ingen ${testTracerName} Ordre til den ${ExpectedDateStr}`)
  });

  it("Render with runs of the Activity Tracer Table", async () => {
    // Setup
    const props = getProps();
    setRuns(props);

    // Act
    act(() => { root.render(<ActivityTable
      customers={props.customers}
      date={props.date}
      deliverTimes={props.deliverTimes}
      employees={props.employees}
      isotopes={props.isotopes}
      orders={props.orders}
      runs={props.runs}
      tracer={props.tracer}
      tracers={props.tracers}
      t_orders={props.t_orders}
      vials={props.vials}
      username={props.username}
      websocket={props.websocket}
    />);
  });

  // Validate
  const MainDiv = container.querySelector("div");
  const ExpectedDateStr = `${testDate.getDate()}/${testDate.getMonth() + 1}/${testDate.getFullYear()}`

  // Test the first div
  const ProductionDiv = MainDiv.childNodes[0];

  const ProductionRow = ProductionDiv.childNodes[0];
  const ProductionInfo = ProductionRow.childNodes[0];

  expect(ProductionInfo.childNodes.length).toBe(3)
  expect(ProductionInfo.childNodes[0].textContent).toBe(`Produktioner - ${ExpectedDateStr}:`);
  expect(ProductionInfo.childNodes[1].textContent).toBe(`Kørsel : 1 - ${run_1_runtime} : 0 MBq / Overhead : 0 MBq`);
  expect(ProductionInfo.childNodes[2].textContent).toBe(`Kørsel : 2 - ${run_2_runtime} : 0 MBq / Overhead : 0 MBq`);

  const ButtonDiv = ProductionRow.childNodes[1];
  expect(ButtonDiv.textContent).toBe("Opret ny ordre");

  // Test the second div
  const NoOrderDiv = MainDiv.childNodes[1];
  expect(NoOrderDiv.textContent).toBe(
    `Der er ingen ${testTracerName} Ordre til den ${ExpectedDateStr}`)
  });
});

// Testing Library / react tests

describe("Testing-library/react tests", () =>{
  it("Minimal render test", async () => {
    const props = getProps();
    const ExpectedDateStr = `${
      testDate.getDate()}/${
      testDate.getMonth() + 1}/${
      testDate.getFullYear()}`;

    // Act
    const AT = render(<ActivityTable
      customers={props.customers}
      date={props.date}
      deliverTimes={props.deliverTimes}
      employees={props.employees}
      isotopes={props.isotopes}
      orders={props.orders}
      runs={props.runs}
      tracer={props.tracer}
      tracers={props.tracers}
      t_orders={props.t_orders}
      vials={props.vials}
      username={props.username}
      websocket={props.websocket}
    />);

    expect(
      await screen.findByRole('button', {exact : false, name : /Opret ny ordre/i})
      ).toBeVisible();

    expect(await screen.findByText(`Produktioner - ${ExpectedDateStr}:`)).toBeVisible();
  });

  it("Run render test", async () => {
    const props = getProps();
    const ExpectedDateStr = `${
      testDate.getDate()}/${
      testDate.getMonth() + 1}/${
      testDate.getFullYear()}`;

    setRuns(props);

    // Act
    const AT = render(<ActivityTable
      customers={props.customers}
      date={props.date}
      deliverTimes={props.deliverTimes}
      employees={props.employees}
      isotopes={props.isotopes}
      orders={props.orders}
      runs={props.runs}
      tracer={props.tracer}
      tracers={props.tracers}
      t_orders={props.t_orders}
      vials={props.vials}
      username={props.username}
      websocket={props.websocket}
    />);

    expect(
      await screen.findByRole('button', {exact : false, name : /Opret ny ordre/i})
      ).toBeVisible();

    expect(await screen.findByText(`Produktioner - ${ExpectedDateStr}:`)).toBeVisible();
    expect(await screen.findByText(`Kørsel : 1 - ${run_1_runtime} : 0 MBq / Overhead : 0 MBq`)).toBeVisible();
    expect(await screen.findByText(`Kørsel : 2 - ${run_2_runtime} : 0 MBq / Overhead : 0 MBq`)).toBeVisible();
    expect(await screen.queryByText(`Kørsel : 3 - ${run_3_runtime} : 0 MBq / Overhead : 0 MBq`)).toBeNull();
  });

  it("Order Rendering", async () => {
    const props = getProps();
    setRuns(props);
    setCustomerDeliverTimes(props);
    setOrders(props);

    const AT = render(<ActivityTable
      customers={props.customers}
      date={props.date}
      deliverTimes={props.deliverTimes}
      employee={props.employees}
      isotopes={props.isotopes}
      orders={props.orders}
      runs={props.runs}
      tracer={props.tracer}
      tracers={props.tracers}
      t_orders={props.t_orders}
      vials={props.vials}
      username={props.username}
      websocket={props.websocket}
    />);

    expect(
      await screen.findByRole('button', {exact : false, name : /Opret ny ordre/i})
      ).toBeVisible();

      const tables = await screen.findAllByRole('table');


    expect(tables.length).toBe(2);

    const pendingTable = tables[0];
    const pendingArray = Array.from(pendingTable.children);
    const pendingRows = Array.from(pendingArray[1].children)

    expect(pendingRows.length).toBe(3)

    const finishedTable = tables[1];
    const finishedArray = Array.from(finishedTable.children);
  })

  it("Press Create Order Button", async () => {
    const props = getProps();
    setRuns(props);
    setCustomerDeliverTimes(props);

    const AT = <ActivityTable
      customers={props.customers}
      date={props.date}
      deliverTimes={props.deliverTimes}
      employee={props.employees}
      isotopes={props.isotopes}
      orders={props.orders}
      runs={props.runs}
      tracer={props.tracer}
      tracers={props.tracers}
      t_orders={props.t_orders}
      vials={props.vials}
      username={props.username}
      websocket={props.websocket}
    />

    const RAT = render(AT, {target : container});

    fireEvent(
      await screen.getByRole('button', {name : /Opret ny ordre/}),
      new MouseEvent('click', {bubbles : true, cancelable : true})
    );
  });

});