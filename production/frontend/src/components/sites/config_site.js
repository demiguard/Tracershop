import React, {Component} from "react"
import { ControlPanel } from "../admin_pages/control_panel.js"
import Navbar, { TracershopNavbar } from "../injectable/navbar.js"
import { ImitationPage } from "../admin_pages/imitation.js"


export { ConfigSite }

const Pages = {
  controlPanel : ControlPanel, // Danish for key since keys are displayed.
  imitation : ImitationPage,
}

const PageNames = {
  controlPanel : "Kontrol Panel",
  imitation : "Bruger Imitation"
}

class ConfigSite extends Component {
  constructor(props){
    super(props)

    this.state = {
      ActivePage : "controlPanel"

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
        <TracershopNavbar
          ActiveKey={this.state.ActivePage}
          Names={PageNames}
          setActivePage={this.setActivePage.bind(this)}
          logout={this.props.logout}
          isAuthenticated={true}
          NavbarElements={this.props.NavbarElements}
        />
        <ActiveSite
          {...this.props}
        />
      </div>
    )
  }
}