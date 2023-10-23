const { ActivityProduction, ActivityDeliveryTimeSlot } = require("~/dataclasses/dataclasses");
const { WEEKLY_REPEAT_CHOICES } = require("~/lib/constants");
const { TimeSlotBitChain } = require("~/lib/data_structures");


describe("Bit chains test sweep", () => {
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
    const bitChain = new TimeSlotBitChain(timeSlots, production);

    expect(bitChain._chain).toEqual(0x283)
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
    const bitChain = new TimeSlotBitChain(timeSlots, production)

    expect(bitChain.eval(new Date(2018, 2, 12, 13, 5))).toBeTruthy()
  });
})

