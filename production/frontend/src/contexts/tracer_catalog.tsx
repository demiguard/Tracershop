import React, { useContext, createContext, useMemo } from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { ActivityDeliveryTimeSlot, Isotope, IsotopeDelivery, IsotopeProduction, Tracer, TracerCatalogPage, TracershopState } from "~/dataclasses/dataclasses";
import { TRACER_TYPE } from "~/lib/constants";
import { numberfy } from "~/lib/utils";

//#region EndpointCatalog
export class EndpointCatalog {
  /** @desc A list of tracers activity available to this endpoint */ tracerCatalogActivity : Set<number>
  /** @desc A list of tracers injection available to this endpoint */ tracerCatalogInjections : Set<number>
  /** @desc A list of tracers injection available to this endpoint */ isotopeCatalog : Set<number>
  /** @desc  A Tracer to overhead percentage, so if a tracer with id 10 have 25 % overhead, this map will have 10 -> 1.25  */ overheadMap : Map<number,number>
  /** @desc A mapping of tracer id to the page */ pages : Map<Number, TracerCatalogPage>

  /**
   * Catalog of product that a single endpoint
   * * @property {Map<Number, TracerCatalogPage>} pages
   */
  constructor() {
    this.tracerCatalogActivity = new Set();
    this.tracerCatalogInjections = new Set();
    this.isotopeCatalog = new Set();
    this.overheadMap = new Map();
    this.pages = new Map();
  }
}

/**
 * Data structure containing information about which tracers a customer have access to
 * Each instance is unique to a customer.
 */
export class TracerCatalog {
  _endpointCatalogs: Map<Number, EndpointCatalog>;

  /**
   * Data structure containing information about which tracers a customer have access to
   * Each instance is unique to a customer.
   */
  constructor(
    tracer_mapping : Map<number,TracerCatalogPage>,
    tracers : Map<number, Tracer>,
    isotope_deliveries : Map<number, IsotopeDelivery>,
    isotope_productions : Map<number, IsotopeProduction>,
    isotopes : Map<number, Isotope>,
  ) {
    this._endpointCatalogs = new Map();

    for (const tracerCatalogPage of tracer_mapping.values()) {
      const endpoint_catalog = this.getCatalog(tracerCatalogPage.endpoint);
      endpoint_catalog.pages.set(tracerCatalogPage.tracer, tracerCatalogPage);

      const tracer = tracers.get(tracerCatalogPage.tracer);
      if (tracer === undefined) {
        throw "Database integrity violated!";
      }

      if (tracer.tracer_type === TRACER_TYPE.ACTIVITY) {
        endpoint_catalog.overheadMap.set(tracerCatalogPage.tracer, tracerCatalogPage.overhead_multiplier);
        endpoint_catalog.tracerCatalogActivity.add(tracer.id);
      } else if (tracer.tracer_type === TRACER_TYPE.DOSE) {
        endpoint_catalog.tracerCatalogInjections.add(tracer.id);
      }
    }

    for(const isotopeDelivery of isotope_deliveries.values()){
      const endpointCatalog = this.getCatalog(isotopeDelivery.delivery_endpoint);
      const production = isotope_productions.get(isotopeDelivery.production);
      const isotope = isotopes.get(production.isotope);
      endpointCatalog.isotopeCatalog.add(isotope.id);
    }
  }

  /**
   * Gets the entire catalog for a customer, construct an empty if not there
   * @param endpointID = - the ID of the customer in question
   */
  getCatalog(endpointID: number | string) {
    const index = numberfy(endpointID);
    if(index === ""){
      return new EndpointCatalog();
    }

    if(this._endpointCatalogs.has(index)){
      return this._endpointCatalogs.get(index);
    }

    const endpointCatalog = new EndpointCatalog();
    this._endpointCatalogs.set(index, endpointCatalog);
    return endpointCatalog;
  }

  getActivityCatalog(customerID: number | string) {
    const index = numberfy(customerID);
    if(index === ""){
      return new Set();
    }

    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog.tracerCatalogActivity;
    }
    return new Set();
  }

  /**
   * Gets the injections tracers a customer can order
   * @param {Number} endpointID
   */
  getInjectionCatalog(endpointID : number | string) {
    const index = numberfy(endpointID);
    if(index === ""){
      return new Set();
    }

    const endpoint_catalog = this._endpointCatalogs.get(index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog.tracerCatalogInjections;
    }
    return new Set();
  }

  getOverheadForTracer(endpointID : number | string, tracerID : number | string) {
    const endpoint_index = numberfy(endpointID);
    const tracer_index = numberfy(tracerID);
    if(endpoint_index === "" || tracer_index === ""){
      console.log(`Undefined customer - ${endpointID}, tracer ${tracerID} referenced`);
      return 1;
    }

    const endpoint_catalog = this._endpointCatalogs.get(endpoint_index);
    if (endpoint_catalog !== undefined) {
      return endpoint_catalog.overheadMap.get(tracer_index);
    }
    // There should be a handle here!
    console.log(`Undefined customer - ${endpointID}, tracer ${tracerID} referenced`);
    return 1;
  }

  getOverheadForTimeSlot(state : TracershopState, timeSlot : ActivityDeliveryTimeSlot){
    const prod = state.production.get(timeSlot.production_run);

    if(prod === undefined){
      return 1;
    }

    return this.getOverheadForTracer(timeSlot.destination, prod.tracer);
  }
}

//@ts-ignore
const TracerShopCatalogContext = createContext(new TracerCatalog(new Map(), new Map(), new Map(), new Map(), new Map()));

export function TracerCatalogProvider({ children }){
  const state = useTracershopState();

  // Note that this component is memorized by the react compiler.
  //const tracer_catalog = useMemo(() => {
  //  return new TracerCatalog(state);
  //}, [state.tracer_mapping, state.tracer, state.isotope_delivery, state.isotope_production, state.isotopes])

  const tracer_catalog = useMemo(() => {
    return new TracerCatalog(
    state.tracer_mapping,
    state.tracer,
    state.isotope_delivery,
    state.isotope_production,
    state.isotopes
  )}, [
    state.tracer_mapping,
    state.tracer,
    state.isotope_delivery,
    state.isotope_production,
    state.isotopes
]);

  return (
    <TracerShopCatalogContext.Provider value={tracer_catalog}>
      {children}
    </TracerShopCatalogContext.Provider>
  )
}

export function useTracerCatalog(){
  return useContext(TracerShopCatalogContext);
}
