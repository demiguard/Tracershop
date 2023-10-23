import { InjectionOrder } from "~/dataclasses/dataclasses"

export const injection_orders = new Map([
  [1, new InjectionOrder(
      1, // id
      "09:00:00", // delivery_time
      "2020-05-04", // delivery_date
      1, // injections
      1, // status
      1, // tracer_usage
      null, // comment
      null, // ordered_by
      1, // endpoint
      2, // tracer
      null, // lot_number
      null, // freed_datetime
      null, // freed_by
)], [2, new InjectionOrder(
      2, // id
      "10:00:00", // delivery_time
      "2020-05-04", // delivery_date
      1, // injections
      2, // status
      1, // tracer_usage
      null, // comment
      null, // ordered_by
      1, // endpoint
      2, // tracer
      null, // lot_number
      null, // freed_datetime
      null, // freed_by
)], [3, new InjectionOrder(
      3, // id
      "10:00:00", // delivery_time
      "2020-05-04", // delivery_date
      1, // injections
      3, // status
      1, // tracer_usage
      null, // comment
      null, // ordered_by
      1, // endpoint
      2, // tracer
      null, // lot_number
      null, // freed_datetime
      null, // freed_by
  )],
])