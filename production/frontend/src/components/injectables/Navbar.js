import React, { Component } from "react";
import { Navbar as BSNavbar, Nav, Container  } from "react-bootstrap";
import "/src/css/Navbar.css"

export {Navbar}

export default class Navbar extends Component {
  renderElement(i) {
    return (
      <NavbarElement
        key={this.props.Names[i]}
        content={this.props.Names[i]}
        onClick={() => this.props.setActivePage(this.props.Names[i])}
      />
    );
  }


  render() {

    const Elements = (this.props.NavbarElements) ? this.props.NavbarElements : [];
    for(let i = 0; i < this.props.Names.length; i++) {
      Elements.push(this.renderElement(i));
    }
    if(this.props.isAuthenticated){
      Elements.push((<NavbarElement key="logout" content={"Log ud"} onClick={this.props.logout} ></NavbarElement>));
    }

    return (
     <BSNavbar className="navbarmargin">
        <NavbarElement
          content={<img src="/static/images/logo.png" height="50px"/>}
        />
        {Elements}
     </BSNavbar>
   );
 }
}


function NavbarElement(props) {
  return (
    <Nav.Link className="navbarElem" onClick={props.onClick}>{ props.content }</Nav.Link>
  );
}

