import { Booking } from "~/dataclasses/dataclasses";
import { BookingStatus } from "~/lib/shared_constants";

export const bookings = new Map([
  [1, new Booking(1, BookingStatus.Initial,  1, 1, "Accession 1", "10:30:00", "2020-05-04")],
  [2, new Booking(2, BookingStatus.Initial,  1, 1, "Accession 2", "11:30:00", "2020-05-04")],
  [3, new Booking(3, BookingStatus.Initial,  2, 1, "Accession 3", "09:30:00", "2020-05-04")],
  [4, new Booking(4, BookingStatus.Initial,  1, 1, "Accession 4", "09:45:00", "2020-05-11")],
  [5, new Booking(5, BookingStatus.Initial, 13, 1, "Accession 5", "09:30:00", "2020-05-04")],
  [7, new Booking(7, BookingStatus.Initial,  1, 5, "Accession 7", "09:30:00", "2020-05-04")],
  [8, new Booking(8, BookingStatus.Initial,  1, 2, "Accession 7", "09:30:00", "2020-05-04")],
  [9, new Booking(9, BookingStatus.Initial,  1, 1, "Accession 1", "08:30:00", "2020-05-04")],

  // Customer 2
  [6, new Booking(6, BookingStatus.Initial, 16, 1, "Accession 16", "09:30:00", "2020-05-04")],
])