import { IsotopeProduction } from "~/dataclasses/dataclasses";
import { DAYS } from "~/lib/constants";
import { toMapping } from "~/lib/utils";

export const IsotopeProductions: Map<number, IsotopeProduction> = toMapping([
  new IsotopeProduction(
    1, // ID,
    1, // Isotope,
    DAYS.MONDAY, // Production Day
    "05:00:00", // Production Time
    null // expiry_time
  ),
  new IsotopeProduction(
    2, // ID,
    1, // Isotope,
    DAYS.TUESDAY, // Production Day
    "05:00:00", // Production Time
    null // expiry_time
  ),
  new IsotopeProduction(
    3, // ID,
    1, // Isotope,
    DAYS.WENDSDAY, // Production Day
    "05:00:00", // Production Time
    null // expiry_time
  ),
  new IsotopeProduction(
    4, // ID,
    1, // Isotope,
    DAYS.THURSDAY, // Production Day
    "05:00:00", // Production Time
    null // expiry_time
  ),
  new IsotopeProduction(
    5, // ID,
    1, // Isotope,
    DAYS.FRIDAY, // Production Day
    "05:00:00", // Production Time
    null // expiry_time
  ),
])
