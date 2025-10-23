import React from 'react';
import { DeliveryEndpoint, Isotope, IsotopeDelivery, IsotopeOrder, IsotopeProduction, TracershopState } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";
import { OrderCollection } from './order_collection';
import { OrdersType } from '../types';

export class IsotopeOrderCollection extends OrderCollection {
  #minimum_status : ORDER_STATUS; // Minimum status of all the orders
  isotope : Isotope;
  delivery : IsotopeDelivery;
  production : IsotopeProduction;
  ordered_activity: number;
  delivered_activity: number;
  endpoint : DeliveryEndpoint;
  declare orders: Array<IsotopeOrder>;

  /** A collection of Isotope orders, that
   *
   */
  constructor(orders: Array<IsotopeOrder>, delivery: IsotopeDelivery, state : TracershopState){
    super(orders)
    this.delivery = delivery;
    this.production = state.isotope_production.get(this.delivery.production);
    this.isotope = state.isotopes.get(this.production.isotope)
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