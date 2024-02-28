/** This module exists to provide consistent initialization of various fields */

import { DeliveryEndpoint, TracerCatalogPage } from "../dataclasses/dataclasses";
import { numberfy } from "./utils";

/**
 *
 * @param {*} customers
 * @param {*} endpoints
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
export function initialize_customer_endpoint_tracer_from_tracerCatalog(
  endpoints, tracerCatalogPages,
){
  let /**@type {Number | String} */ customerInit = "";
  let /**@type {Number | String} */ endpointInit = "";
  let /**@type {Number | String} */ tracerInit = "";

  for(const tracerCatalogPage of tracerCatalogPages.values()){
    endpointInit = tracerCatalogPage.endpoint;
    tracerInit = tracerCatalogPage.tracer;
    customerInit = endpoints.get(endpointInit).owner;
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