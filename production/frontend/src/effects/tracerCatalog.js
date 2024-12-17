import React, {useMemo, useContext, createContext } from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { TracershopState } from "~/dataclasses/dataclasses";
import { TracerCatalog } from "~/lib/data_structures";

const TracerShopCatalogContext = createContext(null)

/**
 *
 * @param {TracershopState} state
 * @returns
 */
export function TracerCatalogProvider({ children }){
  const state = useTracershopState();
  const tracer_catalog = useMemo(() => {
    return new TracerCatalog(state.tracer_mapping, state.tracer)
  }, [state]);

  return (
    <TracerShopCatalogContext.Provider value={tracer_catalog}>
      {children}
    </TracerShopCatalogContext.Provider>
  )
}

export function useTracerCatalog(){
  return useContext(TracerShopCatalogContext);
}
