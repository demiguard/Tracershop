import { ActivityDeliveryTimeSlot, ActivityOrder, TracershopState } from "~/dataclasses/dataclasses";
import { ArrayMap } from "~/lib/array_map";
import { getTimeSlotOwner } from "~/lib/data_structures.js";
import { TracerCatalog } from '~/contexts/tracer_catalog';
import { ActivityOrderCollection } from "~/lib/data_structures/activity_order_collection";
import { sortActivityOrderCollections, sortTimeSlots } from "~/lib/sorting";


/**
 * Creates a mapping over time slots with which orders should be rendered under the time slot
 * If a time slot is missing from the map, that means it should not be rendered.
 *
 */
type InnerOrderMap = ArrayMap<number, ActivityOrder>

export class OrderMapping{
  orderMapping : Map<string, InnerOrderMap>


  constructor(orders: Map<number,ActivityOrder>){
    this.orderMapping = new Map<string, InnerOrderMap>()

    for(const order of orders.values()){
      if(!this.orderMapping.has(order.delivery_date)){
        this.orderMapping.set(order.delivery_date, new ArrayMap());
      }

      const innerMap = this.orderMapping.get(order.delivery_date);

      innerMap.set(order.ordered_time_slot, order);
      if(order.moved_to_time_slot){
        innerMap.set(order.moved_to_time_slot, order);
      }
    }
  }

  getOrders(dateString: string, timeSlotID : number) : Array<ActivityOrder> {
    if(!this.orderMapping.has(dateString)){
      return [];
    }

    const innerMap = this.orderMapping.get(dateString);

    if(!innerMap.has(timeSlotID)){
      return [];
    }

    return innerMap.get(timeSlotID, []);
  }

  get_daily_orders(dateString: string): ArrayMap<number, ActivityOrder> {
    return this.orderMapping.has(dateString) ? this.orderMapping.get(dateString) : new ArrayMap();
  }
}