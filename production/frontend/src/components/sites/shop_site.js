import React, {Component } from "react";
import { propsExtraction } from "../../lib/props_management";
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
    const props = propsExtraction(this.props);
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
          {...props}
        />
      </div>
    )
  }
}