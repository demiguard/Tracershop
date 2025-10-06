import React from 'react';
import { DeliveryEndpoint, Isotope, IsotopeDelivery, IsotopeOrder, IsotopeProduction, TracershopState } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";

export class IsotopeOrderCollection {
  #minimum_status : ORDER_STATUS // Minimum status of all the orders
  isotope : Isotope
  delivery : IsotopeDelivery
  production : IsotopeProduction
  ordered_activity: number
  delivered_activity: number
  endpoint : DeliveryEndpoint
  orders : Array<IsotopeOrder>

  /** A collection of Isotope orders, that
   *
   */
  constructor(orders: Array<IsotopeOrder>, delivery: IsotopeDelivery, state : TracershopState){
    this.#minimum_status = ORDER_STATUS.EMPTY;
    this.delivery = delivery;
    this.production = state.isotope_production.get(this.delivery.production);
    this.isotope = state.isotopes.get(this.production.isotope)
    this.orders = orders;
    this.ordered_activity = 0;
    this.delivered_activity = 0;
    this.endpoint = state.delivery_endpoint.get(delivery.delivery_endpoint);


    for(const order of orders){
      this.#minimum_status = Math.min(order.status, this.#minimum_status);
      this.ordered_activity += order.ordered_activity_MBq;
    }
  }

  get minimum_status(){
    return this.#minimum_status;
  }
}