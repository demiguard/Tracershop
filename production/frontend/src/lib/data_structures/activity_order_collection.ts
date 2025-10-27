

//#region ActivityOrderCollection

import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction,
  Customer, DeliveryEndpoint, Isotope, Tracer,
  TracershopState,
  User} from "~/dataclasses/dataclasses"
import { compareTimeStamp, TimeStamp } from "~/lib/chronomancy"
import { ORDER_STATUS } from "~/lib/constants"
import { decayCorrect, correctVialActivityToTime } from "~/lib/physics"
import { getId } from "~/lib/utils"
import { Vial } from "~/dataclasses/dataclasses"
import { OrderCollection } from "~/lib/data_structures/order_collection"
import { DATA_VIAL } from "../shared_constants"

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
export class ActivityOrderCollection extends OrderCollection {
  #contributing_orders : Array<ActivityOrder>
  #cancelled_orders : Array<ActivityOrder>

  /** Storage for the property ordered_date
   * @type{String}
  */
  #ordered_date : string

  /**
   * @desc Underlying collection that this class wraps, orders in this list
   * will be delivered to the same endpoint at same day.
   * @type {Array<ActivityOrder>}
   */ declare orders : Array<ActivityOrder>
  /**
   * @desc Time slot that {@link orders} will be delivered to.
   * @type {ActivityDeliveryTimeSlot}
   */ delivering_time_slot : ActivityDeliveryTimeSlot

  /**
   * @desc DeliveryEndpoint for {@link delivering_time_slot}
   */ endpoint : DeliveryEndpoint
  /**
   * @desc Owner of {@link endpoint} which take deliveries from {@link delivering_time_slot}
   */ owner : Customer
  /**
   * @desc Tracer for {@link delivering_time_slot}
   */ tracer : Tracer
  /**
   * @desc Isotope of the {@link tracer}
   */ isotope : Isotope
  /**
   * @desc The production for {@link delivering_time_slot}
   */ production : ActivityProduction
  /**
   * @desc If all orders of {@link orders}, then this string holds the time
   * the collection was freed
   */ freed_time : string | null
  /**
   * @desc If {@link orders} contains any orders, that do not delivery to the
   * time slot that they have been ordered to, then this is true otherwise false
   */ moved : boolean
  /**
   * @desc Combined ordered activity of {@link orders} with out overhead
   */ ordered_activity : number
  /**
   * @desc Combined activity ordered of {@link orders} with accounting for
   * overhead
   */ deliver_activity : number
  /**
   * @desc Activity released to fulfil {@link orders}
   */ delivered_activity : number

  /**
   * @desc ID of all orders in the collection of {@link orders}
   */ orderIDs : Array<number>

  /**
   * @desc If the orderCollection was freed, then this is the user that freed
   * them
   */ freed_by : User | null

  /**
   * @desc The overhead for the time slot
   */ overhead : number

  /**
   * @desc vials that were allocated to this order collection for fulfilling the
   * orders
   */ vials : Array<Vial>

  /**
   * @desc Vials that is or could be used to fulfill this order collection
   */ unassigned_vials : Array<Vial>

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
  */
  constructor(
    activity_orders : Array<ActivityOrder>,
    ordered_date: string,
    timeSlot: ActivityDeliveryTimeSlot,
    state: TracershopState,
    overhead = 1
  ) {
    // This class really suffers from bad abstraction, as it have been the
    // source of bugs much more frequently than other parts of the code.
    //
    // TBH it might because the constructor was written as a single function
    // Rather that several simpler functions, which also forces the abstraction
    // to become rather concrete. Because I think this class came about as
    // display holder class. I.E. Not it's own idea
    super(activity_orders)
    this.#ordered_date = ordered_date

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
    this.orderIDs = activity_orders.map(getId);
    this.vials = [];
    this.unassigned_vials = []

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
        this.deliver_activity += decayCorrect(this.isotope.halflife_seconds,
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
          this.delivered_activity += correctVialActivityToTime(
            vial,
            this.delivering_time_slot.delivery_time,
            this.isotope.halflife_seconds,
          );

          this.vials.push(vial);
        }
        if(vial.fill_date === this.#ordered_date
            && vial.owner === this.owner.id
            && vial.assigned_to === null){
          this.unassigned_vials.push(vial);
        };
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

  getVials(): any[] {
    return this.vials;
  }

  getVialType(): string {
    return DATA_VIAL;
  }
}
