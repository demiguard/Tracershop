import { ActivityOrder, InjectionOrder, IsotopeOrder } from "~/dataclasses/dataclasses";
import { ActivityOrderReference } from "~/dataclasses/references/activity_order_reference";
import { InjectionOrderReference } from "~/dataclasses/references/injection_order_reference";
import { IsotopeOrderReference } from "~/dataclasses/references/isotope_order_reference";
import { Order } from "~/dataclasses/references/order";
import { OrderType } from "~/lib/types";


export function makeOrder(order: OrderType) : Order {
  switch (true){
    case order instanceof InjectionOrder:
      return new InjectionOrderReference(order);
    case order instanceof ActivityOrder:
      return new ActivityOrderReference(order);
    case order instanceof IsotopeOrder:
      return new IsotopeOrderReference(order);
  }
}