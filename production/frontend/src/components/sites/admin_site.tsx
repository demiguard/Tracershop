import React, { lazy, startTransition, Suspense, useRef, useState } from "react";
import { Col, NavDropdown } from "react-bootstrap";
import { DATABASE_ADMIN_PAGE } from "~/lib/constants";
import { db } from "~/lib/local_storage_driver";
import { ALIGN, ALIGN_ITEMS, MARGIN, NAVBAR_STYLES, PADDING } from "~/lib/styles";

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

  const RenderedSites = [];
  for (const siteKey of Object.keys(SITES)){
    RenderedSites.push(
      <NavDropdown.Item
        aria-label={`navbar-admin-${siteKey}`}
        key={siteKey}
        onClick={changeSite(siteKey)}
      >
        {SITE_NAMES[siteKey]}
      </NavDropdown.Item>)
    }

  const ColStyle : React.CSSProperties = {
    ...ALIGN_ITEMS.CENTER,
    height : "63px",
    paddingTop : "6px",
    paddingLeft : "12px",
    paddingRight : "12px",
    paddingBottom : "6px"
  }

  const NavbarAdmin = [(
    <Col style={ColStyle} key="SiteSelector">
      <NavDropdown
        style={{
          display : "flex",
          height : "36px",
          backgroundColor : "#0d6efd",
          ...MARGIN.topBottom.px0,
          ...NAVBAR_STYLES.navbarElement,
          alignItems : "center",
          justifyContent : "center"

        }}
        aria-label="site-selector"
        title={<span style={{color : "white"}}>{SITE_NAMES[activeSite]}</span>}
      >
        {RenderedSites}
      </NavDropdown>
    </Col>)];

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
