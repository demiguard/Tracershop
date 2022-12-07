/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { jest } from '@jest/globals'

import {ActivityModal} from '../../../components/modals/ActivityModal'

let container = null;
beforeEach(() => {
  container = document.createElement("div");
});

afterEach(() => {
  cleanup()

  if(container != null) container.remove();

  container = null;
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
  it("Standard Render Test", async () => {
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
  })

  it("Start Freeing Test", () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
    />)

    const button = screen.getByRole('button', {name : "Frigiv Ordre"});
    fireEvent.click(button);
    expect(screen.getByRole('button', {name : "Log in"})).toBeVisible()
  })

  it("Cancel Freeing Test", () => {
    render(<ActivityModal
      customers={customers}
      isotopes={isotopes}
      tracers={tracers}
      order={1}
      orders={orders}
      vials={vials}
    />)

    const button = screen.getByRole('button', {name : "Frigiv Ordre"});
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('button', {name: "Rediger Ordre"}))
    expect(screen.queryByRole('button', {name : "Log in"})).toBeNull();
  })
})