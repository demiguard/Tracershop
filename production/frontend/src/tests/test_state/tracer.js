import { TRACER_TYPE } from "../../lib/constants";

export const tracers = new Map([
  [1, {
      id : 1,
      shortname : "test_tracer_1", // inconsistency, Fuck
      clinical_name : "test_clinical_name_1",
      isotope : 1,
      tracer_type : TRACER_TYPE.ACTIVITY,
      default_price_per_unit : null,
      vial_tag : null,
      archived : false,
  }], [2, {
      id : 2,
      shortname : "test_tracer_2",
      clinical_name : "test_clinical_name_2",
      isotope : 1,
      tracer_type : TRACER_TYPE.DOSE,
      default_price_per_unit : null,
      vial_tag : null,
      archived : false,
  }], [3, {
      id : 3,
      shortname : "test_tracer_3",
      clinical_name : "test_clinical_name_3",
      isotope : 3,
      tracer_type : TRACER_TYPE.ACTIVITY,
      default_price_per_unit : null,
      vial_tag : null,
      archived : false,
  }], [4, {
      id : 4,
      shortname : "test_tracer_4",
      clinical_name : "test_clinical_name_4",
      isotope : 3,
      tracer_type : TRACER_TYPE.DOSE,
      default_price_per_unit : null,
      vial_tag : null,
      archived : false,
  }], [5, {
    id : 5,
    shortname : "test_tracer_5",
    clinical_name : "test_clinical_name_5",
    isotope : 3,
    tracer_type : TRACER_TYPE.DOSE,
    default_price_per_unit : null,
    vial_tag : null,
    archived : true
  }], [6, {
    id : 6,
    shortname : "test_tracer_6",
    clinical_name : "test_clinical_name_6",
    isotope : 1,
    tracer_type : TRACER_TYPE.DOSE,
    default_price_per_unit : null,
    vial_tag : null,
    archived : true
  }],
  [6, {
    id : 7,
    shortname : "test_tracer_7",
    clinical_name : "test_clinical_name_7",
    isotope : 1,
    tracer_type : TRACER_TYPE.DOSE,
    default_price_per_unit : null,
    vial_tag : null,
    archived : false
  }]

])