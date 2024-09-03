import React from "react";
import { Navbar, Container, Button, Col, Row  } from "react-bootstrap";
import { WebsocketIcon } from "~/components/injectable/icons";
import { Optional } from "~/components/injectable/optional";
import { useWebsocket } from "~/components/tracer_shop_context";
import { FLEX, JUSTIFY, NAVBAR_STYLES } from "~/lib/styles";



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
        style={NAVBAR_STYLES.navbarElement}
        variant={NavBarButtonType}
        onClick={() => setActivePage(identifier)}
        >{innerHTML}
      </Button>
    </Col>
    );
  }

  return (
  <Navbar style={{
    ...NAVBAR_STYLES.navbarMargin,
    backgroundColor : 'var(--secondary-color-3)'
  }}>
    <Container style={{margin : '0px', maxWidth : '100%'}}>
        <Row style={{...JUSTIFY.between}}>
            <Col>
              <img style={NAVBAR_STYLES.mainIcon} src="/static/images/logo.png"/>
            </Col>
            {elements}
            <Optional exists={isAuthenticated}>
              <Col style={{
                display : "flex",
                alignItems : "center"
              }} key="logout">
                  <Button
                    style={NAVBAR_STYLES.navbarElement}
                    onClick={logout}
                    variant={NavBarButtonType}>
                    Log ud
                    </Button>
              </Col>
            </Optional>

        </Row>
      <WebsocketIcon/>
    </Container>
  </Navbar>);
}
