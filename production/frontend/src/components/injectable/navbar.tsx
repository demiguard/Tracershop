import React from "react";
import { Navbar, Container, Button, Col, Row  } from "react-bootstrap";
import { WebsocketIcon } from "~/components/injectable/icons";
import { Optional } from "~/components/injectable/optional";
import { useWebsocket } from "~/contexts/tracer_shop_context";
import { JUSTIFY, NAVBAR_STYLES } from "~/lib/styles";



const NavBarButtonType = "primary";

export function TracershopNavbar({
  logout,
  isAuthenticated,
  children
}){
  return (
  <Navbar style={{
    ...NAVBAR_STYLES.navbarMargin,
    backgroundColor : 'var(--secondary-color-3)',
    marginBottom : "12px"
  }}>
    <Container style={{margin : '0px', maxWidth : '100%'}}>
        <Row style={{...JUSTIFY.between}}>
            <Col>
              <img height={"63px"} src="/static/images/logo.png"/>
            </Col>
            {children}
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
