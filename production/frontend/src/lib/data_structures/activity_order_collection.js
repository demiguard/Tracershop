

//#region ActivityOrderCollection

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction,
  Customer, DeliveryEndpoint, Isotope, Tracer,
  TracershopState } from "~/dataclasses/dataclasses"
import { compareTimeStamp } from "~/lib/chronomancy"
import { ORDER_STATUS } from "~/lib/constants"
import { calculateProduction } from "~/lib/physics"
import { getId } from "~/lib/utils"

/**
 * Wraps a group of orders, for the purpose of providing a single view of the
 * group.
 *
 * All orders must share the following properties to form a valid ActivityOrderCollection:
 * * ordered_date
 * * All orders must be scheduled to be delivered in the same time slot
 *
 * This property grants the following properties:
 * * Same Tracer and isotope because Time slots can only have a one production
 * * Same DeliveryEndpoint / Customer, with the same reasons
 *
 * One could think about an instance as the piece of paper a waiter write down a
 * group of people orders, which then gets handed to the kitchen.
 */
export class ActivityOrderCollection {
  #minimum_status
  #contributing_orders
  #cancelled_orders

  /** Storage for the property ordered_date
   * @type{String}
  */
  #ordered_date

  /**
   * @desc Underlying collection that this class wraps, orders in this list
   * will be delivered to the same endpoint at same day.
   * @type {Array<ActivityOrder>}
   */ orders
  /**
   * @desc Time slot that {@link orders} will be delivered to.
   * @type {ActivityDeliveryTimeSlot}
   */ delivering_time_slot


  /**
   * @desc DeliveryEndpoint for {@link delivering_time_slot}
   * @type {DeliveryEndpoint}
   */ endpoint
  /**
   * @desc Owner of {@link endpoint} which take deliveries from {@link delivering_time_slot}
   * @type {Customer}
   */ owner
  /**
   * @desc Tracer for {@link delivering_time_slot}
   * @type {Tracer}
   */ tracer
  /**
   * @desc Isotope of the {@link tracer}
   * @type {Isotope}
   */ isotope
  /**
   * @desc The production for {@link delivering_time_slot}
   * @type {ActivityProduction}
   */ production
  /**
   * @desc If all orders of {@link orders}, then this string holds the time
   * the collection was freed
   * @type {String | null}
   */ freed_time
  /**
   * @desc If {@link orders} contains any orders, that do not delivery to the
   * time slot that they have been ordered to, then this is true otherwise false
   * @type {Boolean}
   */ moved
  /**
   * @desc Combined ordered activity of {@link orders} with out overhead
   * @type {Number}
   */ ordered_activity
  /**
   * @desc Combined activity ordered of {@link orders} with accounting for
   * overhead
   * @type {Number}
   */ deliver_activity
  /**
   * @desc Activity released to fulfil {@link orders}
   * @type {Number}
   */ delivered_activity

  /**
   * @desc ID of all orders in the collection of {@link orders}
   * @type {Array<Number>}
   */ orderIDs

  /**
   * @desc If the orderCollection was freed, then this is the user that freed
   * them
   * @type {User | null}
   */ freed_by

  /**
   * @desc The overhead for the time slot
   * @type {Number}
   */ overhead

