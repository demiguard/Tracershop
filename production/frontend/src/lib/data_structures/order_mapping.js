import { ActivityOrder, TracershopState } from "~/dataclasses/dataclasses";
import { ArrayMap } from "~/lib/array_map";
import { getTimeSlotOwner } from "~/lib/data_structures.js";
import { TracerCatalog } from '~/effects/tracerCatalog';
import { ActivityOrderCollection } from "~/lib/data_structures/activity_order_collection";
import { sortActivityOrderCollections, sortTimeSlots } from "~/lib/sorting";


/**
 * Creates a mapping over time slots with which orders should be rendered under the time slot
 * If a time slot is missing from the map, that means it should not be rendered.
 *
 */
export class OrderMapping{
  /**@type {Map<Number, ActivityOrder>} */ _orderMapping
  /**@type {TracershopState} */ _state

  /**
   *
   * @param {Array<ActivityOrder>} orders
   * @param {*} ordered_date
   * @param {TracerCatalog} tracerCatalog
   * @param {TracershopState} state
   */
  constructor(orders, ordered_date, tracerCatalog, active_tracer, state){
    this._orderMapping = new Map();
    this._state = state

    const /**@type {ArrayMap<Number, ActivityOrder>} */ orderMapping = new ArrayMap()

    for(const order of orders){
      orderMapping.set(order.ordered_time_slot, order);

      if(order.moved_to_time_slot != null){
        orderMapping.set(order.moved_to_time_slot,order);
      }
    }

    for(const [timeSlotID, orders] of orderMapping){
      const timeSlot = state.deliver_times.get(timeSlotID);
      const overhead = tracerCatalog.getOverheadForTracer(timeSlot.destination, active_tracer)

      this._orderMapping.set(timeSlotID, new ActivityOrderCollection(
        orders, ordered_date, timeSlot, state, overhead
      ))
    }
  }

  /**
   *
   * @param {Number} timeSlotID
   * @returns {ActivityOrderCollection | undefined}
   */
  getOrders(timeSlotID){
    return this._orderMapping.get(timeSlotID);
  }


  *[Symbol.iterator](){
    const orderCollections = sortActivityOrderCollections(
      [...this._orderMapping.values()], this._state
    );

    for(const orderCollection of orderCollections){
      yield orderCollection;
    }
  }
}