import React, { useRef, useState } from "react";
import { Col, NavDropdown } from "react-bootstrap";
import { DATABASE_ADMIN_PAGE } from "~/lib/constants";
import { db } from "~/lib/local_storage_driver";
import { ConfigSite } from "./config_site";
import { ProductionSite } from "./production_site";
import { ShopSite } from "./shop_site";
import { ALIGN, ALIGN_ITEMS, MARGIN, NAVBAR_STYLES, PADDING } from "~/lib/styles";

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


export function AdminSite({logout}) {
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
       setActiveSite(identifier)
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

  const NavbarAdmin = [(
    <Col style={{...PADDING.all.px0, ...ALIGN_ITEMS.CENTER}} key="SiteSelector">
      <NavDropdown
        className={"btn-primary"}
        style={{
          ...MARGIN.topBottom.px0,
          ...PADDING.all.px0,
          ...NAVBAR_STYLES.navbarElement,
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

  return(<ActiveSite
    logout={logout}
    NavbarElements={NavbarAdmin}
  />);
}
