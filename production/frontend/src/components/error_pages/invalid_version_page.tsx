import React from "react";
import { Container, NavbarBrand, Row, Col, Button } from "react-bootstrap";
import { ERROR_CONTAINER_CSS } from "~/lib/styles";
import { TracershopNavbar } from "../injectable/navbar";
import { NavbarRedesigned } from "../injectable/navbar_redesigned";

export function InvalidVersionPage() {
  function refresh(){
    window.location.reload();
  }

  return(
    <div>
      <NavbarRedesigned>
        <NavbarBrand onClick={refresh}>
          <Button>
            Genindlæs
          </Button>
        </NavbarBrand>
      </NavbarRedesigned>


    <Container style={ERROR_CONTAINER_CSS}>
      <h1 style={{textAlign : "center"}}>
        Der er en nyere version af Tracershop tilgængelig.
      </h1>
      <p>
        Tracershop bliver opdateret løbende for at rette fejl og mangler. Du kan
        få den opdateret version ved at genindlæse siden:
      </p>
      <Row>
        <Col>
          <Button onClick={refresh}>Genindlæs</Button>
        </Col>
      </Row>
    </Container>
  </div>);
}