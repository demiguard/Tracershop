/** This module exists to provide consistent initialization of various fields */

import { useTracershopState } from "~/contexts/tracer_shop_context";
import { Customer, DeliveryEndpoint, TracerCatalogPage } from "../dataclasses/dataclasses";
import { numberfy } from "./utils";
import { TRACER_TYPE } from "~/lib/constants";

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