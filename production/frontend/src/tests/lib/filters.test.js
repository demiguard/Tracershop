const { Booking, Location } = require("~/dataclasses/dataclasses");
const { bookingFilter } = require("~/lib/filters");


const locations = new Map([
  [1, new Location(1, "code_1", 1, "blah 1")],
  [2, new Location(2, "code_1", 2, "blah 1")],
])

describe("Booking Filter test suite", () => {
  it("1", () => {
    const bookings = [
      new Booking( 1,  1,  1,  1, "asdf", "10:30:00", "2020-05-04"),
      new Booking( 2,  1,  1,  1, "asdf", "10:30:00", "2020-11-04"),
      new Booking( 3,  1,  2,  1, "asdf", "10:30:00", "2020-05-04"),
    ];

    const res = bookingFilter(bookings, { active_date : "2020-05-04"});

    expect(res[0]).toBe(bookings[0]);
    expect(res.length).toBe(2);
  });
});