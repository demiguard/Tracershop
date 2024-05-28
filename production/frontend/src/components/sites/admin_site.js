import React, { useRef, useState } from "react";
import { Col, NavDropdown } from "react-bootstrap";
import { DATABASE_ADMIN_PAGE } from "../../lib/constants.js";
import { db } from "../../lib/local_storage_driver.js";
import { ConfigSite } from "./config_site.js";
import { ProductionSite } from "./production_site.js";
import { ShopSite } from "./shop_site.js";

import styles from "/src/css/Navbar.module.css"
import SiteStyles from "/src/css/Site.module.css"

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

  const [activeSite, setActiveSite] = useState(init.current.activeSite);

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
        className={styles.NavbarElement + " btn-primary " + SiteStyles.pad0tb}
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
