import { ActivityDeliveryTimeSlot } from "~/dataclasses/dataclasses"
import { WEEKLY_REPEAT_CHOICES } from "~/lib/constants"

export const activityDeliveryTimeSlots = new Map([
  [1, new ActivityDeliveryTimeSlot(
       1, // id
       WEEKLY_REPEAT_CHOICES.ALL, // weekly_repeat
       "08:15:00", // delivery_time
       1, // destination
       1, // Tracer 1, Monday, 06:00 // production_run
       null, // expiration_date
    )],
  [2, new ActivityDeliveryTimeSlot(
      2, // id
      WEEKLY_REPEAT_CHOICES.ALL, // weekly_repeat
      "15:15:00", // delivery_time
      1, // destination
      2, // Tracer 1, Monday, 10:30 // production_run
      null, // expiration_date
)],
  [3, new ActivityDeliveryTimeSlot(
      3, // id
      WEEKLY_REPEAT_CHOICES.ALL, // weekly_repeat
      "09:15:00", // delivery_time
      3, // destination
      2, // Tracer 1, Monday, 10:30 // production_run
      null, // expiration_date
  )],[4, new ActivityDeliveryTimeSlot(
      4, // id
      WEEKLY_REPEAT_CHOICES.ALL, // weekly_repeat
      "09:15:00", // delivery_time
      4, // destination
      1, // Tracer 1, Monday, 10:30 // production_run
      null, // expiration_date
  )], [5, new ActivityDeliveryTimeSlot(
    5, // id
    WEEKLY_REPEAT_CHOICES.EVEN, // weekly_repeat
    "15:15:00", // delivery_time
    1, // destination
    7, // Tracer 1, Wednesday, 6 // production_run
    null, // expiration_date
  )],[6, new ActivityDeliveryTimeSlot(
    6, // id
    WEEKLY_REPEAT_CHOICES.ODD, // weekly_repeat
    "15:15:00", // delivery_time
    1, // destination
    8, // Tracer 1, Thursday, 6 // production_run
    null, // expiration_date
)]

])
