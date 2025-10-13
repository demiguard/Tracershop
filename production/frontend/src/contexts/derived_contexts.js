import React, {} from "react";
import { ProcedureContext } from "~/contexts/procedure_context";
import { TracerCatalogProvider } from "~/contexts/tracer_catalog";
import { UserReleaseRightProvider } from "~/contexts/user_release_right";

export function DerivedContextPyramid({children}){
  return (
    <UserReleaseRightProvider>
      <TracerCatalogProvider>
        <ProcedureContext>
          {children}
        </ProcedureContext>
      </TracerCatalogProvider>
    </UserReleaseRightProvider>
  );
}
