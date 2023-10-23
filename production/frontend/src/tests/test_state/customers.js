import { Customer } from "~/dataclasses/dataclasses"

export const customers = new Map([
  [1, new Customer(
      1, // id
      "Customer_1", // short_name
      "Customer_long_name_1", // long_name
      1, // dispenser_id
      null, // billing_address
      null, // billing_city
      null, // billing_email
      null, // billing_phone
      null, // billing_zip_code
      null, // Drop this keyword? // active_directory_code
    )], [2, new Customer(
      2, // id
      "Customer_2", // short_name
      "Customer_long_name_2", // long_name
      2, // dispenser_id
      null, // billing_address
      null, // billing_city
      null, // billing_email
      null, // billing_phone
      null, // billing_zip_code
      null, // active_directory_code
)], [3 , new Customer(
       3, // id
       "Customer_3", // short_name
       "Customer_long_name_3", // long_name
       3, // dispenser_id
       null, // billing_address
       null, // billing_city
       null, // billing_email
       null, // billing_phone
       null, // billing_zip_code
       null, // active_directory_code
)], [4 , new Customer(
      4, // id
      "Customer_no_endpoint", // short_name
      "Customer_long_name_no_endpoint", // long_name
      3, // dispenser_id
      null, // billing_address
      null, // billing_city
      null, // billing_email
      null, // billing_phone
      null, // billing_zip_code
      null, // active_directory_code
    )],
])