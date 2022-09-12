import React, {Component } from "react";
import { NavDropdown } from "react-bootstrap";
import { ControlPanel } from "./ControlPanel";
import { ProductionSite } from "./productionSite";
import { ShopSite } from "./ShopSite";

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

    this.state = {
      ActiveSite : "Production"
    }
  }

  changeSite(){
    const returnFunction = (event) => {
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
        className="navbarElem"
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