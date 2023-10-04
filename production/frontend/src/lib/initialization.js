/** This module exists to provide consistent initialization of various fields */

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

export function initialize_customer_endpoint_from(
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