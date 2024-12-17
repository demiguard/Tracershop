import React, {} from "react";
import { TracerCatalogProvider } from "~/effects/tracerCatalog";


export function DerivedContextPyramid({children}){
  return (
    <TracerCatalogProvider>
      {children}
    </TracerCatalogProvider>
  );
}
