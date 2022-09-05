import React, {Component} from "react"
import { Container } from "react-bootstrap"
import Navbar from "../injectables/Navbar"


export { ControlPanel }

class ControlPanel extends Component {
  constructor(props){
    super(props)
  }

  render(){
    return(
      <div>
        <Navbar
          Names={[]}
          logout={this.props.logout}
          isAuthenticated={true}
          NavbarElements={this.props.NavbarElements}
        />
        <Container>
          This is a control panel
        </Container>
      </div>
    )
  }
}