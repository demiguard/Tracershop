import React, {Component } from "react";
import { NavDropdown } from "react-bootstrap";
import { DATABASE_ADMIN_PAGE } from "../../lib/constants";
import { db } from "../../lib/localStorageDriver";
import { ControlPanel } from "./ControlPanel";
import { ProductionSite } from "./productionSite";
import { ShopSite } from "./ShopSite";

import styles from "/src/css/Navbar.module.css"

export { AdminSite }

const AdminPages = {

}


const sites = {
  Admin : ControlPanel,
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
        className={styles.NavbarElement}
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