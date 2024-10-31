import { describe, expect, jest } from '@jest/globals'
import { Procedure, ProcedureIdentifier, Tracer, TracershopState, Location, Booking, DeliveryEndpoint, ActivityDeliveryTimeSlot } from '~/dataclasses/dataclasses';
import { TRACER_TYPE } from '~/lib/constants';
import { BOOKING_SORTING_METHODS, PROCEDURE_SORTING, sort_procedures, sortBookings, sortTimeSlots } from '~/lib/sorting';
import { toMapping } from '~/lib/utils';

describe("Sortprocedure Test suite", () => {
  it("sort procedure", () => {
    const state = new TracershopState();

    state.procedure_identifier = toMapping([
      new ProcedureIdentifier(1, "Code 1", "Desc 1", false),
      new ProcedureIdentifier(2, "Code 2", "Desc 2", false),
      new ProcedureIdentifier(3, "Code 3", "Desc 3", false),
    ])

    state.tracer = toMapping([
      new Tracer(1, "", "", undefined, TRACER_TYPE.ACTIVITY, undefined, false, true),
      new Tracer(2, "", "", undefined, TRACER_TYPE.ACTIVITY, undefined, false, true),
    ])

    const procedures = [
      new Procedure(1, 1, 1000, 0, 1, null),
      new Procedure(2, 1, 20, 1, null, null),
      new Procedure(3, 2, 500, 2, 2, null),
      new Procedure(4, 3, 200, 6, 1, null),
      new Procedure(5, 1, 10, 3, 1, null),
      new Procedure(6, null, 0, 0, null, null),
      new Procedure(7, 1, 10, 0, 1, null),
    ]

    const sorted_procedures = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.UNITS))
    expect(sorted_procedures[0]).toBe(procedures[5])

    const sorted_tracer_procedure = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.TRACER))
    expect(sorted_tracer_procedure[4]).toBe(procedures[2]);
    expect(sorted_tracer_procedure[5]).toBe(procedures[1]);
    expect(sorted_tracer_procedure[6]).toBe(procedures[5]);

    const sorted_procedure_procedures = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.PROCEDURE_CODE));
    expect(sorted_procedure_procedures[6]).toBe(procedures[5]);
    expect(sorted_procedure_procedures[5]).toBe(procedures[3]);
    expect(sorted_procedure_procedures[4]).toBe(procedures[2]);

    const sorted_prodedure_delay = [...procedures].sort(sort_procedures(state, PROCEDURE_SORTING.DELAY));
    expect(sorted_prodedure_delay[3]).toBe(procedures[1]);
    expect(sorted_prodedure_delay[6]).toBe(procedures[3]);
    expect(sorted_prodedure_delay[5]).toBe(procedures[4]);

    expect(() => {[...procedures].sort(sort_procedures(state, 12342352))}).toThrow("UNDEFINED SORTING METHOD!")
  });

describe("sortTimeSlots Test Suite", () => {
  const timeSlots = [
    new ActivityDeliveryTimeSlot(null, null, "10:00:00", 1, null, null),
    new ActivityDeliveryTimeSlot(null, null, "10:00:00", 2, null, null),
    new ActivityDeliveryTimeSlot(null, null, "10:00:00", 3, null, null),
    new ActivityDeliveryTimeSlot(null, null, "12:00:00", 1, null, null)
  ]

  const endpoints = [
    new DeliveryEndpoint(1, null, null, null, null, null, 2),
    new DeliveryEndpoint(2, null, null, null, null, null, 1),
    new DeliveryEndpoint(3, null, null, null, null, null, 2),
  ]

  const TSsort = sortTimeSlots(toMapping(endpoints));
  
  it("Sorts by costumer", () => {
    expect(TSsort(timeSlots[0], timeSlots[1])).toEqual(1);
    expect(TSsort(timeSlots[1], timeSlots[0])).toEqual(-1);
  })

  it("sorts by destination", () => {
    expect(TSsort(timeSlots[0], timeSlots[2])).toEqual(-2);
    expect(TSsort(timeSlots[2], timeSlots[0])).toEqual(2); 
  })

  it("sorts by delivery time", () => {
    expect(TSsort(timeSlots[0],timeSlots[3])).toEqual(-1) //I think this should be opposite, according to documentation in sorting.js ¯\_(ツ)_/¯
    expect(TSsort(timeSlots[3],timeSlots[0])).toEqual(1)
  })
})



});

