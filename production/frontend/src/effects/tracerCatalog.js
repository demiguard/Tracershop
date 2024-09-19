import React, {useMemo} from "react";
import { useTracershopState } from "~/components/tracer_shop_context";
import { TracerCatalog } from "~/lib/data_structures";

export function useTracerCatalog(){
  const state = useTracershopState();

  const tracerCatalog = useMemo(() => {
    return new TracerCatalog(state.tracer_mapping, state.tracer)
  })

  return tracerCatalog;
}