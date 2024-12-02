import { Isotope } from "~/dataclasses/dataclasses"

export const isotopes = new Map([
  [1, new Isotope(
       1, //id
       56, //atomic_number
      139, //atomic_mass
      83.06 * 60, //halflife_seconds
      "Ba", //atomic_letter
      false, //metastable
  )], [2, new Isotope(
      2, // id
      92, // atomic_number
      235, // atomic_mass
      703800000 * 31556926, // Nuclear weapons doesn't make for good tracers // halflife_seconds
      "U", // atomic_letter
      false // metastable
   )], [ 3, new Isotope(
      3, //id
      43, //atomic_number
      99, //atomic_mass
      6.0067 * 3600, //halflife_seconds
      "Tc", //atomic_letter
      true, //metastable
  )],
]);
