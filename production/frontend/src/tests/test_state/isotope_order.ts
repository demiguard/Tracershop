import { IsotopeOrder } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";
import { toMapping } from "~/lib/utils";

export const isotopeOrder = toMapping([
  new IsotopeOrder(
    1, // id
    ORDER_STATUS.ORDERED, // Order status
    5, // Order by shop user
    1_500_000, // Order activity
    1, // Isotope Delivery
    "2020-05-05", // Delivery date
    "", // Comment
    null, // Freed by
    null, // Freed datetime
  ),
  new IsotopeOrder(
    2, // id
    ORDER_STATUS.ACCEPTED, // Order status
    5, // Order by shop user
    1_500_000, // Order activity
    1, // Isotope Delivery
    "2020-05-05", // Delivery date
    "", // Comment
    null, // Freed by
    null, // Freed datetime
  ),
  new IsotopeOrder(
    3, // id
    ORDER_STATUS.RELEASED, // Order status
    5, // Order by shop user
    1_500_000, // Order activity
    1, // Isotope Delivery
    "2020-05-05", // Delivery date
    "", // Comment
    3, // Freed by prodUser
    "2020-05-05T05:01:31", // Freed datetime
  ),
  new IsotopeOrder(
    4, // id
    ORDER_STATUS.CANCELLED, // Order status
    5, // Order by shop user
    1_500_000, // Order activity
    1, // Isotope Delivery
    "2020-05-05", // Delivery date
    "", // Comment
    null, // Freed by
    null, // Freed datetime
  ),
])