import React, {} from "react";
import { DeliveryCodexProvider } from "~/contexts/delivery_codex";
import { ProcedureContext } from "~/contexts/procedure_context";
import { ProductionCodexProvider } from "~/contexts/production_codex";
import { TracerCatalogProvider } from "~/contexts/tracer_catalog";
import { UserReleaseRightProvider } from "~/contexts/user_release_right";

export function DerivedContextPyramid({children}){
  return (

    // BEHOLD THE PYRAMID!

    <UserReleaseRightProvider>
      <DeliveryCodexProvider>
        <TracerCatalogProvider>
          <ProcedureContext>
            <ProductionCodexProvider>
              {children}
            </ProductionCodexProvider>
          </ProcedureContext>
        </TracerCatalogProvider>
      </DeliveryCodexProvider>
    </UserReleaseRightProvider>
  );
}
