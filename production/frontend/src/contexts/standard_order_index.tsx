import React from "react";
import { createContext, useContext, useMemo } from "react";
import { useTracershopState } from "./tracer_shop_context";
import { ActivityDeliveryTimeSlot, StandardOrder } from "~/dataclasses/dataclasses";
import { DefaultMap } from "~/lib/default_map";
import { WEEKLY_REPEAT_CHOICES } from "~/lib/constants";
import { getWeekNumber } from "~/lib/chronomancy";

class StandardOrderIndexPage {
  all? : StandardOrder
  even? : StandardOrder
  odd? : StandardOrder


  constructor(){
    this.all = null;
    this.even = null;
    this.odd = null;
  }
}


export class StandardOrderIndex {
  timeSlotMapping : DefaultMap<number, StandardOrderIndexPage>

  constructor(standard_orders: Map<number, StandardOrder>){
    this.timeSlotMapping = new DefaultMap(() => {return new StandardOrderIndexPage()})

    for(const standardOrder of standard_orders.values()){
      const page = this.timeSlotMapping.get(standardOrder.destination);

      switch(standardOrder.weekly_repeat){
        case WEEKLY_REPEAT_CHOICES.ALL:
          page.all = standardOrder
        break;
        case WEEKLY_REPEAT_CHOICES.EVEN:
          page.even = standardOrder
        break;
        case WEEKLY_REPEAT_CHOICES.ODD:
          page.odd = standardOrder
        break;
      }
    }
  }

  getStandardOrder(timeslot: ActivityDeliveryTimeSlot, weekNumber: number){
    const page = this.timeSlotMapping.get(timeslot.id);
    if(weekNumber % 2 == 0){
      if(page.even !== null){
        return page.even;
      }
    } else {
      if(page.odd !== null){
        return page.odd;
      }
    }

    if(page.all !== null){
      return page.all;
    }

    return new StandardOrder(-1, "", timeslot.id, WEEKLY_REPEAT_CHOICES.ALL);
  }
}

const StandardOrderIndexContext = createContext(new StandardOrderIndex(new Map()));

export function useStandardOrderIndex(){
  return useContext(StandardOrderIndexContext);
}

export function StandardOrderIndexProvider({children}){
  const state = useTracershopState()

  const standardOrderIndex = useMemo(() => {
    return new StandardOrderIndex(state.standard_order);
  }, [state.standard_order, state.deliver_times]);


  return (
    <StandardOrderIndexContext.Provider value={standardOrderIndex}>
      {children}
    </StandardOrderIndexContext.Provider>
  );


}