const { Booking, Location } = require("~/dataclasses/dataclasses");
const { bookingFilter } = require("~/lib/filters");


const locations = new Map([
  [1, new Location(1, "code_1", 1, "blah 1")],
  [2, new Location(2, "code_1", 2, "blah 1")],
])

describe("Booking Filter test suite", () => {
  it("1", () => {
    const bookings = [
      {id : 1, status : 1, location :  1, procedure : 1, accession_number : "asdf", start_time : "10:30:00", start_date : "2020-05-04"},
      {id : 2, status : 1, location :  1, procedure : 1, accession_number : "asdf", start_time : "10:30:00", start_date : "2020-11-04"},
      {id : 3, status : 1, location :  2, procedure : 1, accession_number : "asdf", start_time : "10:30:00", start_date : "2020-05-04"},
    ]

    const res = bookings.filter(bookingFilter(
      "2020-05-04", locations, 1
    ));

    expect(res[0]).toBe(bookings[0]);
    expect(res.length).toBe(1);
  });
});