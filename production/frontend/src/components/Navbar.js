import React, { Component } from "react";
import { Navbar as BSNavbar, Nav  } from "react-bootstrap";
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
    var  Elements = [];
    
    for(let i = 0; i < this.props.Names.length; i++) {
      Elements.push(this.renderElement(i));
    }

    return (
     <BSNavbar fixed="top">
       <img src="/static/images/logo.png" height="50px"></img>
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

