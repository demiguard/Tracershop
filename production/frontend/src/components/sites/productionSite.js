import React, {Component } from "react";
import Navbar from "../injectables/Navbar";
import { CloseDaysPage } from "../pages/CloseDaysPage";
import CustomerPage from "../pages/CustomerPage";
import EmailSetupPage from "../pages/EmailSetupPage";
import { OrderPage } from "../pages/OrderPage";
import { ServerConfigPage } from "../pages/ServerConfig";
import TracerPage from "../pages/TracerPage";
import { VialPage } from "../pages/VialPage";

export {ProductionSite}



const Pages = {
  Ordre : OrderPage,
  Kunder : CustomerPage,
  Tracers : TracerPage,
  Email : EmailSetupPage,
  Lukkedage : CloseDaysPage,
  Vial : VialPage,
  Indstillinger : ServerConfigPage,
};



class ProductionSite extends Component{
  constructor(props){
    super(props);

    const state = {
      ActivePage : OrderPage
    }

    this.state = state

  }

  setActivePage(NewPageName) {
    const NewPage = Pages[NewPageName];
    const NewState = {...this.state, ActivePage : NewPage};
    this.setState(NewState);
  }

  render(){
    return (
      <div>
        <Navbar
          Names={Object.keys(Pages)}
          setActivePage={this.setActivePage}
          logout={this.props.logout}
          isAuthenticated={true}
        />
        <this.state.ActivePage

        />
      </div>
    )
  }
}