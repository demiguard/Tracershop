import { ActivityOrder, InjectionOrder, Isotope, IsotopeOrder, Tracer } from "~/dataclasses/dataclasses"
import { DATA_ACTIVITY_ORDER, DATA_INJECTION_ORDER, DATA_ISOTOPE_ORDER } from "./shared_constants"


export interface ShopActionButtonArgs {
  label?: string,
  validate: () => boolean | [ boolean, any ],
  callback?: (any) => void,
  canEdit: boolean,
  is_dirty: boolean
}

export type OrderType = IsotopeOrder | ActivityOrder | InjectionOrder
export type OrdersType = Array<IsotopeOrder> | Array<ActivityOrder> | Array<InjectionOrder>

export type ProductType = Isotope | Tracer

export interface TracershopDataClass {
  copy() : this
}

export function getOrderType({order, orders}: {order? : OrderType, orders? : OrdersType}){
  const extracted_order = orders ? orders[0] : order;

  if(extracted_order === undefined){
    return undefined;
  }

  switch(true){
    case extracted_order instanceof ActivityOrder:
      return DATA_ACTIVITY_ORDER;
    case extracted_order instanceof InjectionOrder:
      return DATA_INJECTION_ORDER;
    case extracted_order instanceof IsotopeOrder:
      return DATA_ISOTOPE_ORDER;
    default:
      console.log("UNKNOWN ORDER TYPE ENCOUNTERED!");
      return undefined;
  }
}

export type ValueOf<T> = T[keyof T];