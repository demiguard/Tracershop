import React, { createContext, useContext, useMemo } from "react";
import { Booking, Procedure, TracershopState } from "~/dataclasses/dataclasses";
import { useTracershopState } from "./tracer_shop_context"

export class ProcedureFinder {
  #locationMap: Map<number, number> // map from location id to delivery
  #procedureMap: Map<number, Map<number, Procedure>>

  constructor(state: TracershopState){
    this.#locationMap = new Map();
    this.#procedureMap = new Map();


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

  find(booking: Booking){
    const endpoint = this.#locationMap.get(booking.location);

    if(endpoint === undefined){
      return null;
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

  //const procedureIndex = useMemo(() => {
  //  return  new ProcedureFinder( state );
  //}, [state.location, state.procedure]);

  const procedureIndex = new ProcedureFinder(state);

  return <ProcedureFinderContext.Provider value={procedureIndex}>
    {children}
  </ProcedureFinderContext.Provider>
}

export function useProcedureFinder(){
  return useContext(ProcedureFinderContext);
}