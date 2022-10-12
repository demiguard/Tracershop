import React, {Component } from "react";
import { Container } from "react-bootstrap";
import Navbar from "../injectables/Navbar";
import { CloseDaysPage } from "../ProductionPages/CloseDaysPage";
import CustomerPage from "../ProductionPages/CustomerPage";
import EmailSetupPage from "../ProductionPages/EmailSetupPage";
import { OrderPage } from "../ProductionPages/OrderPage";
import { ServerConfigPage } from "../ProductionPages/ServerConfig";
import TracerPage from "../ProductionPages/TracerPage";
import { VialPage } from "../ProductionPages/VialPage";
import styles from "/src/css/Navbar.module.css"


export { ProductionSite }



const Pages = {
  Ordre : OrderPage,
  Kunder : CustomerPage,
  Tracers : TracerPage,
  Lukkedage : CloseDaysPage,
  Hætteglas : VialPage,
};



class ProductionSite extends Component{
  constructor(props){
    super(props);
    var firstKey;
    for(const key of Object.keys(Pages)){
      firstKey = key;
      break;
    }


    const state = {
      ActivePage : firstKey
    }

    this.state = state;

  }

  setActivePage(NewPageName) {
    const NewState = {...this.state, ActivePage : NewPageName};
    this.setState(NewState);
  }

  render(){
    const UserPage = Pages[this.state.ActivePage];
    return (
      <div>
        <Navbar
          ActiveKey={this.state.ActivePage}
          Names={Object.keys(Pages)}
          setActivePage={this.setActivePage.bind(this)}
          logout={this.props.logout}
          isAuthenticated={true}
          NavbarElements={this.props.NavbarElements}
        />
        <Container>
          <UserPage
            address={this.props.address}
            customers={this.props.customers}
            closeddates={this.props.closeddates}
            database={this.props.database}
            deliverTimes={this.props.deliverTimes}
            employee={this.props.employee}
            isotopes={this.props.isotopes}
            orders={this.props.orders}
            runs={this.props.runs}
            t_orders={this.props.t_orders}
            tracers={this.props.tracers}
            tracerMapping={this.props.tracerMapping}
            serverConfig={this.props.serverConfig}
            vials={this.props.vials}
            websocket={this.props.websocket}
            user={this.props.user}
            />
          </Container>
      </div>
    )
  }
}