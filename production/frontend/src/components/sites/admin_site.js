import React, { useState } from "react";
import { NavDropdown } from "react-bootstrap";
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
  shop : ShopSite
}

/**
 * @enum
 */
const SITE_NAMES = {
  admin : "Admin",
  production : "Produktion",
  shop : "Kunde"
}


export function AdminSite(props) {
  let /**@type {string} */ activeSiteInit = db.get(DATABASE_ADMIN_PAGE);
  if (activeSiteInit === undefined || activeSiteInit === null){
    activeSiteInit = "production";
    db.set(DATABASE_ADMIN_PAGE, activeSiteInit);
  }

  const [activeSite, setActiveSite] = useState(activeSiteInit)

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
    <NavDropdown
      aria-label="site-selector"
      className={styles.NavbarElement + " btn-outline-primary " + SiteStyles.pad0tb}
      title={SITE_NAMES[activeSite]}
      key="SiteSelector"
    >
      {RenderedSites}
    </NavDropdown>)];
  const ActiveSite = SITES[activeSite];
  const siteProps = {...props}
  siteProps["NavbarElements"] = NavbarAdmin;

  return(<ActiveSite
    {...siteProps}
  />);
}
