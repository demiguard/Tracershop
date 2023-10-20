import { ActivityOrder } from "~/dataclasses/dataclasses";

export const activity_orders = new Map([
  [1, new ActivityOrder(
       1, // id
       12345, // ordered_activity
       "2020-05-04", // That's Monday // delivery_date
       1, // status
       "Test comment", // comment
       1, // ordered_time_slot
       null, // moved_to_time_slot
       null, // freed_datetime
       null, // ordered_by
       null, // freed_by
  )], [2, new ActivityOrder(
       2, // id
       62345, // ordered_activity
       "2020-05-04", // That's Monday // delivery_date
       1, // status
       "", // comment
       2, // ordered_time_slot
       1, // moved_to_time_slot
       null, // freed_datetime
       null, // ordered_by
       null, // freed_by
    )], [3, new ActivityOrder(
       3, //id
       22345, //ordered_activity
       "2020-04-27", // That's Monday //delivery_date
       3, //status
       null, //comment
       1, //ordered_time_slot
       null, //moved_to_time_slot
       "2020-05-27T11:33:44", //freed_datetime
       null, //ordered_by
       null, //freed_by
    )], [4, new ActivityOrder(
      4, //id
      62345, //ordered_activity
      "2020-05-04", // That's Monday //delivery_date
      1, //status
      "", //comment
      2, //ordered_time_slot
      1, //moved_to_time_slot
      null, //freed_datetime
      null, //ordered_by
      null, //freed_by
    )], [5, new ActivityOrder(
        5, //id
        12345, //ordered_activity
        "2020-05-11", // That's Monday //delivery_date
        2, //status
        "Test comment", //comment
        1, //ordered_time_slot
        null, //moved_to_time_slot
        null, //freed_datetime
        null, //ordered_by
        null, //freed_by
)],[6, new ActivityOrder(
       6, //id
      22345, //ordered_activity
      "2020-05-04", // That's Monday //delivery_date
      3, //status
      null, //comment
      4, //ordered_time_slot
      null, //moved_to_time_slot
      "2020-05-04T11:33:44", //freed_datetime
      null, //ordered_by
      null, //freed_by
  )],
])