  /**
   * @desc vials that were allocated to this order collection for fulfilling the
   * orders
   * @type {Array<Vial>}
   */ vials

/**
  * Wraps a group of orders, for the purpose of providing a single view of the
  * group.
  *
  * All orders must share the following properties to form a valid ActivityOrderCollection:
  * * ordered_date
  * * tracer
  * * endpoint
  *
  * One could think about an instance as the piece of paper a waiter write down a
  * group of people orders, which then gets handed to the kitchen.
  * @param {Array<ActivityOrder>} activity_orders
  * @param {string} ordered_date
  * @param {ActivityDeliveryTimeSlot} timeSlot
  * @param {TracershopState} state
  * @param {number} [overhead=1]
  */
  constructor(activity_orders, ordered_date, timeSlot, state, overhead = 1) {
    // This class really suffers from bad abstraction, as it have been the
    // source of bugs much more frequently than other parts of the code.
    //
    // TBH it might because the constructor was written as a single function
    // Rather that several simpler functions, which also forces the abstraction
    // to become rather concrete. Because I think this class came about as
    // display holder class. I.E. Not it's own idea

    this.#ordered_date = ordered_date
    this.#minimum_status = ORDER_STATUS.CANCELLED;
    this.delivering_time_slot = (timeSlot instanceof ActivityDeliveryTimeSlot) ? timeSlot : state.deliver_times.get(timeSlot);
    this.endpoint = state.delivery_endpoint.get(this.delivering_time_slot.destination);
    this.production = state.production.get(this.delivering_time_slot.production_run);
    this.tracer = state.tracer.get(this.production.tracer);
    this.isotope = state.isotopes.get(this.tracer.isotope);
    this.owner = state.customer.get(this.endpoint.owner);
    this.overhead = overhead;
    this.freed_time = null;
    this.freed_by = null;
    this.moved = false;
    this.ordered_activity = 0;
    this.deliver_activity = 0;
    this.delivered_activity = 0;
    this.orders = activity_orders;
    this.orderIDs = activity_orders.map(getId);
    this.vial = [];

    this.#contributing_orders = [];
    this.#cancelled_orders = [];

    for(const order of activity_orders){
      if(this.#is_relevant_order(order)){
        if(this.#is_contributing_order(order)){
          this.#contributing_orders.push(order);
        } else {
          this.#cancelled_orders.push(order);
        }
      } else {
        continue;
      }
    }

    this.#set_minimum_status();

    for(const order of this.#cancelled_orders){
      // These Attributes will be overwritten by contributing orders if
      // applicable.
      this.freed_by = state.user.get(order.freed_by);
      this.freed_time = order.freed_datetime
      break;
    }

    for(const order of this.#contributing_orders) {
      const orderedToThisTimeSlot = order.ordered_time_slot === this.delivering_time_slot.id;
      // Update internal values
      const originalTimeSlot = state.deliver_times.get(order.ordered_time_slot);
      this.moved = this.moved || Boolean(orderedToThisTimeSlot && order.moved_to_time_slot);
      if(orderedToThisTimeSlot){
        this.ordered_activity += order.ordered_activity
        this.deliver_activity += order.ordered_activity * overhead;
      } else {
        const timeDelta = compareTimeStamp(originalTimeSlot.delivery_time,
                                           this.delivering_time_slot.delivery_time);
        this.deliver_activity += calculateProduction(this.isotope.halflife_seconds,
                                                     timeDelta.hour * 60 + timeDelta.minute,
                                                     order.ordered_activity) * overhead;
      }
      if(order.freed_datetime !== null){
        this.freed_time = order.freed_datetime;
      }
      if(order.freed_by !== null){
        this.freed_by = state.user.get(order.freed_by);
      }
    } // End of Order for loop;
    if(this.minimum_status === ORDER_STATUS.RELEASED){
      for(const vial of state.vial.values()){
        if (this.orderIDs.includes(vial.assigned_to)){
          this.delivered_activity += vial.activity;
          this.vials.push(vial);
        }
      }
    }
  }

  /**
   * @desc Shared date between {@link orders}
   * @type {String}
   */
  get ordered_date(){
    return this.#ordered_date
  }

  /**
   * @desc the minimum status among {@link orders} with the ordering:
   * AVAILABLE < ORDERED < ACCEPTED < RELEASED < CANCELLED < UNAVAILABLE
   * @type {ORDER_STATUS}
   */
  get minimum_status(){
    return this.#minimum_status;
  }

  get relevant_orders(){
    return this.#contributing_orders.concat(this.#cancelled_orders);
  }

  get is_cancelled(){
    return this.#contributing_orders.length === 0;
  }

  *[Symbol.iterator](){
    for(const order of this.#contributing_orders){
      yield order;
    }
  }

  /**Checks if an activity order is relevant for this order collection
   *
   * @param {ActivityOrder} order
   * @returns {Boolean}
   */
  #is_relevant_order(order){
    const belongs_to_correct_time_slot = [
      order.moved_to_time_slot,
      order.ordered_time_slot
    ].includes(this.delivering_time_slot.id);

    const belongs_to_correct_date = this.ordered_date === order.delivery_date;
    return belongs_to_correct_time_slot && belongs_to_correct_date;
  }

  /** Checks if an activity order should contribute to how much
   *
   * @param {ActivityOrder} order
   * @returns {Boolean}
   */
  #is_contributing_order(order){
    return [
      ORDER_STATUS.ACCEPTED,
      ORDER_STATUS.RELEASED,
      ORDER_STATUS.ORDERED
    ].includes(order.status)
  }

  /** Function with side effect of setting minimum_status to
   *
   * @param {Array<ActivityOrder>} relevant_orders List of Orders where each for
   * each order in relevant_orders: _is_relevant_order returns true
   */
  #set_minimum_status(){
    let minimum_status = ORDER_STATUS.CANCELLED;
    for(const order of this.relevant_orders){
      minimum_status = Math.min(minimum_status, order.status);
    }

    this.#minimum_status = minimum_status;
  }


}
