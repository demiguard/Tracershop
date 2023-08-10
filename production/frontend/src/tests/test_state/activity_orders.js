export const activity_orders = new Map([
  [1, {
      id : 1,
      ordered_activity : 12345,
      delivery_date : "2020-05-04", // That's Monday
      status : 1,
      comment : "Test comment",
      ordered_time_slot : 1,
      moved_to_time_slot : null,
      freed_datetime : null,
      ordered_by : null,
      freed_by : null,
  }], [2, {
      id : 2,
      ordered_activity : 62345,
      delivery_date : "2020-05-04", // That's Monday
      status : 1,
      comment : "",
      ordered_time_slot : 2,
      moved_to_time_slot : 1,
      freed_datetime : null,
      ordered_by : null,
      freed_by : null,
  }], [3, {
      id : 3,
      ordered_activity: 22345,
      delivery_date: "2020-04-27", // That's Monday
      status: 3,
      comment: null,
      ordered_time_slot: 1,
      moved_to_time_slot: null,
      freed_datetime: "2020-05-27T11:33:44",
      ordered_by: null,
      freed_by: null,
  }], [4, {
      id : 4,
      ordered_activity : 62345,
      delivery_date : "2020-05-04", // That's Monday
      status : 1,
      comment : "",
      ordered_time_slot : 2,
      moved_to_time_slot : 1,
      freed_datetime : null,
      ordered_by : null,
      freed_by : null,
  }], [5, {
      id : 5,
      ordered_activity : 12345,
      delivery_date : "2020-05-11", // That's Monday
      status : 2,
      comment : "Test comment",
      ordered_time_slot : 1,
      moved_to_time_slot : null,
      freed_datetime : null,
      ordered_by : null,
      freed_by : null,
  }],[6, {
      id : 6,
      ordered_activity: 22345,
      delivery_date: "2020-05-04", // That's Monday
      status: 3,
      comment: null,
      ordered_time_slot: 4,
      moved_to_time_slot: null,
      freed_datetime: "2020-05-04T11:33:44",
      ordered_by: null,
      freed_by: null,
  }]
])