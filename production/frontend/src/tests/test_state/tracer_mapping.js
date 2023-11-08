import { TracerCatalogPage } from "~/dataclasses/dataclasses";

export const tracer_mapping = new Map([
  [1, new TracerCatalogPage(
      1, // id
      1, // endpoint
      1, // tracer
      null, // max_injections
      1.25 // overhead_multiplier
)], [2, new TracerCatalogPage(
      2, // id
      1, // endpoint
      2, // tracer
      null, // max_injections
      1 // overhead_multiplier
)], [3, new TracerCatalogPage(
      3, // id
      1, // endpoint
      3, // tracer
      null, // max_injections
      1.15 // overhead_multiplier
)], [4, new TracerCatalogPage(
      4, // id
      1, // endpoint
      4, // tracer
      null, // max_injections
      1 // overhead_multiplier
)], [5, new TracerCatalogPage(
       5, // id
       2, // endpoint
       2, // tracer
       null, // max_injections
       1 // overhead_multiplier
)], [6, new TracerCatalogPage(
      6, // id
      2, // endpoint
      1, // tracer
      null, // max_injections
      1.25 // overhead_multiplier
)], [7, new TracerCatalogPage(
    7, // id
    3, // endpoint
    1, // tracer
    null, // max_injections
    1.25 // overhead_multiplier
)], [8, new TracerCatalogPage(
    7, // id
    3, // endpoint
    3, // tracer
    null, // max_injections
    1 // overhead_multiplier
)],
]);