import React, { createContext, useContext, useMemo } from 'react'
import { ActivityOrder, Deadline, InjectionOrder, IsotopeOrder, TracershopState } from '~/dataclasses/dataclasses';
import { useTracershopState } from './tracer_shop_context';
import { calculateDeadline, DateRange, FirstSundayInNextMonth, getToday, LastMondayInLastMonth } from '~/lib/chronomancy';
import { isotopeDeliveries } from '~/tests/test_state/isotope_deliveries';
import { isotopeDeliveryFilter, timeSlotFilter } from '~/lib/filters';
import { activityDeliveryTimeSlots } from '~/tests/test_state/activity_delivery_time_slots';
import { OrderType } from '~/lib/types';
import { getGlobalDeadlines, getServerConfig, mapGetDefault } from '~/lib/utils';
import { dateToDateString } from '~/lib/formatting';
import { ORDER_STATUS } from '~/lib/constants';


export const PRODUCTION_ID = -1;
export const NO_ACTIVITY_FILTER = -1
export const INVALID_ID = -2

export class OrderColor {
  color_code : number;

  constructor(){
    this.color_code = 777;
  }

  getActivityCode(){
    return this.color_code % 10;
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

  updateColorActivity(activityOrderStatus: number){
    this.setCode(
      Math.min(activityOrderStatus, this.getActivityCode()),
      this.getInjectionCode(),
      this.getIsotopeCode()
    );
  }

  updateColorInjection(injectionOrderStatus: number){
    this.setCode(
      this.getActivityCode(),
      Math.min(this.getInjectionCode(), injectionOrderStatus),
      this.getIsotopeCode()
    );
  }

  updateColorIsotope(isotopeOrderStatus: number){
    this.setCode(
      this.getActivityCode(),
      this.getInjectionCode(),
      Math.min(this.getIsotopeCode(), isotopeOrderStatus)
    );
  }
}

/**
 * Contains the mapping, that holds what color each day should be, in the calender.
*/
class CalenderColorMap {
  #order_colors: Map<string, OrderColor>

  constructor(endpoint_id : number, state: TracershopState, activity_tracer_id=NO_ACTIVITY_FILTER){
    this.#order_colors = new Map();

    if(endpoint_id === INVALID_ID){
      return;
    }

    const calenderRange = new DateRange(
      LastMondayInLastMonth(state.today),
      FirstSundayInNextMonth(state.today),
    );

    // So we wish to filter activity activity
    const [deadlineActivity, deadlineInjection, deadlineIsotope] = getGlobalDeadlines(state);

    const deadlineActivityDate = deadlineActivity ? calculateDeadline(deadlineActivity) : new Date();
    const deadlineInjectionDate = deadlineInjection ? calculateDeadline(deadlineInjection) : new Date();
    const deadlineIsotopeDate = deadlineIsotope ? calculateDeadline(deadlineIsotope) : new Date();
    const now = getToday();

    function deadlineUpdater (deadline: Deadline | null, date: Date, updateFunction: (num: number) => void){
      const deadlineDate = deadline ? calculateDeadline(deadline, date) : date;

      if(now < deadlineDate){
        updateFunction(ORDER_STATUS.AVAILABLE);
      } else {
        updateFunction(ORDER_STATUS.UNAVAILABLE);
      }
    }


    for(const date of calenderRange){
      const delivery_date = dateToDateString(date);
      this.#order_colors.set(delivery_date, new OrderColor());
      const orderColor = this.#order_colors.get(delivery_date);

      deadlineUpdater(deadlineActivity, date,  orderColor.updateColorActivity.bind(orderColor));
      deadlineUpdater(deadlineInjection, date, orderColor.updateColorInjection.bind(orderColor));
      deadlineUpdater(deadlineIsotope, date,   orderColor.updateColorIsotope.bind(orderColor));
    }

    function updateFunction<T extends OrderType>(map: Map<number, T>,colorMap: Map<string, OrderColor>, updateFunction: (orderColor: OrderColor, order: T) => void ){
      for(const order of map.values()){
        const delivery_date = order.delivery_date;

        if(!calenderRange.in_range(delivery_date)){
          continue;
        }


        const orderColor = colorMap.get(delivery_date);
        updateFunction(orderColor, order);
      }
    }

    updateFunction(
      state.activity_orders,
      this.#order_colors,
      (orderColor: OrderColor, order) => {orderColor.updateColorActivity(order.status)}
    );
    updateFunction(
      state.injection_orders,
      this.#order_colors,
      (orderColor: OrderColor, order) => {orderColor.updateColorInjection(order.status)}
    );
    updateFunction(
      state.isotope_order,
      this.#order_colors,
      (orderColor: OrderColor, order) => { orderColor.updateColorIsotope(order.status) }
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
