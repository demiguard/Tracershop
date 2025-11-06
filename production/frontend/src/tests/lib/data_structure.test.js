/**
 * @jest-environment jsdom
 */
import { expect, jest } from '@jest/globals'
import { ActivityOrderCollection } from '~/lib/data_structures/activity_order_collection';
import { DATA_DELIVER_TIME, DATA_PRODUCTION, DATA_TRACER, DATA_TRACER_MAPPING } from '~/lib/shared_constants';
import { getModifiedTestState, testState } from '~/tests/app_state';

const { ActivityProduction, ActivityDeliveryTimeSlot, Tracer, TracerCatalogPage, TracershopState, Isotope, Customer, DeliveryEndpoint, ActivityOrder, User, Vial } = require("~/dataclasses/dataclasses");
const { WEEKLY_REPEAT_CHOICES, TRACER_TYPE, DAYS, ORDER_STATUS, USER_GROUPS } = require("~/lib/constants");
const { TimeSlotBitChain } = require("~/lib/data_structures/bit_chains");
const { TracerCatalog, EndpointCatalog } = require('~/contexts/tracer_catalog');

describe("Bit chains test sweep", () => {
  it("Bit chain", () => {
    const production = new Map([
      [1, new ActivityProduction(1, DAYS.MONDAY, 1, "07:00:00", null)],
      [2, new ActivityProduction(2, DAYS.TUESDAY, 1, "07:00:00", null)],
      [3, new ActivityProduction(3, DAYS.WENDSDAY, 1, "07:00:00", null)],
    ]);

    const timeSlots = [new ActivityDeliveryTimeSlot(
      1, WEEKLY_REPEAT_CHOICES.ALL, "08:15:00", null, 1, null
    ), new ActivityDeliveryTimeSlot(
      2, WEEKLY_REPEAT_CHOICES.EVEN, "08:15:00", null, 2, null
    ), new ActivityDeliveryTimeSlot(
      3, WEEKLY_REPEAT_CHOICES.ODD, "08:15:00", null, 3, null
    )];

    const modState = getModifiedTestState({
      [DATA_PRODUCTION] : production,
      [DATA_DELIVER_TIME] : timeSlots
    })

    const bitChain = new TimeSlotBitChain(timeSlots, modState);

    expect(bitChain.chain).toEqual(0x283)
  })

  it("Evaluate Bit chain", () => {
    const production = new Map([
      [1, new ActivityProduction(1, DAYS.MONDAY, 1, "07:00:00", null)],
      [2, new ActivityProduction(2, DAYS.TUESDAY, 1, "07:00:00", null)],
      [3, new ActivityProduction(3, DAYS.WENDSDAY, 1, "07:00:00", null)],
    ]);

    const timeSlots = [new ActivityDeliveryTimeSlot(
      1, WEEKLY_REPEAT_CHOICES.ALL, "08:15:00", null, 1, null
    ), new ActivityDeliveryTimeSlot(
      2, WEEKLY_REPEAT_CHOICES.EVEN, "08:15:00", null, 2, null
    ), new ActivityDeliveryTimeSlot(
      3, WEEKLY_REPEAT_CHOICES.ODD, "08:15:00", null, 3, null
    )];

    const modState = getModifiedTestState({
      [DATA_PRODUCTION] : production,
      [DATA_DELIVER_TIME] : timeSlots
    })

    const bitChain = new TimeSlotBitChain(timeSlots, modState)

    expect(bitChain.eval(new Date(2018, 2, 12, 13, 5))).toBeTruthy()
  });
})

describe("Tracer catalog Tests", () => {
  it("Empty Tracer catalog", () => {
    const tracerCatalog = new TracerCatalog(new TracershopState());
    const empty_endpoint_catalog = tracerCatalog.getCatalog(1)

    expect(empty_endpoint_catalog).toBeInstanceOf(EndpointCatalog);
    expect(empty_endpoint_catalog.tracerCatalogActivity).toEqualSet([]);
    expect(empty_endpoint_catalog.tracerCatalogInjections).toEqualSet([]);
    expect(tracerCatalog.getActivityCatalog(1)).toEqualSet([]);
    expect(tracerCatalog.getInjectionCatalog(1)).toEqualSet([]);

  });

  it("My Own Test data", () =>  {
    const tracer = new Tracer(
      1, "name", "" , 1, TRACER_TYPE.ACTIVITY, null, null, null,
    );


    const newTracerCatalogPages = new Map([
        [1, new TracerCatalogPage(1, 1, 1, null, 1.5)]
    ])

    const newTracers = new Map([
        [1, tracer]
    ])

    const modState = getModifiedTestState({
      [DATA_TRACER] : newTracers,
      [DATA_TRACER_MAPPING] : newTracerCatalogPages
    })

    const tracerCatalog = new TracerCatalog(modState)

    const endpoint_catalog = tracerCatalog.getCatalog(1);
    expect(endpoint_catalog).toBeInstanceOf(EndpointCatalog);
    expect(endpoint_catalog.tracerCatalogActivity).toEqualSet([tracer.id]);
    expect(endpoint_catalog.tracerCatalogInjections).toEqualSet();
    expect(tracerCatalog.getActivityCatalog(1)).toEqualSet([tracer.id]);
    expect(tracerCatalog.getActivityCatalog(2)).toEqualSet([]);
    expect(tracerCatalog.getInjectionCatalog(1)).toEqualSet([]);
  });
});

describe("ActivityOrderCollectionTests", () => {
  // As a point of order there's also specialized tests in /tests/lib/data_structures.
  // But w/e
  const testDateString = "2020-10-07"; // Note that this is very specifically not the date in testState
  // Tracer 1, Isotope 1
  const defaultTestTimeSlot = testState.deliver_times.get(7);

  it("Empty Activity Order Collection", () => {
    expect(defaultTestTimeSlot).toBeInstanceOf(ActivityDeliveryTimeSlot);

    const emptyActivityOrderCollection = new ActivityOrderCollection(
      [], testDateString, defaultTestTimeSlot, testState, 1.0
    );

    expect(emptyActivityOrderCollection.minimum_status).toBe(ORDER_STATUS.EMPTY);
    expect(emptyActivityOrderCollection.tracer).toBe(testState.tracer.get(1));
    expect(emptyActivityOrderCollection.isotope).toBe(testState.isotopes.get(1));
    expect(emptyActivityOrderCollection.orders.length).toBe(0);
    expect(emptyActivityOrderCollection.ordered_date).toBe(testDateString);
  });


  it("Cancelled Activity Order Collection", () => {
    const newOrder = new ActivityOrder(
      1, 1000, testDateString, ORDER_STATUS.CANCELLED, "", defaultTestTimeSlot.id, null, null, null, null
    );


    const emptyActivityOrderCollection = new ActivityOrderCollection(
      [newOrder], testDateString, defaultTestTimeSlot, testState, 1.0
    );

    expect(emptyActivityOrderCollection.minimum_status).toBe(ORDER_STATUS.CANCELLED);
    expect(emptyActivityOrderCollection.tracer).toBe(testState.tracer.get(1));
    expect(emptyActivityOrderCollection.isotope).toBe(testState.isotopes.get(1));
    expect(emptyActivityOrderCollection.orders.length).toBe(1);
    expect(emptyActivityOrderCollection.ordered_date).toBe(testDateString);
  });
});