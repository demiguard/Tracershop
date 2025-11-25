import { ActivityOrder, InjectionOrder, Isotope, IsotopeOrder, Tracer } from "~/dataclasses/dataclasses"
import { DATA_ACTIVITY_ORDER, DATA_INJECTION_ORDER, DATA_ISOTOPE_ORDER } from "./shared_constants"
import { OrderCollection } from "./data_structures/order_collection"
import { ActivityOrderCollection } from "./data_structures/activity_order_collection"
import { IsotopeOrderCollection } from "./data_structures/isotope_order_collection"
import { InjectionOrderCollection } from "./data_structures/injection_order_collection"


export interface ShopActionButtonArgs {
  label?: string,
  validate: () => boolean | [ boolean, any ],
  callback?: (any) => void,
  canEdit: boolean,
  is_dirty: boolean
}

export type OrderType = IsotopeOrder | ActivityOrder | InjectionOrder
export type OrdersType = Array<IsotopeOrder> | Array<ActivityOrder> | Array<InjectionOrder>
export type OrderCollectionSpecialized = ActivityOrderCollection | InjectionOrderCollection | IsotopeOrderCollection;
export type ProductType = Isotope | Tracer

export interface TracershopDataClass {
  copy() : this
}

export function getOrderType({order, orders, collection}: {order? : OrderType, orders? : OrdersType, collection? : OrderCollection}){
  const extracted_order = orders ? orders[0] : order;

  if(extracted_order === undefined && collection === undefined){
    return undefined;
  }

  switch(true){
    case collection !== undefined && collection instanceof ActivityOrderCollection:
    case extracted_order instanceof ActivityOrder:
      return DATA_ACTIVITY_ORDER;
    case collection !== undefined && collection instanceof InjectionOrderCollection:
    case extracted_order instanceof InjectionOrder:
      return DATA_INJECTION_ORDER;
          case collection !== undefined && collection instanceof IsotopeOrderCollection:
    case extracted_order instanceof IsotopeOrder:
      return DATA_ISOTOPE_ORDER;
    default:
      console.log("UNKNOWN ORDER TYPE ENCOUNTERED!");
      return undefined;
  }
}

export type ValueOf<T> = T[keyof T];

export type ReactState<T> = [T, React.Dispatch<React.SetStateAction<T>>];

export type ErrorFunction = () => {
  valid : boolean,
  error? : string,
  value? : any,
  id : string
}