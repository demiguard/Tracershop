import React, { Component } from "react";
import { Navbar, Nav, Container, Button  } from "react-bootstrap";
import styles from "~/css/Navbar.module.css"


const NavBarButtonType = "outline-primary";


export function TracershopNavbar({
  ActiveKey,
  logout,
  isAuthenticated,
  Names,
  NavbarElements,
  setActivePage,
}){

  const Elements = (NavbarElements) ? NavbarElements : [];
  for(const identifier of Object.keys(Names)) {
      Elements.push(<Button
        aria-label={`navbar-${identifier}`}
        className={styles.NavbarElement}
        variant={NavBarButtonType}
        key={identifier}
        onClick={() => setActivePage(identifier)}
      >{identifier === ActiveKey ? <div><u>{Names[identifier]}</u></div> : <div>{Names[identifier]}</div>}</Button>);
    }


  if (isAuthenticated){
    Elements.push((<Button
      className={styles.NavbarElement}
      key="logout"
      onClick={logout}
      variant={NavBarButtonType}>Log ud</Button>));
  }

  return (<Navbar className={styles.navbarMargin}>
    <img className={styles.MainIcon} src="/static/images/logo.png" height="50px"/>
    {Elements}
  </Navbar>)
}


