/** This module exists to provide consistent initialization of various fields */

import { DeliveryEndpoint, TracerCatalogPage } from "../dataclasses/dataclasses";

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
  let customerInit = "";
  let endpointInit = "";

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
 * @example initialize_customer_endpoint_tracer_from_tracerCatalog(props[JSON_ENDPOINT], props[JSON_TRACER_MAPPING])
 */
export function initialize_customer_endpoint_tracer_from_tracerCatalog(
  endpoints, tracerCatalogPages,
){
  let customerInit = "";
  let endpointInit = "";
  let tracerInit = "";

  for(const tracerCatalogPage of tracerCatalogPages.values()){
    customerInit = tracerCatalogPage.customer;
    tracerInit = tracerCatalogPage.tracer
  }

  for(const endpoint of endpoints.values()){
    if(endpoint.owner === customerInit){
      endpointInit = endpoint.id;
      break;
    }
  }

  return {
    customer : customerInit,
    endpoint : endpointInit,
    tracer : tracerInit
  }
}