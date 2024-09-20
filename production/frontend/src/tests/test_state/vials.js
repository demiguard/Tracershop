import { Vial } from "~/dataclasses/dataclasses";

export const vials = new Map([
  [1, new Vial(
    1, // id
    1, // tracer
    13000, // activity
    13.37, // volume
    "test-200405-1", // lot_number
    "07:54:44", // fill_time
    "2020-05-04", // fill_date
    null, // assigned_to
    1, // owner
  )], [2, new Vial(
    2, // id
    1, // tracer
    13005, // activity
    13.37, // volume
    "test-200501-1", // lot_number
    "07:54:44", // fill_time
    "2020-05-01", // fill_date
    null, // assigned_to
    1, // owner
  )], [3, new Vial(
    3, // id
    1, // tracer
    13005, // activity
    13.37, // volume
    "test-200428-1", // lot_number
    "07:54:44", // fill_time
    "2020-04-28", // fill_date
    null, // assigned_to
    1, // owner
  )], [4, new Vial(
    4, // id
    1, // tracer
    13000, // activity
    13.37, // volume
    "test-200405-1", // lot_number
    "07:54:44", // fill_time
    "2020-04-05", // fill_date
    null, // assigned_to
    1, // owner
  )], [5, new Vial(
    5, // id
    1, // tracer
    13538, // activity
    13.37, // volume
    "test-200511-1", // lot_number
    "07:54:44", // fill_time
    "2020-05-11", // fill_date
    6, // assigned_to
    3, // owner
  )], [6, new Vial(
    6, // id
    1, // tracer
    13538, // activity
    13.37, // volume
    "test-200511-1", // lot_number
    "07:54:44", // fill_time
    "2020-05-11", // fill_date
    null, // assigned_to
    null, // owner
  )], [7, new Vial(
    7, // id
    1, // tracer
    13000, // activity
    13.37, // volume
    "test-200511-1", // lot_number
    "07:54:44", // fill_time
    "2020-05-11", // fill_date
    null, // assigned_to
      1, // owner
  )], [8, new Vial(
    8, // id
    1, // tracer
    15000, // activity
    13.37, // volume
    "test-200511-1", // lot_number
    "07:54:44", // fill_time
    "2020-05-11", // fill_date
    null, // assigned_to
    1, // owner
  )], [9, new Vial(
    9, // id
    1, // tracer
    15000, // activity
    13.37, // volume
    "test-200511-1", // lot_number
    "07:54:44", // fill_time
    "2020-05-04", // fill_date
    null, // assigned_to
    1, // owner
  )]
]);
