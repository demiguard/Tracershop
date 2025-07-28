import React from "react";
import { Container } from "react-bootstrap";
import { ERROR_CONTAINER_CSS } from "~/lib/styles";




export function InvalidVersionPage() {
  return(
    <Container style={ERROR_CONTAINER_CSS}>
      <h1>Der er en nyere version af Tracershop tilgængelig</h1>
      <p>For at undgå fejl bedes du logge ind igen. Så får du den nye version af tracershop</p>
    </Container>);
}