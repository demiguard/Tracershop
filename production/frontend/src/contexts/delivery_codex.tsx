import React, { createContext, useContext, useMemo } from "react";
import { useTracershopState } from "./tracer_shop_context";
import { DAYS } from "~/lib/constants";
import { ActivityDeliveryTimeSlot, ActivityProduction, Customer, DeliveryEndpoint } from "~/dataclasses/dataclasses";
import { deliveryEndpoints } from "~/tests/test_state/delivery_endpoints";
import { DefaultMap } from "~/lib/default_map";


type CodexPage = {
  [day in DAYS] : ActivityDeliveryTimeSlot[]
}

function MakeCodexPage(){
  return {
    [DAYS.MONDAY] : [],
    [DAYS.TUESDAY] : [],
    [DAYS.WENDSDAY] : [],
    [DAYS.THURSDAY] : [],
    [DAYS.FRIDAY] : [],
    [DAYS.SATURDAY] : [],
    [DAYS.SUNDAY] : []
  }
}

/**
 * A delivery codex is the data structure, that holds the customer to timeslot
 * mapping. You should always apply a filter on obtained delivery endpoints.
 *
 */
export class DeliveryCodex {
  root_map : Map<number, DefaultMap<number, CodexPage>>
  endpoints : Map<number, DeliveryEndpoint>
  productions : Map<number, ActivityProduction>

  constructor(
      customers: Map<number, Customer>,
      endpoints: Map<number, DeliveryEndpoint>,
      timeslots : Map<number, ActivityDeliveryTimeSlot>,
      productions : Map<number, ActivityProduction>
  ) {
    this.root_map = new Map();
    this.endpoints = endpoints
    this.productions = productions

    for(const customer of customers.values()) {
      this.root_map.set(customer.id, new DefaultMap(MakeCodexPage))
    }

    for(const timeslot of timeslots.values()){
      const endpoint = this.endpoints.get(timeslot.destination);
      const customer_map = this.root_map.get(endpoint.owner);
      const codexPage = customer_map.get(endpoint.id);
      const production = this.productions.get(timeslot.production_run);
      codexPage[production.production_day].push(timeslot);
    }
  }

  getTimeSlotsForCustomer(customer: Customer | number){
    const customerID = customer instanceof Customer ? customer.id : customer
    return this.root_map.get(customerID);
  }

  getTimeSlotsForEndpoints(endpointRef: DeliveryEndpoint | number){
    const endpoint = endpointRef instanceof DeliveryEndpoint ? endpointRef : this.endpoints.get(endpointRef);
    const customerMap = this.root_map.get(endpoint.owner);
    return customerMap.get(endpoint.id);
  }
}

const DeliveryCodexContext = createContext(
  new DeliveryCodex(new Map(), new Map(), new Map(), new Map())
);

export function useDeliveryCodex(){
  return useContext(DeliveryCodexContext);
}

export function DeliveryCodexProvider({children}){
  const state = useTracershopState();

  const deliveryCodex = useMemo(() => {
    return new DeliveryCodex(
      state.customer,
      state.delivery_endpoint,
      state.deliver_times,
      state.production
    );
  }, [
    state.customer,
    state.delivery_endpoint,
    state.deliver_times,
    state.production,
  ]);

  return (
    <DeliveryCodexContext.Provider value={deliveryCodex}>
      {children}
    </DeliveryCodexContext.Provider>
  );
}
