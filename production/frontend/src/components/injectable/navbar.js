import React, { Component } from "react";
import { Navbar, Nav, Container, Button, Col, Row  } from "react-bootstrap";
import { WebsocketIcon } from "~/components/injectable/icons";
import { Optional } from "~/components/injectable/optional";
import { useWebsocket } from "~/components/tracer_shop_context";
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
  const websocket = useWebsocket();
  const elements = NavbarElements ? [...NavbarElements] : [];
  for(const identifier of Object.keys(Names)) {
    const innerHTML = getName(ActiveKey, Names, identifier);
    elements.push(
    <Col
    style={{
      display : "flex",
      alignItems : "center"
    }}

    key={identifier}>
      <Button
        aria-label={`navbar-${identifier}`}
        className={styles.NavbarElement}
        variant={NavBarButtonType}
        onClick={() => setActivePage(identifier)}
        >{innerHTML}
      </Button>
    </Col>
    );
  }

  if (isAuthenticated){
    elements.push(
      <Col style={{
        display : "flex",
        alignItems : "center"
      }} key="logout">
      <Button
        className={styles.NavbarElement}
        onClick={logout}
        variant={NavBarButtonType}>
          Log ud
      </Button>
    </Col>);
  }

  return (
  <Navbar className={styles.navbarMargin}>
    <Container style={{margin : '0px', maxWidth : '100%'}}>
      <Row>
        <Col>
          <img className={styles.MainIcon} src="/static/images/logo.png" height="50px"/>
        </Col>
        {elements}
      </Row>
      <WebsocketIcon/>
    </Container>
  </Navbar>);
}
