import React, { Component } from "react";
import { Navbar, Nav, Container, Button  } from "react-bootstrap";
import { WebsocketIcon } from "~/components/injectable/icons";
import styles from "~/css/Navbar.module.css"

const NavBarButtonType = "primary";

function getName(key, names, identifier){
  if(key === identifier){
    return <u>{names[identifier]}</u>
  } else {
    return <div>{names[identifier]}</div>
  }
}

export function TracershopNavbar({
  ActiveKey,
  logout,
  isAuthenticated,
  Names,
  NavbarElements,
  setActivePage,
}){
  const elements = NavbarElements ? [...NavbarElements] : [];
  for(const identifier of Object.keys(Names)) {
    const innerHTML = getName(ActiveKey, Names, identifier);
    elements.push(<Button
      aria-label={`navbar-${identifier}`}
      className={styles.NavbarElement}
      variant={NavBarButtonType}
      key={identifier}
      onClick={() => setActivePage(identifier)}
    >{innerHTML}</Button>);
  }

  if (isAuthenticated){
    elements.push(
    <Button
      className={styles.NavbarElement}
      key="logout"
      onClick={logout}
      variant={NavBarButtonType}>
        Log ud
    </Button>);
  }

  return (<Navbar className={styles.navbarMargin}>
    <img className={styles.MainIcon} src="/static/images/logo.png" height="50px"/>
    {elements}
    <WebsocketIcon/>
  </Navbar>);
}
