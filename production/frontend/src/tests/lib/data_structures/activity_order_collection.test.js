/**
 * @jest-environment jsdom
 */

const { ActivityProduction, ActivityDeliveryTimeSlot, Tracer, TracerCatalogPage, TracershopState, Isotope, Customer, DeliveryEndpoint, ActivityOrder, User, Vial } = require("~/dataclasses/dataclasses");
const { WEEKLY_REPEAT_CHOICES, TRACER_TYPE, DAYS, ORDER_STATUS, USER_GROUPS } = require("~/lib/constants");
const { ActivityOrderCollection } = require("~/lib/data_structures/activity_order_collection");
const { toMapping } = require("~/lib/utils");



describe("ActivityOrderCollection", () => {
  // Well this is a very fancy way of writing before all
  // Not
  const tracer_id  = 1;
  const isotope_id = 2;
  const ordered_date = "2024-12-02"

  const customer_id = 3;
  const endpoint_id = 4;

  const production_1_id = 5;
  const production_2_id = 6;

  const time_slot_1_id = 7;
  const time_slot_2_id = 8;

  const active_user_id = 9;
  const freeing_user_id = 10;

  const vial_id = 11;
  const vial_related_order_id = 12;
  const vial_activity = 1200;


  const state = new TracershopState();
  state.isotopes = toMapping([
    new Isotope(isotope_id, 1, 1 , 60 * 60, 'l', true)
  ]);

  state.tracer = toMapping([
    new Tracer(tracer_id, 't', 'tee', isotope_id, TRACER_TYPE.ACTIVITY, 't', false, false, true)
  ]);

  state.production = toMapping([
    new ActivityProduction(production_1_id, DAYS.MONDAY, tracer_id, "07:00:00", true),
    new ActivityProduction(production_2_id, DAYS.MONDAY, tracer_id, "10:00:00", true)
  ]);

  state.customer = toMapping([
    new Customer(customer_id, "not relevant", "Really not relevant", 1, null, null, null, null, null, null)
  ]);

  state.delivery_endpoint = toMapping([
    new DeliveryEndpoint(endpoint_id, null, null, null, null, null, customer_id)
  ]);

  state.deliver_times = toMapping([
    new ActivityDeliveryTimeSlot(time_slot_1_id, WEEKLY_REPEAT_CHOICES.ALL, "08:00:00", endpoint_id, production_1_id, null),
    new ActivityDeliveryTimeSlot(time_slot_2_id, WEEKLY_REPEAT_CHOICES.ALL, "11:00:00", endpoint_id, production_2_id, null),
  ]);

  state.user = toMapping([
      new User(null, active_user_id, "ordering_user", USER_GROUPS.SHOP_USER, true),
      new User(null, freeing_user_id, "freeing_user", USER_GROUPS.SHOP_USER, true)
  ]);

  state.vial = toMapping([
    new Vial(vial_id, tracer_id, vial_activity, 10.0, "t-20241202-1", "07:51:00", ordered_date, vial_related_order_id, customer_id)
  ])

  it("Easy tests - Status Ordered", () => {
    const orders = [
      new ActivityOrder(8, 1000, ordered_date, ORDER_STATUS.ORDERED, "", time_slot_1_id, null, null, active_user_id)
    ];

    const test_data_structure = new ActivityOrderCollection(
      orders, ordered_date, state.deliver_times.get(time_slot_1_id), state, 1.25
    );

    expect(test_data_structure.delivering_time_slot).toBe(state.deliver_times.get(time_slot_1_id));
    expect(test_data_structure.endpoint).toBe(state.delivery_endpoint.get(endpoint_id));
    expect(test_data_structure.minimum_status).toBe(ORDER_STATUS.ORDERED);
    expect(test_data_structure.is_cancelled).toBe(false);
    expect(test_data_structure.ordered_activity).toBe(1000);
    expect(test_data_structure.isotope).toBe(state.isotopes.get(isotope_id));
    expect(test_data_structure.moved).toBe(false);
  });


  it("Easy tests - Status Released", () => {
    const orders = [
      new ActivityOrder(vial_related_order_id,
                        1000,
                        ordered_date,
                        ORDER_STATUS.RELEASED,
                        "",
                        time_slot_1_id,
                        null,
                        "2024-12-02 07:49:44",
                        active_user_id,
                        freeing_user_id)
    ];

    const test_data_structure = new ActivityOrderCollection(
      orders, ordered_date, state.deliver_times.get(time_slot_1_id), state, 1.25
    );

    expect(test_data_structure.delivering_time_slot).toBe(state.deliver_times.get(time_slot_1_id));
    expect(test_data_structure.endpoint).toBe(state.delivery_endpoint.get(endpoint_id));
    expect(test_data_structure.minimum_status).toBe(ORDER_STATUS.RELEASED);
    expect(test_data_structure.is_cancelled).toBe(false);
    expect(test_data_structure.ordered_activity).toBe(1000);
    expect(test_data_structure.deliver_activity).toBe(1250);
    expect(test_data_structure.isotope).toBe(state.isotopes.get(isotope_id));
    expect(test_data_structure.moved).toBe(false);
  });

  it("Easy tests - Status Cancelled", () => {
    const orders = [
      new ActivityOrder(8, 1000, ordered_date, ORDER_STATUS.CANCELLED, "", time_slot_1_id, null, "2024-12-02 07:49:44", active_user_id, freeing_user_id)
    ];

    const test_data_structure = new ActivityOrderCollection(
      orders, ordered_date, state.deliver_times.get(time_slot_1_id), state, 1.25
    );

    expect(test_data_structure.delivering_time_slot).toBe(state.deliver_times.get(time_slot_1_id));
    expect(test_data_structure.endpoint).toBe(state.delivery_endpoint.get(endpoint_id));
    expect(test_data_structure.minimum_status).toBe(ORDER_STATUS.CANCELLED);
    expect(test_data_structure.is_cancelled).toBe(true);
    expect(test_data_structure.ordered_activity).toBe(0);
    expect(test_data_structure.deliver_activity).toBe(0);
    expect(test_data_structure.freed_by).toBe(state.user.get(freeing_user_id));
    expect(test_data_structure.freed_time).toBe("2024-12-02 07:49:44");
    expect(test_data_structure.isotope).toBe(state.isotopes.get(isotope_id));
    expect(test_data_structure.moved).toBe(false);
  });

  it("Isolation test from orders that could be related", () => {
    const orders = [
      new ActivityOrder(8, 1000, ordered_date, ORDER_STATUS.RELEASED, "", time_slot_1_id, null, null, active_user_id, freeing_user_id),
      new ActivityOrder(9, 1000, ordered_date, ORDER_STATUS.ACCEPTED, "", time_slot_2_id, null, null, active_user_id, null)
    ];

    const test_data_structure = new ActivityOrderCollection(
      orders, ordered_date,  state.deliver_times.get(time_slot_1_id), state, 1.25
    );

    expect(test_data_structure.delivering_time_slot).toBe(state.deliver_times.get(time_slot_1_id));
    expect(test_data_structure.endpoint).toBe(state.delivery_endpoint.get(endpoint_id));
    expect(test_data_structure.minimum_status).toBe(ORDER_STATUS.ACCEPTED);
    expect(test_data_structure.isotope).toBe(state.isotopes.get(isotope_id));
    expect(test_data_structure.moved).toBe(false);
  });

  it("Moved Orders and activity calculation!", () => {
    const orders = [
      new ActivityOrder(8, 1000, ordered_date, ORDER_STATUS.ACCEPTED, "", time_slot_1_id, null, null, active_user_id),
      new ActivityOrder(9, 1000, ordered_date, ORDER_STATUS.ACCEPTED, "", time_slot_2_id, time_slot_1_id, null, active_user_id, null)
    ];

    const test_data_structure = new ActivityOrderCollection(
      orders, ordered_date,  state.deliver_times.get(time_slot_1_id), state, 1.25
    );

    expect(test_data_structure.delivering_time_slot).toBe(state.deliver_times.get(time_slot_1_id));
    expect(test_data_structure.endpoint).toBe(state.delivery_endpoint.get(endpoint_id));
    expect(test_data_structure.minimum_status).toBe(ORDER_STATUS.ACCEPTED);
    expect(test_data_structure.ordered_activity).toBe(1000);
    expect(test_data_structure.deliver_activity).toBe(1000 * 1.25 + 1000 * 8 * 1.25);
    expect(test_data_structure.isotope).toBe(state.isotopes.get(isotope_id));
    expect(test_data_structure.moved).toBe(false);
  });

  it("Appear moved when all is moved", () => {
    const orders = [
      new ActivityOrder(9, 1000, ordered_date, ORDER_STATUS.ACCEPTED, "", time_slot_2_id, time_slot_1_id, null, active_user_id, null)
    ];

    const test_data_structure = new ActivityOrderCollection(
      orders, ordered_date,  state.deliver_times.get(time_slot_2_id), state, 1.25
    );

    expect(test_data_structure.moved).toBe(true);
  })
});