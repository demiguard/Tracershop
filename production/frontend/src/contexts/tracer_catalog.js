import React, { useContext, createContext } from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { TracerCatalogPage, TracershopState } from "~/dataclasses/dataclasses";
import { TRACER_TYPE } from "~/lib/constants";
import { numberfy } from "~/lib/utils";

//#region EndpointCatalog
export class EndpointCatalog {
  /**@type {Array<Tracer>} @desc A list of tracers activity available to this endpoint */ tracerCatalogActivity
  /**@type {Array<Tracer>} @desc A list of tracers injection available to this endpoint */ tracerCatalogInjections
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
   * @param {Map<Number, TracerCatalogPage>} tracerCatalogPages
   * The Collection of mappings of customer to tracer, where an entry implies the customer is allowed to order
   * @param {Map<Number, Tracer>} tracers The Collection of all tracers
   */
  constructor(tracerCatalogPages, tracers, isotopes=[]) {
    this._endpointCatalogs = new Map();

    for (const tracerCatalogPage of tracerCatalogPages.values()) {
      if (!this._endpointCatalogs.has(tracerCatalogPage.endpoint)) {
        this._endpointCatalogs.set(tracerCatalogPage.endpoint, new EndpointCatalog());
      }

      const endpoint_catalog = this._endpointCatalogs.get(tracerCatalogPage.endpoint);
      endpoint_catalog.pages.set(tracerCatalogPage.tracer, tracerCatalogPage);

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
   * @param {Number} endpointIDcatalogContext = - the ID of the customer in question
   * @returns {EndpointCatalog}
   */
  getCatalog(endpointID) {
    const index = numberfy(endpointID);

    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog;
    }

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

const TracerShopCatalogContext = createContext(new TracerCatalog(new Map(), new Map()));

/**
 *
 * @param {TracershopState} state
 * @returns
 */
export function TracerCatalogProvider({ children }){
  const state = useTracershopState();
  const tracer_catalog = new TracerCatalog(state.tracer_mapping, state.tracer);

  return (
    <TracerShopCatalogContext.Provider value={tracer_catalog}>
      {children}
    </TracerShopCatalogContext.Provider>
  )
}

export function useTracerCatalog(){
  return useContext(TracerShopCatalogContext);
}
