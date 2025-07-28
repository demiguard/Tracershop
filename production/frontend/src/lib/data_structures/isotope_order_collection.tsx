import React from 'react';
import { IsotopeDelivery, IsotopeOrder, TracershopState } from "~/dataclasses/dataclasses";
import { IsotopeOrderReference } from "~/dataclasses/references/isotope_order_reference";
import { ORDER_STATUS } from "~/lib/constants";

export class IsotopeOrderCollection {
  #minimum_status : ORDER_STATUS // Minimum status of all the orders
  delivery : IsotopeDelivery

  /** A collection of Isotope orders, that
   *
   */
  constructor(orders: Array<IsotopeOrder>, delivery: IsotopeDelivery, state : TracershopState){
    this.#minimum_status = ORDER_STATUS.EMPTY;
    this.delivery = delivery;

    for(const order of orders){
      this.#minimum_status = Math.min(order.status, this.#minimum_status);
    }
  }

  get minimum_status(){
    return this.#minimum_status;
  }
}