import { IsotopeVial } from "~/dataclasses/dataclasses";
import { toMapping } from "~/lib/utils";

export const isotopeVials = toMapping([
  new IsotopeVial(
    1, // id
    "F18-20200505-1", // batch number
    null, // delivered with aka which order was this while delivered with,
    10.0, // volume
    "2020-05-05T04:31:00", // calibration time,
    1_000_000, // Activity, Hehehe
    1, // isotope
  ),
  new IsotopeVial(
    2, // id
    "F18-20200505-1", // batch number
    3, // delivered with aka which order was this while delivered with,
    10.0, // volume
    "2020-05-05T04:31:00", // calibration time,
    1_000_000, // Activity, Hehehe
    1, // isotope
  )
]);