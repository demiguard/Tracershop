import React, { createContext, useContext, useMemo } from "react";

import { ActivityProduction, IsotopeProduction, Tracer } from "~/dataclasses/dataclasses";
import { ArrayMap } from "~/lib/array_map";
import { useTracershopState } from "./tracer_shop_context";


export class ProductionCodex {
  tracer_mapping : ArrayMap<number, number>
  isotope_mapping : ArrayMap<number, number>

  constructor(
    productions: Map<number, ActivityProduction>,
    isotope_productions: Map<number, IsotopeProduction>
  ){
    this.tracer_mapping = new ArrayMap();
    this.isotope_mapping = new ArrayMap();

    for(const production of productions.values()){
      this.tracer_mapping.set(production.tracer, production.id);
    }

    for(const production of isotope_productions.values()){
      this.isotope_mapping.set(production.isotope, production.id);
    }
  }

  getTracerProductions(tracerID: number) {
    return this.tracer_mapping.get(tracerID);
  }

  getIsotopeProduction(isotopeID: number){
    return this.isotope_mapping.get(isotopeID);
  }
}

const ProductionCodexContext = createContext(new ProductionCodex(new Map(), new Map()));

export function useProductionCodex() {
  return useContext(ProductionCodexContext);
}

export function ProductionCodexProvider({children}){
  const state = useTracershopState();

  const productionCodex = useMemo(() => {
    return new ProductionCodex(state.production, state.isotope_production);
  },[state.production, state.isotope_production])

  return (
    <ProductionCodexContext.Provider value={productionCodex}>
      {children}
    </ProductionCodexContext.Provider>
  )

}