import React, {Component } from "react";
import Navbar from "../injectable/navbar";
import { FutureBooking } from "../shop_pages/future_bookings.js";
import { LocationSetup } from "../shop_pages/location_setup.js";
import { ProcedureSetup } from "../shop_pages/procedure_setup.js";
import { ShopOrderPage } from "../shop_pages/shop_order_page.js";

export { ShopSite }

const Pages = {
  Bestillinger : ShopOrderPage,
  Bookinger : FutureBooking,
  Location : LocationSetup,
  Procedure : ProcedureSetup,
}


class ShopSite extends Component {
  constructor(props){
    super(props);
    this.state = {
      ActivePage : ShopOrderPage,
    };
  }

  setActivePage(NewPageName) {
    const NewPage = Pages[NewPageName];
    const NewState = {...this.state, ActivePage : NewPage};
    this.setState(NewState);
  }

  render(){
    return(
      <div>
        <Navbar
          Names={Object.keys(Pages)}
          logout={this.props.logout}
          isAuthenticated={true}
          NavbarElements={this.props.NavbarElements}
          setActivePage={this.setActivePage.bind(this)}
        />
        <this.state.ActivePage
          // composing with props
          closeddates={this.props.closeddates}
          customers={this.props.customers}
          deliverTimes={this.props.deliverTimes}
          employee={this.props.employee}
          isotopes={this.props.isotopes}
          orders={this.props.orders}
          runs={this.props.runs}
          t_orders={this.props.t_orders}
          tracers={this.props.tracers}
          tracerMapping={this.props.tracerMapping}
          vials={this.props.vials}
          websocket={this.props.websocket}
        />
      </div>
    )
  }
}