describe("sortBookings Test Suite", () => {
  const locations = [
    new Location(1, null, null, "A" ),
    new Location(2, null, null, "B" ),
    new Location(3, null, null, undefined) //no common_name
  ]

  const procedures = [
    new Procedure(1, 1, null, null, null, null),
    new Procedure(2, 2, null, null, null, null),
    new Procedure(3, 3, null, null, null, null) //no series_description
  ]

  //Test bookings, only used fields are given value.
  const bookings = [
    new Booking(null, null, 1, 1, "B", "11:00:00"),
    new Booking(null, null, 2, 2, "A", "10:00:00"),
    new Booking(null, null, 3, 3, null, "10:00:00"),
    new Booking(null, null, null, null, null, "10:00:00")
  ]

  const stdBooking = sortBookings(); //default
  const std2Booking = sortBookings(BOOKING_SORTING_METHODS.length +1); //also default
  const ascBooking = sortBookings(BOOKING_SORTING_METHODS.ACCESSION_NUMBER); //accession number

  //setting up a Tracershop state
  const state = new TracershopState();
  state.location = toMapping(locations);
  state.procedure = toMapping(procedures);
  state.procedure_identifier = toMapping(
    [new ProcedureIdentifier(1, null, "A"), 
      new ProcedureIdentifier(2, null, "B"), 
      new ProcedureIdentifier(3, null, undefined) //no series_description
    ]);


  const prcBooking = sortBookings(BOOKING_SORTING_METHODS.SERIES_DESCRIPTION, state); //Series description (procedure)
  const locBooking = sortBookings(BOOKING_SORTING_METHODS.LOCATION, state); //location
    
    //Missing state
  it("throws errors", () => {
    expect(() => {sortBookings(2)}).toThrow("Cannot sort bookings based on Series Description without Tracershop state");
    expect(() => {sortBookings(3)}).toThrow("Cannot sort bookings based on Series Description without Tracershop state");
  });

  //Testing for existing parameters--

  it("tests default booking sorting", () => {
    expect(stdBooking(bookings[1], bookings[0])).toEqual(-1);
    expect(std2Booking(bookings[0], bookings[1])).toEqual(1);
  });

  it("tests accession number sorting", () => {
    expect(ascBooking(bookings[1], bookings[0])).toEqual(-1);
    expect(ascBooking(bookings[0], bookings[1])).toEqual(1);
  })

  it("tests series description sorting", () => {
    expect(prcBooking(bookings[0], bookings[1])).toEqual(-1);
    expect(prcBooking(bookings[1], bookings[0])).toEqual(1);
  })


  it("tests location sorting", () => {
    expect(locBooking(bookings[0], bookings[1])).toEqual(-1);
    expect(locBooking(bookings[1], bookings[0])).toEqual(1);
  })

  //edgecase testing--

  it("Resorts to default testing", () =>{
    //if a parameter is missing--
    //missing series description
    expect(prcBooking(bookings[2], bookings[0])).toEqual(-1);
    expect(prcBooking(bookings[0], bookings[2])).toEqual(1);
    
    //missing common name
    expect(locBooking(bookings[2], bookings[0])).toEqual(-1);
    expect(locBooking(bookings[0], bookings[2])).toEqual(1);

    //missing procedure
    expect(prcBooking(bookings[3], bookings[0])).toEqual(-1);
    expect(prcBooking(bookings[0], bookings[3])).toEqual(1);

    //missing location
    expect(locBooking(bookings[3], bookings[0])).toEqual(-1);
    expect(locBooking(bookings[0], bookings[3])).toEqual(1);

    //if they have the same sorting criteria
    expect(prcBooking(bookings[2], bookings[2])).toEqual(-1);
    expect(locBooking(bookings[2], bookings[2])).toEqual(-1);

  })

})