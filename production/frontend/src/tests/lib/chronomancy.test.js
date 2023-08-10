import { ActivityDeliveryTimeSlot, ActivityProduction, Deadline } from "../../dataclasses/dataclasses"
import { calculateDeadline, evalBitChain, expiredDeadline, getBitChain } from "../../lib/chronomancy"
import { DEADLINE_TYPES, WEEKLY_REPEAT_CHOICES } from "../../lib/constants"




describe("Chronomancy test suit", () => {
  it("Deadline type daily", () => {
    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const deadline_day = new Date(2018, 2, 21, 11, 31, 41)

    const deadlineDate = calculateDeadline(deadline, deadline_day);

    expect(deadlineDate).toEqual(new Date(2018, 2, 20, 13, 0 ))
  });

  it("Deadline type weekly", () => {
    const deadline = new Deadline(1, DEADLINE_TYPES.WEEKLY, "13:00:00", 3);
    const deadlineDay = new Date(2018, 2, 21, 11, 31, 41);

    const deadlineDate = calculateDeadline(deadline, deadlineDay);
    expect(deadlineDate).toEqual(new Date(2018, 2, 15, 13, 0 ))
  })

  it("Bit chain", () => {
    const production = new Map([
      [1, new ActivityProduction(1, 0, 1, "07:00:00", null)],
      [2, new ActivityProduction(2, 1, 1, "07:00:00", null)],
      [3, new ActivityProduction(3, 2, 1, "07:00:00", null)],
    ]);

    const timeSlots = [new ActivityDeliveryTimeSlot(
      1, WEEKLY_REPEAT_CHOICES.ALL, "08:15:00", null, 1, null
    ), new ActivityDeliveryTimeSlot(
      2, WEEKLY_REPEAT_CHOICES.EVEN, "08:15:00", null, 2, null
    ), new ActivityDeliveryTimeSlot(
      3, WEEKLY_REPEAT_CHOICES.ODD, "08:15:00", null, 3, null
    )];
    const bitChain = getBitChain(timeSlots, production)

    expect(bitChain).toEqual(0x283)
  })

  it("Evaluate Bit chain", () => {
    const production = new Map([
      [1, new ActivityProduction(1, 0, 1, "07:00:00", null)],
      [2, new ActivityProduction(2, 1, 1, "07:00:00", null)],
      [3, new ActivityProduction(3, 2, 1, "07:00:00", null)],
    ]);

    const timeSlots = [new ActivityDeliveryTimeSlot(
      1, WEEKLY_REPEAT_CHOICES.ALL, "08:15:00", null, 1, null
    ), new ActivityDeliveryTimeSlot(
      2, WEEKLY_REPEAT_CHOICES.EVEN, "08:15:00", null, 2, null
    ), new ActivityDeliveryTimeSlot(
      3, WEEKLY_REPEAT_CHOICES.ODD, "08:15:00", null, 3, null
    )];

    console.log(timeSlots, production)
    const bitChain = getBitChain(timeSlots, production)

    expect(evalBitChain(bitChain, new Date(2018, 2, 12, 13, 5))).toBeTruthy()
  });

  it("Expired deadline - the same day", () => {
    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const orderDay = new Date(2018, 2, 12, 10, 15, 42);
    const now = new Date(2018, 2, 12, 10, 15, 62)

    expect(expiredDeadline(deadline, orderDay,undefined, now)).toBe(false);
  });

  it.skip("Expired deadline something is wrong", () => {
    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const orderDay = new Date(2023, 6, 12, 10, 15, 42);
    const now = new Date(2018, 2, 12, 10, 15, 62)

    expect(expiredDeadline(deadline, orderDay, undefined, now)).toBe(false);
  });
})

