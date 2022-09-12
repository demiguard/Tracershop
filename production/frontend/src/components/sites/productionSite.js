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
import "/src/css/Navbar.css"


export { ProductionSite }



const Pages = {
  Ordre : OrderPage,
  Kunder : CustomerPage,
  Tracers : TracerPage,

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
          setActivePage={this.setActivePage.bind(this)}
          logout={this.props.logout}
          isAuthenticated={true}
          NavbarElements={this.props.NavbarElements}
        />
        <Container className="NavbarSpacer">
          <this.state.ActivePage
            address={this.props.address}
            customers={this.props.customers}
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