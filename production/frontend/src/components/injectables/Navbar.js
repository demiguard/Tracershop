import React, { Component } from "react";
import { Navbar as BSNavbar, Nav, Container, Button  } from "react-bootstrap";
import "/src/css/Navbar.css"

export {Navbar}

const NavBarButtonType = "outline-primary";

export default class Navbar extends Component {
  constructor(props){
    super(props)
  }

  render() {
    const Elements = (this.props.NavbarElements) ? this.props.NavbarElements : [];
    for(const name of this.props.Names) {

      Elements.push(<Button
        className="navBarSpacer"

        variant={NavBarButtonType}
        key={name}
        onClick={() => this.props.setActivePage(name)}
      >{name === this.props.ActiveKey ? <div>{name}</div> : <div>{name}</div>}</Button>);
    }
    if(this.props.isAuthenticated){
      Elements.push((<Button
        className="navBarSpacer"
        key="logout"
        onClick={this.props.logout}
        variant={NavBarButtonType}>Log ud</Button>));
    }

    return (
     <BSNavbar className="navbarmargin">
        <Button
          className="navBarSpacer w-200px"
          variant={NavBarButtonType}
        ><img src="/static/images/logo.png" height="50px"/></Button>
        {Elements}
     </BSNavbar>
   );
 }
}


