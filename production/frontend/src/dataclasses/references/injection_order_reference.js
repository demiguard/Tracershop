import { ActivityOrder } from "~/dataclasses/dataclasses";
import { Order } from "~/dataclasses/references/order_reference";

export class InjectionOrderReference extends Order {
  /**
   *
   * @param {ActivityOrder} order
   */
  constructor(order){
    super(order.status);
  }
}
