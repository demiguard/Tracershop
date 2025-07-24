
import { IsotopeOrder } from "~/dataclasses/dataclasses";
import { Order } from "~/dataclasses/references/order_reference";

export class IsotopeOrderReference extends Order {
  /**
   *
   * @param {ActivityOrder} order
   */
  constructor(order){
    super(order.status);
  }
}
