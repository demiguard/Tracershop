/**
 * This module is converting not string types are give their equivalent string
 * that the user can see
 */

import { useTracershopState } from "~/contexts/tracer_shop_context";
import { ActivityDeliveryTimeSlot, ActivityProduction, Customer, DeliveryEndpoint, Isotope, IsotopeDelivery, IsotopeProduction, Tracer } from "~/dataclasses/dataclasses";
import { getDay } from "~/lib/chronomancy";


const DAY_NAMES = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag",
]

export function presentDateName(day){
  if(day instanceof Date){
    day = getDay(day);
  }
  if(!(day in DAY_NAMES)){
    throw "Unknown Day";
  }

  return DAY_NAMES[day];
}

export function presentName(obj){
  const state = useTracershopState();

  switch (true) {
    case obj instanceof Isotope:
      return obj.metastable ?
          `${obj.atomic_letter}-${obj.atomic_mass}m`
        : `${obj.atomic_letter}-${obj.atomic_mass}`;
    case obj instanceof IsotopeProduction: {
      const isotope = state.isotopes.get(obj.isotope)
      return `${presentName(isotope)} - ${obj.production_time}`;
    }
    case obj instanceof IsotopeDelivery: {
      const production = state.isotope_production.get(obj.production);
      const isotope = state.isotopes.get(production.isotope);
      return `${presentName(isotope)} - ${obj.delivery_time}`;
    }
    case obj instanceof ActivityProduction: {
      const tracer = state.tracer.get(obj.tracer);
      return `${presentName(tracer)} - ${obj.production_time}`;
    }
    case obj instanceof ActivityDeliveryTimeSlot: {
      const production = state.production.get(obj.production_run);
      const tracer = state.tracer.get(production.tracer);
      return `${presentName(tracer)} - ${obj.delivery_time}`;
    }
    case obj instanceof Tracer:
      return obj.shortname;
    case obj instanceof Customer:
      return obj.short_name;
    case obj instanceof DeliveryEndpoint: {
      const customer = state.customer.get(obj.owner);
      return obj.name === customer.short_name ? obj.name : `${customer.short_name} - ${obj.name}`;
    }

    default:
      return "Ukendt Object type"
  }
}

export function presentOptionName(obj){
  switch (true) {
    case obj instanceof IsotopeProduction:
      return `${presentDateName(obj.production_day)} - ${obj.production_time}`;
    case obj instanceof ActivityProduction:
      return `${presentDateName(obj.production_day)} - ${obj.production_time}`;
    default:
      return presentName(obj)
  }
}