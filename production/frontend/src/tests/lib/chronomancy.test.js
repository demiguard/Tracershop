import { ActivityDeliveryTimeSlot, ActivityProduction, ClosedDate, Deadline } from "../../dataclasses/dataclasses"
import { calculateDeadline, combineDateAndTimeStamp, compareTimeStamp, evalBitChain, expiredDeadline, getBitChain, TimeStamp, getTimeString } from "../../lib/chronomancy"
import { DEADLINE_TYPES, WEEKLY_REPEAT_CHOICES } from "../../lib/constants"




describe("Chronomancy test suit", () => {
  it("Expired deadline - the same day", () => {
    // now        2018/03/12 - 10:15:42
    // OrderDay - 2018/03/12 - 10:15:32
    //

    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const orderDay = new Date(2018, 2, 12, 10, 15, 42);
    const now      = new Date(2018, 2, 12, 10, 15, 42)

    expect(expiredDeadline(deadline, orderDay, undefined, now)).toBe(true);
  });

  it("Expired deadline - the day before", () => {
    // now        2018/03/11 - 10:15:42
    // OrderDay - 2018/03/12 - 10:15:32
    //

    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const now      = new Date(2018, 2, 11, 10, 15, 42)
    const orderDay = new Date(2018, 2, 12, 10, 15, 42);

    expect(expiredDeadline(deadline, orderDay, undefined, now)).toBe(false);
  });

  it("Expired deadline far into the future", () => {
    // Now      2018/03/12 - 10:15:32
    // OrderDay 2023/06/12 - 10:15:42
    // Deadline is not expired?

    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const orderDay = new Date(2023, 6, 12, 10, 15, 42);
    const now = new Date(2018, 2, 12, 10, 15, 32)

    expect(expiredDeadline(deadline, orderDay, undefined, now)).toBe(false);
  });

  it("Expired Deadline - closed day", () => {
    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const orderDay = new Date(2023, 6, 12, 10, 15, 42);
    const now = new Date(2018, 2, 12, 10, 15, 32)
    const closed_date_map = new Map([
      [1, new ClosedDate(1, "2023-07-12")],
    ])

    expect(expiredDeadline(deadline, orderDay, closed_date_map, now)).toBe(true);
  });

  it("Expired Deadline - real example 1", () => {
    const deadline = new Deadline(1, DEADLINE_TYPES.DAILY, "13:00:00", undefined)
    const orderDate = new Date(2023, 7, 29, 12, 0, 0)
    const now = new Date(2023, 7, 28, 15, 4, 0);
    const closed_date_map = new Map([
      [1, new ClosedDate(1, "2023-07-12")],
    ])

    expect(expiredDeadline(deadline, orderDate, closed_date_map, now)).toBe(true);
  });


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
  });

  it("Get time stamp, string", () => {
    const timeStamp = new TimeStamp("11:55:33");

    expect(timeStamp.hour).toBe(11);
    expect(timeStamp.minute).toBe(55);
    expect(timeStamp.second).toBe(33);
  });

  it("Get time stamp, date", () => {
    const timeStamp = new TimeStamp(new Date(2018,5,6, 11, 55, 33));

    expect(timeStamp.hour).toBe(11);
    expect(timeStamp.minute).toBe(55);
    expect(timeStamp.second).toBe(33);
  });

  it("Throws error on unknown format", () => {
    expect(() => {new TimeStamp(145)}).toThrow("Unknown timestamp format");});

  it("Get time stamp, object", () => {
    const timeStamp = new TimeStamp({
      hour : 11,
      minute : 55,
      second : 33,
    });

    expect(timeStamp.hour).toBe(11);
    expect(timeStamp.minute).toBe(55);
    expect(timeStamp.second).toBe(33);
  });

  it("Compare time stamps", () => {
    const time_1 = new Date(2019,7,8, 15, 35, 48);
    const time_2 = new Date(2018,5,6, 11, 55, 33);

    const compared = compareTimeStamp(time_1, time_2)

    expect(compared.hour).toBe(4);
    expect(compared.minute).toBe(-20);
    expect(compared.second).toBe(15);
  });

  it("combine date and time string", () => {
    const inputDate = new Date(2013, 6, 11, 16,30,10);
    const timeStamp = "12:45:11"

    const result = combineDateAndTimeStamp(inputDate, timeStamp)
    expect(result.getFullYear()).toBe(2013)
    expect(result.getMonth()).toBe(6)
    expect(result.getDate()).toBe(11)
    expect(result.getHours()).toBe(12)
    expect(result.getMinutes()).toBe(45)
    expect(result.getSeconds()).toBe(11)
  })

  it("getTimeString string conversion", () => {
    const correct_res = "11:22:33"

    const timeString = "2011-07-05T09:22:33.000Z"; // TIME ZONE
    const timeDate = new Date(2011,6,5,11,22,33);

    expect(getTimeString(timeString)).toEqual(correct_res)
    expect(getTimeString(timeDate)).toEqual(correct_res)
  })
})
