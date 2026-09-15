import React, { createContext, useContext, useMemo } from "react";
import { Booking, BookingRule, Procedure, TracershopState } from "~/dataclasses/dataclasses";
import { useTracershopState } from "./tracer_shop_context"

/**
 * Bookings have a procedure identifier and a location. This Data structure is
 */
export class ProcedureFinder {
  #locationMap: Map<number, number> // map from location id to delivery
  #procedureMap: Map<number, Map<number, Procedure>>
  #bookingRuleMapping: Map<number, number>

  constructor(state: TracershopState){
    this.#locationMap = new Map();
    this.#procedureMap = new Map();
    this.#bookingRuleMapping = new Map<number, number>();

    for(const bookingRule of state.booking_rule.values()){
      this.#bookingRuleMapping.set(bookingRule.location, bookingRule.true_owner);
    }

    for(const location of state.location.values()){
      this.#locationMap.set(location.id, location.endpoint);
    }

    for(const procedure of state.procedure.values()){
      if(!(this.#procedureMap.has(procedure.owner))){
        this.#procedureMap.set(procedure.owner, new Map());
      }

      const identifierMap = this.#procedureMap.get(procedure.owner);
      identifierMap.set(procedure.series_description, procedure);
    }
  }

  /** Finds the procedure object from the
   *
   * @param booking The booking that you
   * @param endpoint Optional param to specify the endpoint, that you're looking
   *  for procedures from.
   * @returns The Procedure
   */
  find(booking: Booking) : Procedure | null{
    const endpoint = this.#bookingRuleMapping.has(booking.location) ?
      this.#bookingRuleMapping.get(booking.location) :
      this.#locationMap.get(booking.location);

    if (endpoint === undefined){
      return null
    }

    const procedureMapping = this.#procedureMap.get(endpoint);

    if(procedureMapping === undefined){
      return null;
    }

    const procedure = procedureMapping.get(booking.procedure);

    return procedure === undefined ? null : procedure;
  }
};

//@ts-ignore
const ProcedureFinderContext = createContext(new ProcedureFinder(new TracershopState()))

export function ProcedureContext({children}){
  const state = useTracershopState();

  // Compiler Add memorization here!
  const procedureIndex = new ProcedureFinder(state);

  return <ProcedureFinderContext.Provider value={procedureIndex}>
    {children}
  </ProcedureFinderContext.Provider>
}

export function useProcedureFinder(){
  return useContext(ProcedureFinderContext);
}