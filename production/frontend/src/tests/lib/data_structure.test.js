/**
 * @jest-environment jsdom
 */

const { ActivityProduction, ActivityDeliveryTimeSlot, Tracer, TracerCatalogPage, TracershopState } = require("~/dataclasses/dataclasses");
const { WEEKLY_REPEAT_CHOICES, TRACER_TYPE } = require("~/lib/constants");
const { TimeSlotBitChain, TracerCatalog, CustomerCatalog, EndpointCatalog } = require("~/lib/data_structures");
const { WebSocket } = require('ws');

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

describe("Tracer catalog Tests", () => {
  it("Empty Tracer catalog", () => {
    const tracerCatalog = new TracerCatalog(new Map(), new Map());

    const empty_endpoint_catalog = tracerCatalog.getCatalog(1)

    expect(empty_endpoint_catalog).toBeInstanceOf(EndpointCatalog);
    expect(empty_endpoint_catalog.tracerCatalogActivity).toStrictEqual([]);
    expect(empty_endpoint_catalog.tracerCatalogInjections).toStrictEqual([]);
    expect(tracerCatalog.getActivityCatalog(1)).toStrictEqual([]);
    expect(tracerCatalog.getInjectionCatalog(1)).toStrictEqual([]);
  });

  it("My Own Test data", () =>  {
    const tracer = new Tracer(
      1, "name", "" , 1, TRACER_TYPE.ACTIVITY, null, null, null,
    );


    const tracerCatalog = new TracerCatalog(
      new Map([
        [1, new TracerCatalogPage(1, 1, 1, null, 1.5)]
      ]),
      new Map([
        [1, tracer]
      ])
    );

    const endpoint_catalog = tracerCatalog.getCatalog(1);
    expect(endpoint_catalog).toBeInstanceOf(EndpointCatalog);
    expect(endpoint_catalog.tracerCatalogActivity).toStrictEqual([tracer]);
    expect(endpoint_catalog.tracerCatalogInjections).toStrictEqual([]);
    expect(tracerCatalog.getActivityCatalog(1)).toStrictEqual([tracer]);
    expect(tracerCatalog.getActivityCatalog(2)).toStrictEqual([]);
    expect(tracerCatalog.getInjectionCatalog(1)).toStrictEqual([]);
  });
});

describe("ActivityOrderCollection", () => {
  const state = new TracershopState();
  state.deliver_times = new Map([

  ]);
  state.production = new Map([

  ]);

  it("Creation Test", () => {



  })
});