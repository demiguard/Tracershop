import React, {} from "react";
import { TracerCatalogProvider } from "~/contexts/tracerCatalog";
import { UserReleaseRightProvider } from "~/contexts/user_release_right";

export function DerivedContextPyramid({children}){
  return (
    <UserReleaseRightProvider>
      <TracerCatalogProvider>
        {children}
      </TracerCatalogProvider>
    </UserReleaseRightProvider>
  );
}
