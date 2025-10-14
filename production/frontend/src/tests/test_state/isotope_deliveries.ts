import { IsotopeDelivery } from "~/dataclasses/dataclasses";
import { WEEKLY_REPEAT_CHOICES } from "~/lib/constants";
import { toMapping } from "~/lib/utils";

export const isotopeDeliveries = toMapping([
  new IsotopeDelivery(
    1, // id
    1, // Production isotope 1 - Monday - 05:00:00
    WEEKLY_REPEAT_CHOICES.ALL,
    1, // Delivery Endpoint
    "07:00:00" // Delivery times
  ),
  new IsotopeDelivery(
    2, // id
    2, // Production isotope 1 - Monday - 05:00:00
    WEEKLY_REPEAT_CHOICES.ALL,
    1, // Delivery Endpoint
    "07:00:00" // Delivery times
  ),
  new IsotopeDelivery(
    3, // id
    3, // Production isotope 1 - Monday - 05:00:00
    WEEKLY_REPEAT_CHOICES.ALL,
    1, // Delivery Endpoint
    "07:00:00" // Delivery times
  ),
  new IsotopeDelivery(
    4, // id
    4, // Production isotope 1 - Monday - 05:00:00
    WEEKLY_REPEAT_CHOICES.ALL,
    1, // Delivery Endpoint
    "07:00:00" // Delivery times
  ),
  new IsotopeDelivery(
    5, // id
    5, // Production isotope 1 - Monday - 05:00:00
    WEEKLY_REPEAT_CHOICES.ALL,
    1, // Delivery Endpoint
    "07:00:00" // Delivery times
  ),
]);