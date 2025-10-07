import { ActivityProduction } from "~/dataclasses/dataclasses";
import { DAYS } from "~/lib/constants";

export const productions = new Map([
  [1, new ActivityProduction(
    1, // id
    DAYS.MONDAY, // production_day
    1, // tracer
    "06:00:00", // production_time
    null, // expiration_date
  )], [2, new ActivityProduction(
    2, // id
    DAYS.MONDAY, // production_day
    1, // tracer
    "10:30:00", // production_time
    null, // expiration_date
  )], [3, new ActivityProduction(
    3, // id
    DAYS.TUESDAY, // production_day
    1, // tracer
    "06:00:00", // production_time
    null, // expiration_date
  )], [4, new ActivityProduction(
    4, // id
    DAYS.TUESDAY, // production_day
    1, // tracer
    "10:30:00", // production_time
    null, // expiration_date
  )], [5, new ActivityProduction(
    5, // id
    DAYS.MONDAY, // production_day
    3, // tracer
    "07:00:00", // production_time
    null, // expiration_date
  )], [6, new ActivityProduction(
    6, // id
    DAYS.MONDAY, // production_day
    3, // tracer
    "11:30:00", // production_time
    null, // expiration_date
  )], [7, new ActivityProduction(
    7, // id
    DAYS.WENDSDAY, // production_day
    1, // tracer
    "06:00:00", // production_time
    null, // expiration_date
  )], [8, new ActivityProduction(
    8, //   id
    DAYS.THURSDAY, //   production_day
    1, //   tracer
    "06:00:00", //   production_time
    null, //   expiration_date
  )], [9, new ActivityProduction(
    9, // id
    4, // production_day
    3, // tracer
    "11:30:00", // production_time
    null, // expiration_date
  )], [ 10, new ActivityProduction(
    10, // id
    3, // production_day
    3, // tracer
    "06:30:00", // production_time
    null, // expiration_date
  )],
  [ 11, new ActivityProduction(
    11, //   id
    3, //   production_day
    3, //   tracer
    "11:30:00", //   production_time
    null, //   expiration_date
  )],
  [ 12, new ActivityProduction(
    12, //   id
    DAYS.TUESDAY, //   production_day
    1, //   tracer
    "06:30:00", //   production_time
    null, //   expiration_date
  )]
]);