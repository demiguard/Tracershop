import React, {Component } from "react";
import { ControlPanel } from "./ControlPanel";
import { ProductionSite } from "./productionSite";
import { ShopSite } from "./ShopSite";

export { AdminSite }

const sites = {
  Admin : ControlPanel,
  Production : ProductionSite,
  Shop : ShopSite
}


class AdminSite extends Component {
  constructor(props){
    super(props)

    this.state = {
      ActiveSite : ControlPanel
    }
  }

  render(){
    return(<div>This is the admin page</div>)
  }
}