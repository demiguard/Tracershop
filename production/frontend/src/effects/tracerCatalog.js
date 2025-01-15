import React, { useMemo, useContext, createContext, useRef } from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { TracerCatalogPage, TracershopState } from "~/dataclasses/dataclasses";
import { TRACER_TYPE } from "~/lib/constants";
import { EndpointCatalog, undefined } from "~/lib/data_structures";
import { numberfy } from "~/lib/utils";

/**
 * Data structure containing information about which tracers a customer have access to
 * Each instance is unique to a customer.
 */
export class TracerCatalog {
  /**@type {Map<Number, EndpointCatalog } */ _endpointCatalogs;

  /**
   * Data structure containing information about which tracers a customer have access to
   * Each instance is unique to a customer.
   * @param {Map<Number, TracerCatalogPage>} tracerCatalogPages
   * The Collection of mappings of customer to tracer, where an entry implies the customer is allowed to order
   * @param {Map<Number, Tracer>} tracers The Collection of all tracers
   */
  constructor(tracerCatalogPages, tracers) {
    this._endpointCatalogs = new Map();

    for (const tracerCatalogPage of tracerCatalogPages.values()) {
      if (!this._endpointCatalogs.has(tracerCatalogPage.endpoint)) {
        this._endpointCatalogs.set(tracerCatalogPage.endpoint, new EndpointCatalog());
      }

      const endpoint_catalog = this._endpointCatalogs.get(tracerCatalogPage.endpoint);

      const /**@type {Tracer} */ tracer = tracers.get(tracerCatalogPage.tracer);
      if (tracer === undefined) {
        throw "Database integrity violated!";
      }

      if (tracer.tracer_type === TRACER_TYPE.ACTIVITY) {
        endpoint_catalog.overheadMap.set(tracerCatalogPage.tracer, tracerCatalogPage.overhead_multiplier);
        endpoint_catalog.tracerCatalogActivity.push(tracer);
      } else if (tracer.tracer_type === TRACER_TYPE.DOSE) {
        endpoint_catalog.tracerCatalogInjections.push(tracer);
      }
    }
  }

  /**
   * Gets the entire catalog for a customer
   * @param {Number} endpointID - the ID of the customer in question
   * @returns {EndpointCatalog}
   */
  getCatalog(endpointID) {
    const index = numberfy(endpointID);

    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog;
    }
    console.log("Undefined endpoint referenced");
    return new EndpointCatalog();
  }

  getActivityCatalog(customerID) {
    const index = numberfy(customerID);
    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog.tracerCatalogActivity;
    }
    return [];
  }

  /**
   * Gets the injections tracers a customer can order
   * @param {Number} endpointID
   * @returns {Array<Tracer>}
   */
  getInjectionCatalog(endpointID) {
    const index = numberfy(endpointID);
    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog.tracerCatalogInjections;
    }
    return [];
  }

  getOverheadForTracer(endpointID, tracerID) {
    const endpoint_index = numberfy(endpointID);
    const tracer_index = numberfy(tracerID);
    const endpoint_catalog = this._endpointCatalogs.get(endpoint_index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog.overheadMap.get(tracer_index);
    }
    // There should be a handle here!
    console.log(`Undefined customer - ${endpointID}, tracer ${tracerID} referenced`);
    return 1;
  }
}

const TracerShopCatalogContext = createContext(null);

/**
 *
 * @param {TracershopState} state
 * @returns
 */
export function TracerCatalogProvider({ children }){
  const ref = useRef(null);

  const state = useTracershopState();
  const tracer_catalog_constructor = useMemo(() => {
    ref.current = null;

    return  {ref, tracerShopState: state}
  }, [state.tracer_mapping, state.tracer]);

  return (
    <TracerShopCatalogContext.Provider value={tracer_catalog_constructor}>
      {children}
    </TracerShopCatalogContext.Provider>
  )
}

export function useTracerCatalog(){
  const catalogContext = useContext(TracerShopCatalogContext);
  if(catalogContext === null){
    return new TracerCatalog(new Map(), new Map());
  }

  const {ref, tracerShopState} = catalogContext

  return useMemo(() => {
    if(ref.current === null){
      ref.current = new TracerCatalog(tracerShopState.tracer_mapping, tracerShopState.tracer);
    }

    return ref.current;
  }, [tracerShopState.tracer_mapping, tracerShopState.tracer]);
}
