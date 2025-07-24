import React from "react";
import { ProductTypes, PRODUCT_TYPES } from "~/dataclasses/references/product_reference";
import { ActivityDeliveryTimeSlot, ActivityOrder, IsotopeDelivery, IsotopeOrder } from "~/dataclasses/dataclasses";
import { DATA_ISOTOPE, DATA_TRACER } from "~/lib/shared_constants";
import { TimeSlotCardIsotope } from "~/components/shop_pages/shop_injectables/time_slot_card_isotope";
import { TimeSlotCardActivity } from "~/components/shop_pages/shop_injectables/time_slot_card_activity";


/**
 * @typedef {{
 *    type : DATA_TRACER,
 *    product : ProductReference,
 *    timeSlot : ActivityDeliveryTimeSlot
 *    orders : Array<ActivityOrder>
 *    overhead : Number,
 *    deadlineValid : boolean
 * } | {
 *    type : DATA_ISOTOPE,
 *    product : ProductReference,
 *    timeSlot : IsotopeDelivery,
 *    orders : Array<IsotopeOrder>,
 *    deadlineValid : boolean
 * }
 * } timeSlotArgs
 */


/** This is a card that shows a place where a user can place an order of some
 * product
 *
 * @param {timeSlotArgs} props
 *
 */
export function TimeSlotCard({
  type,
  orders,
  timeSlot,
  overhead,
  deadlineValid
}){
  switch (type){
    case DATA_ISOTOPE:
      return <TimeSlotCardIsotope
        timeSlot={timeSlot}
        orders={orders}
        deadlineValid={deadlineValid}
      />
    case DATA_TRACER:
      return <TimeSlotCardActivity
        timeSlot={timeSlot}
        activityOrders={orders}
        overhead={overhead}
        activityDeadlineValid={deadlineValid}
      />
  }

}