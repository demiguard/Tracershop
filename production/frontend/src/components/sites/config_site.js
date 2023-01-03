import React, {Component} from "react"
import { ControlPanel } from "../admin_pages/control_panel.js"
import Navbar from "../injectable/navbar.js"


export { ConfigSite }

const Pages = {
  Kontrolpanel : ControlPanel // Danish for key since keys are displayed.
}

class ConfigSite extends Component {
  constructor(props){
    super(props)

    this.state = {
      ActivePage : "Kontrolpanel"
    }
  }

  setActivePage(NewPageName) {
    const NewState = {...this.state, ActivePage : NewPageName};
    this.setState(NewState);
  }

  render(){
    const ActiveSite = Pages[this.state.ActivePage];

    return(
      <div>
        <Navbar
          ActiveKey={this.state.ActivePage}
          Names={Object.keys(Pages)}
          setActivePage={this.setActivePage.bind(this)}
          logout={this.props.logout}
          isAuthenticated={true}
          NavbarElements={this.props.NavbarElements}
        />
        <ActiveSite
          Address={this.props.address}
          customers={this.props.customers}
          closeddates={this.props.closeddates}
          Database={this.props.database}
          deliverTimes={this.props.deliverTimes}
          employee={this.props.employee}
          isotopes={this.props.isotopes}
          orders={this.props.orders}
          runs={this.props.runs}
          t_orders={this.props.t_orders}
          tracers={this.props.tracers}
          tracerMapping={this.props.tracerMapping}
          ServerConfig={this.props.serverConfig}
          vials={this.props.vials}
          websocket={this.props.websocket}
          user={this.props.user}
        />
      </div>
    )
  }
}