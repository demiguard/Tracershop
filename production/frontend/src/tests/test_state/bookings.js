import { Booking } from "~/dataclasses/dataclasses";

export const bookings = new Map([
  [1, new Booking(1, 1, 1, 1, "Accession 1", "10:30:00", "2020-05-04")],
  [2, new Booking(2, 1, 1, 1, "Accession 2", "11:30:00", "2020-05-04")],
  [3, new Booking(3, 1, 2, 1, "Accession 3", "09:30:00", "2020-05-04")],
  [4, new Booking(4, 1, 1, 1, "Accession 4", "09:45:00", "2020-05-11")],
  [5, new Booking(5, 1,13, 1, "Accession 5", "09:30:00", "2020-05-04")],

  // Customer 2
  [6, new Booking(6, 1, 16, 1, "Accession 6", "09:30:00", "2020-05-04")],
])