import React, { useContext, createContext, useMemo } from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { Isotope, IsotopeDelivery, TracerCatalogPage, TracershopState } from "~/dataclasses/dataclasses";
import { TRACER_TYPE } from "~/lib/constants";
import { numberfy } from "~/lib/utils";

//#region EndpointCatalog
export class EndpointCatalog {
  /**@type {Array<Tracer>} @desc A list of tracers activity available to this endpoint */ tracerCatalogActivity
  /**@type {Array<Tracer>} @desc A list of tracers injection available to this endpoint */ tracerCatalogInjections
  /**@type {Array<Isotope>} @desc A list of tracers injection available to this endpoint */ isotopeCatalog
  /**@type {Map<Number, Number>} @desc  A Tracer to overhead percentage, so if a tracer with id 10 have 25 % overhead, this map will have 10 -> 1.25  */ overheadMap
  /**@type {Map<Number, TracerCatalogPage>} @desc A mapping of tracer id to the page */ pages

  /**
   * Catalog of product that a single endpoint
   * * @property {Map<Number, TracerCatalogPage>} pages
   */
  constructor() {
    this.tracerCatalogActivity = [];
    this.tracerCatalogInjections = [];
    this.isotopeCatalog = [];
    this.overheadMap = new Map();
    this.pages = new Map();
  }
}

/**
 * Data structure containing information about which tracers a customer have access to
 * Each instance is unique to a customer.
 */
export class TracerCatalog {
  /**@type {Map<Number, EndpointCatalog } */ _endpointCatalogs;

  /**
   * Data structure containing information about which tracers a customer have access to
   * Each instance is unique to a customer.
   * @param {TracershopState} state
   */
  constructor(state) {
    this._endpointCatalogs = new Map();

    for (const tracerCatalogPage of state.tracer_mapping.values()) {
      const endpoint_catalog = this.getCatalog(tracerCatalogPage.endpoint);
      endpoint_catalog.pages.set(tracerCatalogPage.tracer, tracerCatalogPage);

      const tracer = state.tracer.get(tracerCatalogPage.tracer);
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

    for(const isotopeDelivery of state.isotope_delivery.values()){
      const endpointCatalog = this.getCatalog(isotopeDelivery.delivery_endpoint);
      const production = state.isotope_production.get(isotopeDelivery.production);
      const isotope = state.isotopes.get(production.isotope);
      endpointCatalog.isotopeCatalog.push(isotope);
    }
  }

  /**
   * Gets the entire catalog for a customer, construct an empty if not there
   * @param {Number} endpointID = - the ID of the customer in question
   * @returns {EndpointCatalog}
   */
  getCatalog(endpointID) {
    const index = numberfy(endpointID);
    if(this._endpointCatalogs.has(index)){
      return this._endpointCatalogs.get(index);
    }

    const endpointCatalog = new EndpointCatalog();
    this._endpointCatalogs.set(index, endpointCatalog);
    return endpointCatalog;
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

const TracerShopCatalogContext = createContext(new TracerCatalog(new TracershopState()));

/**
 *
 * @param {TracershopState} state
 * @returns
 */
export function TracerCatalogProvider({ children }){
  const state = useTracershopState();

  // Note that this component is memorized by the react compiler.
  const tracer_catalog = useMemo(() => {
    return new TracerCatalog(state);
  }, [state.tracer_mapping, state.tracer, state.isotope_delivery, state.isotope_production, state.isotopes])

  return (
    <TracerShopCatalogContext.Provider value={tracer_catalog}>
      {children}
    </TracerShopCatalogContext.Provider>
  )
}

export function useTracerCatalog(){
  return useContext(TracerShopCatalogContext);
}
