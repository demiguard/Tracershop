import React, {Component } from "react";
import { NavDropdown } from "react-bootstrap";
import { DATABASE_ADMIN_PAGE } from "../../lib/constants.js";
import { db } from "../../lib/local_storage_driver.js";
import { ConfigSite } from "./config_site.js";
import { ProductionSite } from "./production_site.js";
import { ShopSite } from "./shop_site.js";

import styles from "/src/css/Navbar.module.css"
import SiteStyles from "/src/css/Site.module.css"

export { AdminSite }


const sites = {
  Admin : ConfigSite,
  Production : ProductionSite,
  Shop : ShopSite
}


class AdminSite extends Component {
  constructor(props){
    super(props)

    var ActiveSite = db.get(DATABASE_ADMIN_PAGE);
    if (ActiveSite === undefined || ActiveSite === null){
      ActiveSite = "Production";
      db.set(DATABASE_ADMIN_PAGE, ActiveSite);
    }

    this.state = {
      ActiveSite : ActiveSite
    }
  }

  changeSite(){
    const returnFunction = (event) => {
      db.set(DATABASE_ADMIN_PAGE, event.target.text);
      this.setState({...this.state,
        ActiveSite : event.target.text
      })
    }
    return returnFunction.bind(this)
  }

  render(){
    const RenderedSites = [];
    for (const siteKey of Object.keys(sites)){
      RenderedSites.push(
        <NavDropdown.Item
          key={siteKey}
          onClick={this.changeSite().bind(this)}
        >
          {siteKey}
        </NavDropdown.Item>
      )
    }


    const NavbarAdmin = [
      (
      <NavDropdown
        className={styles.NavbarElement + " btn-outline-primary " + SiteStyles.pad0tb}
        title={this.state.ActiveSite}
        key="SiteSelector"
      >
        {RenderedSites}
      </NavDropdown>)
    ];


    const ActiveSite = sites[this.state.ActiveSite];

    if (ActiveSite == undefined) {
      const errorString = "Unknown attempted to render admin site: " + this.state.ActiveSite
      throw errorString;
    }

    return(<ActiveSite
      user={this.props.user}
      address={this.props.address}
      closeddates={this.props.closeddates}
      customers={this.props.customers}
      database={this.props.database}
      deliverTimes={this.props.deliverTimes}
      employee={this.props.employee}
      isotopes={this.props.isotopes}
      logout={this.props.logout}
      NavbarElements={NavbarAdmin}
      orders={this.props.orders}
      runs={this.props.runs}
      t_orders={this.props.t_orders}
      tracers={this.props.tracers}
      tracerMapping={this.props.tracerMapping}
      serverConfig={this.props.serverConfig}
      vials={this.props.vials}
      websocket={this.props.websocket}
    />);
  }
}