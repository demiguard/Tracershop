import { DeliveryEndpoint } from "~/dataclasses/dataclasses";

export const deliveryEndpoints = new Map([
  [1, new DeliveryEndpoint(
    1, // id
    "Does Exists Street 3", // address
    "Imagine stand", // city
    "9999", // zip_code
    "phone", // phone
    "endpoint_1_c1", // name
    1, // owner
    )], [2, new DeliveryEndpoint(
    2, // id :
    "Does Exists Street 4", // address :
    "Imagine stand", // city :
    "9999", // zip_code :
    "phone", // phone :
    "endpoint_2_c1", // name :
    1, // owner :
    )], [3, new DeliveryEndpoint(
      3, // id :
      "Does Exists Street 5", // address :
      "Imagine stand", // city :
      "9999", // zip_code :
       "phone", // phone :
      "endpoint_1_c2", // name :
      2, // owner :
    )], [4, new DeliveryEndpoint(
      4, // id :
      "Does Exists Street 6", // address :
      "Imagine stand", // city :
      "9999", // zip_code :
      "phone", // phone :
      "endpoint_1_c3", // name :
      3, // owner :
    )], [5, new DeliveryEndpoint(
      5, // id :
      "Does Exists Street 6", // address :
      "Imagine stand", // city :
      "9999", // zip_code :
      "phone", // phone :
      "endpoint_2_c3", // name :
      3, // owner :
    )],
])