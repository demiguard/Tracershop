import React from 'react';
import { DeliveryEndpoint, Isotope, IsotopeDelivery, IsotopeOrder, IsotopeProduction, IsotopeVial, TracershopState } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";
import { OrderCollection } from './order_collection';
import { OrdersType } from '../types';
import { DATA_ISOTOPE_VIAL } from '../shared_constants';
import { getId, map } from '../utils';
import { compareTimeStamp } from '../chronomancy';
import { correctIsotopeVialActivityToTime, correctVialActivityToTime } from '../physics';

export class IsotopeOrderCollection extends OrderCollection {
  isotope : Isotope;
  delivery : IsotopeDelivery;
  production : IsotopeProduction;
  ordered_activity: number;
  delivered_activity: number;
  endpoint : DeliveryEndpoint;
  declare orders: Array<IsotopeOrder>;
  order_ids : Array<number>
  vials : Array<IsotopeVial>
  order_date : Date

  /** A collection of Isotope orders, that
   *
   */
  constructor(orders: Array<IsotopeOrder>, delivery: IsotopeDelivery, state : TracershopState){
    super(orders);
    this.delivery = delivery;
    this.production = state.isotope_production.get(this.delivery.production);
    this.isotope = state.isotopes.get(this.production.isotope)
    this.ordered_activity = 0;
    this.delivered_activity = 0;
    this.endpoint = state.delivery_endpoint.get(delivery.delivery_endpoint);
    this.order_ids = map(getId, [...orders]);

    for(const order of orders){
      this.order_date = new Date(order.delivery_date);
      this.ordered_activity += order.ordered_activity_MBq;
    }

    this.vials = []
    for(const vial of state.isotope_vial.values()){
      if(this.order_ids.includes(vial.delivery_with)){
        this.vials.push(vial);

        this.delivered_activity += correctIsotopeVialActivityToTime(
          vial, delivery.delivery_time, this.isotope.halflife_seconds
        );
      }
    }
  }

  getVials(): IsotopeVial[] {
    return this.vials
  }

  getVialType(): string {
    return DATA_ISOTOPE_VIAL
  }
}