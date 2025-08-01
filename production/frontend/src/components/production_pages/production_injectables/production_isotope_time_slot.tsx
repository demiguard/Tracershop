import React, { useState } from 'react'
import { Card, Col, Collapse, Row } from 'react-bootstrap'
import { OpenCloseButton } from '~/components/injectable/open_close_button';
import { IsotopeDelivery, IsotopeOrder } from '~/dataclasses/dataclasses'
import { JUSTIFY, PADDING } from '~/lib/styles';

function CardHeader({openState}){
  const [open, setOpen] = openState;


  return (
    <Card.Header>
      <Row style={JUSTIFY.left}>
        <Col></Col>
        <Col xs={1}>
          <OpenCloseButton open={open} setOpen={setOpen}/>
        </Col>
      </Row>
    </Card.Header>
  )
}

function OrderRow () {
  return (
  <Row>

  </Row>)
}

type ProductionIsotopeTimeSlotProps = {
  orders : IsotopeOrder[],
  timeSlot : IsotopeDelivery
}

export function ProductionIsotopeTimeSlot({
  timeSlot, orders
}) {
  const orderRows = [];

  const [open, setOpen] = useState(false);


  for(const order of orders){
    orderRows.push(
      <OrderRow key={order.id}/>
    )
  }

  return (
    <Card style={PADDING.all.px0}>
      <CardHeader openState={[open, setOpen]}/>
      <Collapse in={open}>
        <Card.Body>
          {orderRows}
        </Card.Body>
      </Collapse>
    </Card>
  );
}