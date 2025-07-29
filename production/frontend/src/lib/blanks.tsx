/**
 * @fileoverview This file provides simple constructors for most data-classes
 * They have the naming Convention makeBlank${data class name}
 *
 * Note that most of these functions use contexts and therefore cannot be
 * conditionally called
 */

import { useTracershopState } from "~/contexts/tracer_shop_context";
import { ActivityDeliveryTimeSlot, ActivityOrder, DeliveryEndpoint, InjectionOrder, IsotopeDelivery, IsotopeOrder, Tracer, TracershopState } from "~/dataclasses/dataclasses";
import { PRODUCT_TYPES, ProductReference } from "~/dataclasses/references/product_reference";

import { ORDER_STATUS, TRACER_TYPE } from "~/lib/constants";
import { dateToDateString } from "~/lib/formatting";
import { TRACER_USAGE } from "~/lib/shared_constants";

export function makeBlankIsotopeOrder(timeSlot : IsotopeDelivery, state: TracershopState){
  const blank_order = new IsotopeOrder(
    -1,
    ORDER_STATUS.AVAILABLE,
    state.logged_in_user.id,
    "",
    timeSlot.id,
    dateToDateString(state.today),
    "",
    null,
    null
  );

  return blank_order;
}

export function makeBlankInjectionOrder(endpoint : DeliveryEndpoint, defaultTracer: Tracer){
  const state = useTracershopState();

  return new InjectionOrder(
    -1,
    "",
    dateToDateString(state.today),
    "",
    ORDER_STATUS.AVAILABLE,
    TRACER_USAGE.animal,
    "",
    state.logged_in_user.id,
    endpoint.id,
    defaultTracer.id,
    null,
    null,
    null,
  )
}

export function makeBlankTracer(){
  return new Tracer(-1, "", "", "", TRACER_TYPE.DOSE, "", false, false, false);
}

export function makeBlankActivityOrder(timeSlot: ActivityDeliveryTimeSlot){
  const state = useTracershopState();

  return new ActivityOrder(-1,
                           "",
                           dateToDateString(state.today),
                           ORDER_STATUS.AVAILABLE,
                           "", timeSlot.id,
                           null,
                           null,
                           state.logged_in_user.id,
                           null);
}

export function makeBlankProductReference(){
  return new ProductReference(-1, PRODUCT_TYPES.EMPTY);
}