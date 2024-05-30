import { ActivityDeliveryTimeSlot, ActivityProduction, ClosedDate, Deadline } from "../../dataclasses/dataclasses"
import { calculateDeadline, combineDateAndTimeStamp, compareTimeStamp, evalBitChain, expiredDeadline, getBitChain, TimeStamp, getTimeString, datify, getToday, DateRange } from "../../lib/chronomancy"
import { DEADLINE_TYPES, WEEKLY_REPEAT_CHOICES } from "../../lib/constants"




describe("Chronomancy test suit", () => {
  it("today test, typesafety", () => {
    expect(getToday()).toBeInstanceOf(Date);
  })

  it("Datify, a date",() => {
    expect(datify(new Date())).toBeInstanceOf(Date);
    expect(datify("2023-11-11")).toBeInstanceOf(Date);
  })

  //#region Deadline Tests
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


  //#region Timestamp tests
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
    expect(() => {new TimeStamp(145)}).toThrow();
  });

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

    expect(compared.hour).toBe(3);
    expect(compared.minute).toBe(40);
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

  it("compare timestamp, negative seconds", () => {
    const compared = compareTimeStamp(new TimeStamp(1,0,0), new TimeStamp(0,0,1))
    expect(compared.hour).toBe(0);
    expect(compared.minute).toBe(59);
    expect(compared.second).toBe(59);
  })

  it("getTimeString string conversion", () => {
    const correct_res = "11:22:33"

    const timeString = "2011-07-05T09:22:33.000Z"; // TIME ZONE
    const timeDate = new Date(2011,6,5,11,22,33);

    expect(getTimeString(timeString)).toEqual(correct_res)
    expect(getTimeString(timeDate)).toEqual(correct_res)
  });

  it("Timestamp to minutes", () => {
    expect(new TimeStamp(1, 2 , 3).toMinutes()).toEqual(62);
  });

  it("Timestamp to minutes string", () => {
    expect(new TimeStamp(1, 2, 3).toVerboseString()).toEqual("1 time 2 minutter");
    expect(new TimeStamp(2, 2, 3).toVerboseString()).toEqual("2 timer 2 minutter");
    expect(new TimeStamp(2, 1, 3).toVerboseString()).toEqual("2 timer 1 minut");
  });

  it("Time stamp display string", () => {
    expect(new TimeStamp(1,3,0).toDisplayString()).toEqual("01:03:00")
  });

  //#region DateRange Tests
  it("DateRange, string construction", () => {
    const dr = new DateRange("2011-11-11", "2021-11-11")

    expect(dr.startDate).toBeInstanceOf(Date);
    expect(dr.endDate).toBeInstanceOf(Date);
    expect(dr.startDate.getFullYear()).toEqual(2011);
    expect(dr.endDate.getFullYear()).toEqual(2021);
  });

  it("DateRange, invalid construction", () => {
    expect(() => {new DateRange()}).toThrow("Invalid input date");
  });

  it("in range test", () => {
    const dr = new DateRange("2011-11-11", "2021-11-11")
    expect(dr.in_range("2011-12-10")).toBe(true);
    expect(dr.in_range("2011-10-10")).toBe(false);
    expect(dr.in_range("2021-12-10")).toBe(false);
    expect(dr.in_range("2021-10-10")).toBe(true);

    expect(() => {
      dr.in_range();
    }).toThrow();
  })
})
