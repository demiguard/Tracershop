import { ActivityDeliveryTimeSlot } from "~/dataclasses/dataclasses"

export const activityDeliveryTimeSlots = new Map([
  [1, new ActivityDeliveryTimeSlot(
       1, // id
       1, // weekly_repeat
       "08:15:00", // delivery_time
       1, // destination
       1, // Tracer 1, Monday, 06:00 // production_run
       null, // expiration_date
    )],
  [2, new ActivityDeliveryTimeSlot(
      2, // id
      1, // weekly_repeat
      "15:15:00", // delivery_time
      1, // destination
      2, // Tracer 1, Monday, 10:30 // production_run
      null, // expiration_date
)],
  [3, new ActivityDeliveryTimeSlot(
      3, // id
      1, // weekly_repeat
      "09:15:00", // delivery_time
      3, // destination
      2, // Tracer 1, Monday, 10:30 // production_run
      null, // expiration_date
  )],[4, new ActivityDeliveryTimeSlot(
      4, // id
      1, // weekly_repeat
      "09:15:00", // delivery_time
      4, // destination
      1, // Tracer 1, Monday, 10:30 // production_run
      null, // expiration_date
  )]
])
