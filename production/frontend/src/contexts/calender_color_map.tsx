import React, { createContext, useContext, useMemo } from 'react'
import { ActivityOrder, InjectionOrder, IsotopeOrder, TracershopState } from '~/dataclasses/dataclasses';
import { useTracershopState } from './tracer_shop_context';
import { DateRange, FirstSundayInNextMonth, LastMondayInLastMonth } from '~/lib/chronomancy';
import { isotopeDeliveries } from '~/tests/test_state/isotope_deliveries';
import { isotopeDeliveryFilter, timeSlotFilter } from '~/lib/filters';
import { activityDeliveryTimeSlots } from '~/tests/test_state/activity_delivery_time_slots';
import { OrderType } from '~/lib/types';
import { mapGetDefault } from '~/lib/utils';


export const PRODUCTION_ID = -1;
export const INVALID_ID = -2

export class OrderColor {
  color_code : number;

  constructor(){
    this.color_code = 777;
  }

  getActivityCode(){
    const code = this.color_code % 10;

    return code;
  }

  getInjectionCode(){
    const code = this.color_code % 100;

    return Math.floor(code / 10);
  }

  getIsotopeCode(){
    return Math.floor(this.color_code / 100);
  }

  setCode(activityCode: number, injectionCode: number, isotopeCode: number){
    this.color_code = activityCode + injectionCode * 10 + isotopeCode * 100;
  }

  updateColorActivity(activityOrder: ActivityOrder){
    this.setCode(
      Math.min(activityOrder.status, this.getActivityCode()),
      this.getInjectionCode(),
      this.getIsotopeCode()
    );
  }

  updateColorInjection(injectionOrder: InjectionOrder){
    this.setCode(
      this.getActivityCode(),
      Math.min(this.getInjectionCode(), injectionOrder.status),
      this.getIsotopeCode()
    );
  }

  updateColorIsotope(isotopeOrder: IsotopeOrder){
    this.setCode(
      this.getActivityCode(),
      this.getInjectionCode(),
      Math.min(this.getIsotopeCode(), isotopeOrder.status)
    );
  }
}

/**
 * Contains the mapping, that holds what color each day should be, in the calender.
*/
class CalenderColorMap {
  #order_colors: Map<string, OrderColor>

  constructor(endpoint_id : number, state: TracershopState){
    this.#order_colors = new Map();

    if(endpoint_id === INVALID_ID){
      return;
    }

    const calenderRange = new DateRange(
      LastMondayInLastMonth(state.today),
      FirstSundayInNextMonth(state.today),
    )

    function updateFunction<T extends OrderType>(map: Map<number, T>,colorMap: Map<string, OrderColor>, updateFunction: (orderColor: OrderColor, order: T) => void ){
      for(const order of map.values()){
        const delivery_date = order.delivery_date;

        if(!calenderRange.in_range(delivery_date)){
          continue;
        }

        if(!colorMap.has(delivery_date)){
          colorMap.set(delivery_date, new OrderColor());
        }

        const orderColor = colorMap.get(delivery_date);
        updateFunction(orderColor, order);
      }
    }
    updateFunction(
      state.activity_orders,
      this.#order_colors,
      (orderColor: OrderColor, order) => {orderColor.updateColorActivity(order)}
    );
    updateFunction(
      state.injection_orders,
      this.#order_colors,
      (orderColor: OrderColor, order) => {orderColor.updateColorInjection(order)}
    );
    updateFunction(
      state.isotope_order,
      this.#order_colors,
      (orderColor: OrderColor, order) => { orderColor.updateColorIsotope(order) }
    );
  }

  get(delivery_date: string) {
    return mapGetDefault(this.#order_colors, delivery_date, new OrderColor());
  }
}

//@ts-ignore
const CalenderColorMapContext = createContext(new CalenderColorMap(-2, new TracershopState()));

export function useColorMap(){
  return useContext(CalenderColorMapContext);
}

export function CalenderColorMapContextProvider({children, endpoint_id}){
  const state = useTracershopState();

  const colorMap = useMemo(() => new CalenderColorMap(endpoint_id, state), [
      endpoint_id,
      state.today,
      state.activity_orders,
      state.isotope_order,
      state.injection_orders
    ]);

  return (
    <CalenderColorMapContext.Provider value={colorMap}>
      {children}
    </CalenderColorMapContext.Provider>
  );
}
