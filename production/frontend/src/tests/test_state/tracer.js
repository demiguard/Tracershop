import { Tracer } from "~/dataclasses/dataclasses";
import { TRACER_TYPE } from "../../lib/constants";

export const tracers = new Map([
  [1, new Tracer(
      1, // id
      "test_tracer_1", // inconsistency, Fuck // shortname
      "test_clinical_name_1", // clinical_name
      1, // isotope
      TRACER_TYPE.ACTIVITY, // tracer_type
      null, // vial_tag
      false, // archived
      false, // marketed
      true, // is_static_instance
)], [2, new Tracer(
      2, // id
      "test_tracer_2", // shortname
      "test_clinical_name_2", // clinical_name
      1, // isotope
      TRACER_TYPE.DOSE, // tracer_type
      null, // vial_tag
      false, // archived
      true, // is_static_instance
)], [3, new Tracer(
      3, // id
      "test_tracer_3", // shortname
      "test_clinical_name_3", // clinical_name
      3, // isotope
      TRACER_TYPE.ACTIVITY, // tracer_type
      null, // vial_tag
      false, // archived
      false, // marketed
      true,  // is_static_instance
  )], [4, new Tracer(
      4, // id
      "test_tracer_4", // shortname
      "test_clinical_name_4", // clinical_name
      3, // isotope
      TRACER_TYPE.DOSE, // tracer_type
      null, // vial_tag
      false, // archived
      false, // marketed
      true, // is_static_instance
  )], [5, new Tracer(
      5, // id
      "test_tracer_5", // shortname
      "test_clinical_name_5", // clinical_name
      3, // isotope
      TRACER_TYPE.DOSE, // tracer_type
      null, // vial_tag
      true, // archived
      false, // marketed
      true, // is_static_instance
  )], [6, new Tracer(
    6, // id
    "test_tracer_6", // shortname
    "test_clinical_name_6", // clinical_name
    1, // isotope
    TRACER_TYPE.DOSE, // tracer_type
    null, // vial_tag
    true, // archived
    false, // marketed
    true, // is_static_instance
  )],
  [7, new Tracer(
    7, // id
    "test_tracer_7", // shortname
    "test_clinical_name_7", // clinical_name
    1, // isotope
    TRACER_TYPE.DOSE, // tracer_type
    null, // vial_tag
    false, // archived
    false, // marketed
    true, // is_static_instance
  )],
  [8, new Tracer(
    8, // id
    "Archive_able_tracer", // shortname
    "Archive_able_tracer", // clinical_name
    1, // isotope
    TRACER_TYPE.DOSE, // tracer_type
    null, // vial_tag
    false, // archived
    false, // marketed
      true, // is_static_instance
  )],
  [9, new Tracer(
    9, // id
    "test_tracer_6", // shortname
    "test_clinical_name_6", // clinical_name
    1, // isotope
    TRACER_TYPE.DOSE, // tracer_type
    null, // vial_tag
    true, // archived
    false, // marketed
    true, // is_static_instance
  )]
]);
