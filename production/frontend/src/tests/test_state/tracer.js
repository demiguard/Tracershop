import { TRACER_TYPE_ACTIVITY, TRACER_TYPE_DOSE } from "../../lib/constants";

export const tracers = new Map([
  [1, {
      id : 1,
      shortname : "test_tracer_1", // inconsistency, Fuck
      clinical_name : "test_clinical_name_1",
      isotope : 1,
      tracer_type : TRACER_TYPE_ACTIVITY,
      default_price_per_unit : null,
      vial_tag : null
  }], [2, {
      id : 2,
      shortname : "test_tracer_2",
      clinical_name : "test_clinical_name_2",
      isotope : 1,
      tracer_type : TRACER_TYPE_DOSE,
      default_price_per_unit : null,
      vial_tag : null
  }], [3, {
      id : 3,
      shortname : "test_tracer_3",
      clinical_name : "test_clinical_name_#",
      isotope : 3,
      tracer_type : TRACER_TYPE_ACTIVITY,
      default_price_per_unit : null,
      vial_tag : null
  }], [4, {
      id : 4,
      shortname : "test_tracer_4",
      clinical_name : "test_clinical_name_4",
      isotope : 3,
      tracer_type : TRACER_TYPE_DOSE,
      default_price_per_unit : null,
      vial_tag : null
  }]
])