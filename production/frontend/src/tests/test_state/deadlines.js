import { DEADLINE_TYPES } from "../../lib/constants";


export const deadlines = new Map([
  [1, {
      id : 1,
      deadline_type : DEADLINE_TYPES.DAILY,
      deadline_time : "12:00:00",
      deadline_day : null,
  }], [2, {
      id : 2,
      deadline_type : DEADLINE_TYPES.WEEKLY,
      deadline_time : "12:00:00",
      deadline_day : 3,
  }], [3, {
      id : 3,
      deadline_type : DEADLINE_TYPES.WEEKLY,
      deadline_time : "14:00:00",
      deadline_day : 1,
  }]
])