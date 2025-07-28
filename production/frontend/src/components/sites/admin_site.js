import React, { useRef, useState } from "react";
import { Col, NavDropdown } from "react-bootstrap";
import { DATABASE_ADMIN_PAGE } from "~/lib/constants";
import { db } from "~/lib/local_storage_driver";
import { ConfigSite } from "./config_site";
import { ProductionSite } from "./production_site";
import { ShopSite } from "./shop_site";
import { MARGIN, NAVBAR_STYLES } from "~/lib/styles";

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
  const init = useRef({
    activeSite : null
  });

  if(init.current.activeSite === null){
    let /**@type {string} */ activeSite = db.get(DATABASE_ADMIN_PAGE);
    if (activeSite === undefined || activeSite === null){
      activeSite = "production";
      db.set(DATABASE_ADMIN_PAGE, activeSite);
    }
    init.current.activeSite = activeSite
  }

  const [activeSite, setActiveSite] = useState(() => {
    let /**@type {string} */ activeSite = db.get(DATABASE_ADMIN_PAGE);
    if (activeSite === undefined || activeSite === null){
      db.set(DATABASE_ADMIN_PAGE, SITE_NAMES.production);
      return SITE_NAMES.production
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
    <Col key="SiteSelector">
      <NavDropdown
        className={"btn-primary"}
        style={{
          ...MARGIN.topBottom.px0,
          ...NAVBAR_STYLES.navbarElement
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
