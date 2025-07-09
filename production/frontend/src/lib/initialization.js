/** This module exists to provide consistent initialization of various fields */

import { useTracershopState } from "~/contexts/tracer_shop_context";
import { Customer, DeliveryEndpoint, Isotope, Tracer, TracerCatalogPage, TracershopState } from "../dataclasses/dataclasses";
import { numberfy } from "./utils";
import { TRACER_TYPE } from "~/lib/constants";
import { PRODUCTION_TYPES, ProductionReference } from "~/dataclasses/product_reference";

/**
 *
 * @param {Map<Number, Customer>} customers
 * @param {Map<Number, DeliveryEndpoint>} endpoints
 * @returns {
 *  customer : Number - Id of initial customer,
 *  endpoint : Number - Id of initial endpoint - owned by customer
 * }
 */
export function initialize_customer_endpoint(
  customers, endpoints
){
  let /**@type {String | Number} */ customerInit = "";
  let /**@type {String | Number} */ endpointInit = "";

  for(const customer of customers.values()){
    customerInit = customer.id;
    break;
  }

  for(const endpoint of endpoints.values()){
    if(endpoint.owner === customerInit){
      endpointInit = endpoint.id;
      break;
    }
  }

  customerInit = numberfy(customerInit)
  endpointInit = numberfy(endpointInit)

  return {
    customer : customerInit,
    endpoint : endpointInit,
  }
}

/**
 * Initialize customer a related endpoint a tracer
 * @param {Map<Number, DeliveryEndpoint>} endpoints
 * @param {Map<Number, TracerCatalogPage>} tracerCatalogPages
 * @returns
 *
 * @example initialize_customer_endpoint_tracer_from_tracerCatalog(props[DATA_ENDPOINT], props[DATA_TRACER_MAPPING])
 */
export function initialize_injection_customer_from_catalog(
  endpoints, tracerCatalogPages, state
){

  let /**@type {Number | String} */ customerInit = "";
  let /**@type {Number | String} */ endpointInit = "";
  let /**@type {Number | String} */ tracerInit = "";

  for(const tracerCatalogPage of tracerCatalogPages.values()){
    endpointInit = tracerCatalogPage.endpoint;
    tracerInit = tracerCatalogPage.tracer;
    customerInit = endpoints.get(endpointInit).owner;
    const tracer = state.tracer.get(tracerInit)
    if(tracer.tracer_type === TRACER_TYPE.DOSE){
      break;
    }
  }

  customerInit = numberfy(customerInit);
  endpointInit = numberfy(endpointInit);
  tracerInit = numberfy(tracerInit);

  return {
    customer : customerInit,
    endpoint : endpointInit,
    tracer : tracerInit
  };
}

/**
 * Select the first production of the tracer in the week. Returns an Id reference
 * @param {TracershopState} state
 * @param {Number | String} activity_tracer
 * @returns  {Number | String} -
 */
export function initializeProductionRun(state, activity_tracer) {
  /**
   * Compares two activity production to find the better default
    * @param {ActivityProduction | null} prod_1
    * @param {ActivityProduction} prod_2
    * @returns {ActivityProduction}
    */
  function compare_productions(prod_1, prod_2){
    if(prod_1 === null){
      return prod_2;
    }
    if(prod_1.production_day < prod_2.production_day){
      return prod_1;
    }
    if(prod_1.production_day > prod_2.production_day){
      return prod_2;
    }
    if(prod_1.production_time < prod_2.production_time){
      return prod_1;
    } else {
      return prod_2;
    }
  }

  let prod = null;
  for(const production of state.production.values()){
    if(production.tracer === Number(activity_tracer)){
      prod = compare_productions(prod, production);
    }
  }
  return prod ? prod.id : "";
}

/** Gets a reference to the production that is active from a blank state
 *
 * @param {Array<Tracer | Isotope>} options
 * @returns {ProductionReference}
 */
export function initializeProductionReference(options){
  const initial_production = options.at(0);

  if(initial_production === undefined){
    return new ProductionReference(-1, PRODUCTION_TYPES.EMPTY);
  }

  if (initial_production instanceof Isotope){
    return new ProductionReference(initial_production.id, PRODUCTION_TYPES.ISOTOPE_PRODUCTION);
  } else if (initial_production instanceof Tracer) {
    return new ProductionReference(initial_production.id, PRODUCTION_TYPES.PRODUCTION);
  }

  throw TypeError("Initialization array is not type safe!")
}