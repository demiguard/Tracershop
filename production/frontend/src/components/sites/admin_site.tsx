import React, { act, lazy, startTransition, Suspense, useRef, useState } from "react";
import { DATABASE_ADMIN_PAGE } from "~/lib/constants";
import { db } from "~/lib/local_storage_driver";
import { ALIGN, ALIGN_ITEMS, MARGIN, NAVBAR_STYLES, PADDING } from "~/lib/styles";
import { NavbarElement } from "../injectable/navbar_element";

const ConfigSite = lazy(() => import('~/components/sites/config_site'))
const ProductionSite = lazy(() => import("~/components/sites/production_site"))
const ShopSite = lazy(() => import("~/components/sites/shop_site"))

/**
 * @enum
 */
const SITES = {
  admin : ConfigSite,
  production : ProductionSite,
  shop : ShopSite,
}

/**
 * @enum
 */
const SITE_NAMES = {
  admin : "Admin",
  production : "Produktion",
  shop : "Kunde"
}

export default function AdminSite({logout}) {
  const [activeSite, setActiveSite] = useState(() => {
    let activeSite: string | undefined | null = db.get(DATABASE_ADMIN_PAGE);

    if (!(activeSite in SITES)){
      db.set(DATABASE_ADMIN_PAGE, "production");
      return "production";
    }
    return activeSite;
  });

  function changeSite(identifier){
    return () => {
      db.set(DATABASE_ADMIN_PAGE, identifier);
       startTransition(() => {
        setActiveSite(identifier)
       })
    }
  }

  const RenderedSites = [...Object.keys(SITES)].sort(
    (a, b) => {
      if (a === activeSite) {
        return -1;
      } else if (b === activeSite) {
        return 1;
      } else {
        return 0;
      }
    }
  ).map((identifier) => (
    <div
      key={identifier}
      aria-label={`navbar-admin-${identifier}`}
      onClick={changeSite(identifier)}
    >
      <strong>{SITE_NAMES[identifier]}</strong>
    </div>))


  const ColStyle : React.CSSProperties = {
    ...ALIGN_ITEMS.CENTER,
    height : "63px",
    paddingTop : "6px",
    paddingLeft : "12px",
    paddingRight : "12px",
    paddingBottom : "6px"
  }

  const NavbarAdmin = [
    <NavbarElement key="test">
      {RenderedSites}
    </NavbarElement>
  ];

  const ActiveSite = SITES[activeSite];

  if(ActiveSite === undefined){
    /* istanbul ignore next */
    throw `Undefined site ${activeSite} attempt to rendered`;
  }

  return(
    <Suspense fallback={<div>LOADING</div>}>
      <ActiveSite
        logout={logout}
        NavbarElements={NavbarAdmin}
      />
    </Suspense>
  );
}
