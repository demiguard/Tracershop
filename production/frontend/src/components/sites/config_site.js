import React, {Component} from "react"
import { propsExtraction } from "../../lib/props_management.js"
import { ControlPanel } from "../admin_pages/control_panel.js"
import Navbar from "../injectable/navbar.js"
import { ImitationPage } from "../admin_pages/imitation.js"


export { ConfigSite }

const Pages = {
  Kontrolpanel : ControlPanel, // Danish for key since keys are displayed.
  Bruger_Imitation : ImitationPage
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

    const props = propsExtraction(this.props);

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
          {...props}
        />
      </div>
    )
  }
}