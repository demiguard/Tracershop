import React, {Component } from "react";
import { Container } from "react-bootstrap";
import { DATABASE_SHOP_CUSTOMER, DATABASE_TODAY } from "../../lib/constants";
import { db } from "../../lib/localStorageDriver";
import Navbar from "../injectables/Navbar";
import { FutureBooking } from "../ShopPages/FutureBookings";
import { LocationSetup } from "../ShopPages/LocationSetup";
import { ProcedureSetup } from "../ShopPages/ProcedureSetup";
import { ShopOrderPage } from "../ShopPages/ShopOrderPage";

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

    var customer = this.props.customers.get(db.get(DATABASE_SHOP_CUSTOMER));

    if(customer == undefined){
      for(const [CID, _customer] of this.props.customers){
        db.set(DATABASE_SHOP_CUSTOMER, CID)
        customer = _customer
        break;
      }
    }

    var today = db.get(DATABASE_TODAY);

    if(today == null || today == undefined){
      today = new Date();
      db.set(DATABASE_TODAY, today)
    }

    this.state = {
      ActivePage : ShopOrderPage,
      activeCustomer : customer,
      today : today,
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

        />
      </div>
    )
  }
}