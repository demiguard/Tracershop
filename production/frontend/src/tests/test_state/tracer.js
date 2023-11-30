import { Tracer } from "~/dataclasses/dataclasses";
import { TRACER_TYPE } from "../../lib/constants";

export const tracers = new Map([
  [1, new Tracer(
      1, // id
      "test_tracer_1", // inconsistency, Fuck // shortname
      "test_clinical_name_1", // clinical_name
      1, // isotope
      TRACER_TYPE.ACTIVITY, // tracer_type
      null, // default_price_per_unit
      null, // vial_tag
      false, // archived
)], [2, new Tracer(
      2, // id
      "test_tracer_2", // shortname
      "test_clinical_name_2", // clinical_name
      1, // isotope
      TRACER_TYPE.DOSE, // tracer_type
      null, // default_price_per_unit
      null, // vial_tag
      false, // archived
)], [3, new Tracer(
      3, // id
      "test_tracer_3", // shortname
      "test_clinical_name_3", // clinical_name
      3, // isotope
      TRACER_TYPE.ACTIVITY, // tracer_type
      null, // default_price_per_unit
      null, // vial_tag
      false, // archived
  )], [4, new Tracer(
      4, // id
      "test_tracer_4", // shortname
      "test_clinical_name_4", // clinical_name
      3, // isotope
      TRACER_TYPE.DOSE, // tracer_type
      null, // default_price_per_unit
      null, // vial_tag
      false, // archived
  )], [5, new Tracer(
      5, // id
      "test_tracer_5", // shortname
      "test_clinical_name_5", // clinical_name
      3, // isotope
      TRACER_TYPE.DOSE, // tracer_type
      null, // default_price_per_unit
      null, // vial_tag
      true // archived
  )], [6, new Tracer(
    6, // id
    "test_tracer_6", // shortname
    "test_clinical_name_6", // clinical_name
    1, // isotope
    TRACER_TYPE.DOSE, // tracer_type
    null, // default_price_per_unit
    null, // vial_tag
    true, // archived
  )],
  [7, new Tracer(
    7, // id
    "test_tracer_7", // shortname
    "test_clinical_name_7", // clinical_name
    1, // isotope
    TRACER_TYPE.DOSE, // tracer_type
    null, // default_price_per_unit
    null, // vial_tag
    false // archived
  )],
  [8, new Tracer(
    8, // id
    "Archive_able_tracer", // shortname
    "Archive_able_tracer", // clinical_name
    1, // isotope
    TRACER_TYPE.DOSE, // tracer_type
    null, // default_price_per_unit
    null, // vial_tag
    false // archived
  )]

])