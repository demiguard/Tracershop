export const activityDeliveryTimeSlots = new Map([
  [1, {
      id : 1,
      weekly_repeat : 1,
      delivery_time : "08:15:00",
      destination : 1,
      production_run : 1, // Tracer 1, Monday, 06:00
      expiration_date : null,
  }],
  [2, {
      id : 2,
      weekly_repeat : 1,
      delivery_time : "15:15:00",
      destination : 1,
      production_run : 2, // Tracer 1, Monday, 10:30
      expiration_date : null,
  }],
  [3, {
      id : 3,
      weekly_repeat : 1,
      delivery_time : "09:15:00",
      destination : 3,
      production_run : 2, // Tracer 1, Monday, 10:30
      expiration_date : null,
  }],[4, {
      id : 4,
      weekly_repeat : 1,
      delivery_time : "09:15:00",
      destination : 4,
      production_run : 1, // Tracer 1, Monday, 10:30
      expiration_date : null,
  }]
])
