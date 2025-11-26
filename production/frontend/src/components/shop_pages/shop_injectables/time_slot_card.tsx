import React from "react";
import { ProductReference } from "~/dataclasses/references/product_reference";
import { ActivityDeliveryTimeSlot, ActivityOrder, IsotopeDelivery, IsotopeOrder } from "~/dataclasses/dataclasses";
import { DATA_ISOTOPE, DATA_TRACER } from "~/lib/shared_constants";
import { TimeSlotCardIsotope } from "~/components/shop_pages/shop_injectables/time_slot_card_isotope";
import { ShopTimeSlotCardActivity } from "~/components/shop_pages/shop_injectables/shop_time_slot_card_activity";

type TimeSlotCardArgs = {
   type : typeof DATA_TRACER,
   product : ProductReference,
   timeSlot : ActivityDeliveryTimeSlot
   orders : ActivityOrder[]
   overhead : number,
   deadlineValid : boolean
} | {
   type : typeof DATA_ISOTOPE,
   product : ProductReference,
   timeSlot : IsotopeDelivery,
   orders : IsotopeOrder[],
   deadlineValid : boolean
   overhead : undefined
};

export function TimeSlotCard({
  type,
  orders,
  timeSlot,
  overhead,
  deadlineValid
} : TimeSlotCardArgs){
  switch (type){
    case DATA_ISOTOPE: {
      return (
        <TimeSlotCardIsotope
          timeSlot={timeSlot}
          orders={orders}
          deadlineValid={deadlineValid}
        />);
    }
    case DATA_TRACER: {
      return (
        <ShopTimeSlotCardActivity
          timeSlot={timeSlot}
          activityOrders={orders}
          overhead={overhead}
          activityDeadlineValid={deadlineValid}
        />);
    }
    default:
      throw {
        error : `Cannot create a timeslot card for type: ${type}`
      }
  }

}