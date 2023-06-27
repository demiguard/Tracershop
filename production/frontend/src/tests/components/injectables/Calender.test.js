/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'

import { Calender, standardOrderMapping, productionGetMonthlyOrders } from '../../../components/injectable/calender.js'
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE } from "../../../lib/constants.js";

let container = null;
let root = null
beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    if(root != null) root.unmount()
  })

  cleanup()

  if(container != null) container.remove();

  container = null;
  root = null;
});

const date = new Date(2012,5,26,11,26,45);
const getColor = jest.fn(() => {return ""});
const onDayClick = jest.fn((str) => {return str});
const onMonthChange = jest.fn((str) => {return str});

const calender_props = {};
calender_props[CALENDER_PROP_DATE] = date;
calender_props[CALENDER_PROP_GET_COLOR] = getColor;
calender_props[CALENDER_PROP_ON_DAY_CLICK] = onDayClick;
calender_props[CALENDER_PROP_ON_MONTH_CHANGE] = onMonthChange


describe("Calender render Tests", () => {
  it("Standard RenderTest", async () => {


    render(<Calender
      {...calender_props}
    />);

    expect(await screen.getByText("June")).toBeVisible();
    expect(await screen.getByText("Man")).toBeVisible();
    expect(await screen.getByText("Tir")).toBeVisible();
    expect(await screen.getByText("Ons")).toBeVisible();
    expect(await screen.getByText("Tor")).toBeVisible();
    expect(await screen.getByText("Fre")).toBeVisible();
    expect(await screen.getByText("Lør")).toBeVisible();
    expect(await screen.getByText("Søn")).toBeVisible();

  });

  it("Click on 15 of june", async () => {
    render(<Calender
      {...calender_props}
    />);

    await fireEvent(await screen.findByText("15"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    expect(onDayClick).toHaveBeenCalledWith(new Date(2012,5,15,12,0,0))

  });

  it("Increase Month", async () => {
    render(<Calender
      {...calender_props}
    />);

    await fireEvent(await screen.findByAltText("Næste"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2012,6,1,0,0,0))
  });

  it("Decrease Month", async () => {
    render(<Calender
      {...calender_props}
    />);

    await fireEvent(await screen.findByAltText("Sidste"), new MouseEvent('click', {bubbles: true, cancelable: true}));
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2012,4,1,0,0,0))
  });
});

const closeDates = new Map([
  [1, {BDID: 1, ddate: '2012-06-13'}],
  [2, {BDID: 2, ddate: '2013-07-11'}]]
);
const Orders = new Map([
  [1, {
    deliver_datetime : "2012/06/08 20:10:00",
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
  }], [2, {
    deliver_datetime : "2012/06/08 10:10:00",
    oid : 2,
    status : 3,
    amount : 10000,
    amount_o : 12000,
    total_amount : 10000,
    total_amount_o : 12000,
    tracer : 1,
    run : 1,
    BID : 1,
    batchnr : "testBatchNumber",
    COID : -1,
    frigivet_af : 1,
    frigivet_amount : 13000,
    volume : 1.34,
    frigivet_datetime : "2012/06/08 10:53:00",
    comment : "",
    username : "Test Customer",
  }], [411, {
    deliver_datetime : "2012/06/08 10:10:00",
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
  }], [11, {
    deliver_datetime : "2012/06/08 10:10:00",
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
  }], [51, {
    deliver_datetime : "2012/06/18 10:10:00",
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
  }],
  [111, {
    deliver_datetime : "2012/06/13 10:10:00",
    oid : 111,
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
  }],
  [112, {
    deliver_datetime : "2012/06/07 10:10:00",
    oid : 112,
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
    comment : "",
    username : "Test Customer",
  }]
]);


const run_1_runtime = "07:11:11";
const run_2_runtime = "17:11:11";
const run_3_runtime = "20:22:33";

const Runs = new Map([[1,{
  day : 3,
  ptime : run_1_runtime,
  run : 1,
  PTID : 1,
}], [2,{
  day : 3,
  ptime : run_2_runtime,
  run : 2,
  PTID : 2,
}],[3,{
  day : 4,
  ptime : run_3_runtime,
  run : 3,
  PTID : 3,
}],[4,{
  day : 1,
  ptime : run_1_runtime,
  run : 1,
  PTID : 4,
}],[5,{
  day : 2,
  ptime : run_1_runtime,
  run : 1,
  PTID : 5,
}], [6,{
  day : 0,
  ptime : run_1_runtime,
  run : 1,
  PTID : 6,
}]]);


const TOrders = new Map([[1, {
  deliver_datetime : '2012-06-07 11:41:00',
  oid : 1,
  status : 2,
  n_injections : 1,
  anvendelse: "human",
  comment : "",
  username : "",
  tracer : 17,
  BID : 5,
  batchnr: "",
}],
]);

jest.useFakeTimers().setSystemTime(new Date(2012,5,17,11,5,1));

test("Standard Order Mapping", () => {
  const colorFunction = standardOrderMapping(Orders, TOrders, Runs, closeDates);
  expect(colorFunction('2012-06-13')).toEqual("date-status55");
  expect(colorFunction('2012-06-08')).toEqual("date-status51");
  expect(colorFunction('2012-06-07')).toEqual("date-status23");
  expect(colorFunction('2012-06-26')).toEqual("date-status50");
  expect(colorFunction('2012-06-01')).toEqual("date-status55");
  expect(colorFunction('2012-06-03')).toEqual("date-status55");
});

const wsMock = {
  getMessage : jest.fn(() => {return { name: "Mock" }}),
  send : jest.fn(() => {})
}

test("GetMonthlyOrders Test", () => {
  const monthlyFunc = productionGetMonthlyOrders(wsMock);
  monthlyFunc("2021-06-11 00:00:00")

  expect(wsMock.getMessage).toHaveBeenCalled()
  expect(wsMock.send).toHaveBeenCalled()
})