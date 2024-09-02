import React from "react";
import { Navbar, Container, Button, Col, Row  } from "react-bootstrap";
import { WebsocketIcon } from "~/components/injectable/icons";
import { useWebsocket } from "~/components/tracer_shop_context";

const styles = {
  navbarElement : {
    color : 'white' ,
    width : '150px',
    padding : '10px',
    marginRight: '15px',
    marginLeft: '15px',
    border : '1px',
    borderStyle: 'solid',
    borderRadius: '10px',
    fontFamily: "mariheavy, Helvetica Neue, Helvetica, Arial, sans-serif",
  },
  navbarMargin : {
    marginBottom: '20px',
  },
  mainIcon : {

  }
}

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
    elements.push(
    <Col
    style={{
      display : "flex",
      alignItems : "center"
    }}

    key={identifier}>
      <Button
        aria-label={`navbar-${identifier}`}
        className={styles.navbarElement}
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
        className={styles.navbarElement}
        onClick={logout}
        variant={NavBarButtonType}>
          Log ud
      </Button>
    </Col>);
  }

  return (
  <Navbar style={styles.navbarMargin}>
    <Container style={{margin : '0px', maxWidth : '100%'}}>
      <Row>
        <Col>
          <img style={styles.mainIcon} src="/static/images/logo.png" height="50px"/>
        </Col>
        {elements}
      </Row>
      <WebsocketIcon/>
    </Container>
  </Navbar>);
}
