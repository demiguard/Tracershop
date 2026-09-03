import React from 'react'
import { Container } from 'react-bootstrap'


export function NoDeliveryEndpoint(){
  return <Container>
    <strong>
      Der er ikke noget leverings sted til denne kunde, derfor kan du ikke
      bestille sporestof til denne kunde.
    </strong>
  </Container>
}