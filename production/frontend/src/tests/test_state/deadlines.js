import { Deadline } from "~/dataclasses/dataclasses";
import { DEADLINE_TYPES } from "../../lib/constants";


export const deadlines = new Map([
  [1, new Deadline(
      1,
      DEADLINE_TYPES.DAILY,
      "12:00:00",
      null,
    )], [2, new Deadline(
      2,
      DEADLINE_TYPES.WEEKLY,
      "12:00:00",
      3,
    )], [3, new Deadline(
      3,
      DEADLINE_TYPES.WEEKLY,
      "14:00:00",
      1,
    )]
]);