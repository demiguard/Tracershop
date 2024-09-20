const { Booking, Location, TracershopState, ClosedDate } = require("~/dataclasses/dataclasses");
const { bookingFilter, extractData } = require("~/lib/filters");
const { DATA_CLOSED_DATE } = require("~/lib/shared_constants");
const { toMapping } = require("~/lib/utils");


const locations = new Map([
  [1, new Location(1, "code_1", 1, "blah 1")],
  [2, new Location(2, "code_1", 2, "blah 1")],
])

describe("Filter test suites", () => {
  it("Container Extraction Closed dates, from state", () => {
    const closedDates = [new ClosedDate(1, "2024-01-02")]

    const testState = new TracershopState(
      undefined, // Logged in user
      undefined, // today
      undefined, // Address
      undefined, // Activity Orders
      toMapping(closedDates), // closedDates
    )

    const returnArray = extractData(testState, ClosedDate, DATA_CLOSED_DATE);

    expect(returnArray).toHaveLength(1);
    expect(returnArray[0]).toBe(closedDates[0]);
  });

  it("Container Extraction Closed dates, from Type", () => {
    const closedDate = new ClosedDate(1, "2024-01-02");
    const returnArray = extractData(closedDate, ClosedDate, DATA_CLOSED_DATE);

    expect(returnArray).toHaveLength(1);
    expect(returnArray[0]).toBe(closedDate);
  });



  it("Booking Date filter", () => {
    const bookings = [
      new Booking( 1,  1,  1,  1, "asdf", "10:30:00", "2020-05-04"),
      new Booking( 2,  1,  1,  1, "asdf", "10:30:00", "2020-11-04"),
      new Booking( 3,  1,  2,  1, "asdf", "10:30:00", "2020-05-04"),
    ];

    const res = bookingFilter(bookings, { active_date : "2020-05-04"});

    expect(res[0]).toBe(bookings[0]);
    expect(res.length).toBe(2);
  });
})
