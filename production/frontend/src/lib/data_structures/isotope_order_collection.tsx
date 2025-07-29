import React from 'react';
import { IsotopeDelivery, IsotopeOrder, TracershopState } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";

export class IsotopeOrderCollection {
  #minimum_status : ORDER_STATUS // Minimum status of all the orders
  delivery : IsotopeDelivery
  ordered_activity: number

  /** A collection of Isotope orders, that
   *
   */
  constructor(orders: Array<IsotopeOrder>, delivery: IsotopeDelivery, state : TracershopState){
    this.#minimum_status = ORDER_STATUS.EMPTY;
    this.delivery = delivery;
    this.ordered_activity = 0;

    for(const order of orders){
      this.#minimum_status = Math.min(order.status, this.#minimum_status);
      this.ordered_activity += order.ordered_activity_MBq;
    }
  }

  get minimum_status(){
    return this.#minimum_status;
  }
}