import React, { useState } from 'react'
import { Card, Col, Collapse, Row } from 'react-bootstrap'
import { CancelBox } from '~/components/injectable/cancel_box';
import { EndpointDisplay } from '~/components/injectable/data_displays/endpoint';
import { MBqDisplay } from '~/components/injectable/data_displays/mbq_display';
import { CancelIcon, StatusIcon } from '~/components/injectable/icons';
import { OpenCloseButton } from '~/components/injectable/open_close_button';
import { Optional } from '~/components/injectable/optional';
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context';
import { IsotopeDelivery, IsotopeOrder } from '~/dataclasses/dataclasses'
import { ORDER_STATUS, StateType } from '~/lib/constants';
import { IsotopeOrderCollection } from '~/lib/data_structures/isotope_order_collection';
import { JUSTIFY, PADDING } from '~/lib/styles';
import { Comment } from '~/components/injectable/data_displays/comment';
import { TimeDisplay } from '~/components/injectable/data_displays/time_display';

type CardHeaderProps = {
  openState : StateType<boolean>,
  collection : IsotopeOrderCollection
}

function CardHeader({openState, collection} : CardHeaderProps){
  const [open, setOpen] = openState;

  return (
    <Card.Header>
      <Row style={JUSTIFY.left}>
        <Col xs={1}><StatusIcon orderCollection={collection}/></Col>
        <Col><EndpointDisplay endpoint={collection.endpoint}/></Col>
        <Col><TimeDisplay time={collection.delivery.delivery_time} /></Col>
        <Col><MBqDisplay activity={collection.ordered_activity}/> </Col>
        <Col xs={1} style={{
          justifyContent : 'right',
          display : 'flex',
        }}>
          <OpenCloseButton open={open} setOpen={setOpen}/>
        </Col>
      </Row>
    </Card.Header>
  )
}

type OrderRowProps = {
  order : IsotopeOrder
}

function OrderRow ({
  order
}: OrderRowProps) {
  const websocket = useWebsocket();
  const [isCanceling, setIsCanceling] = useState(false);

  function cancelOrder(){

  }



  return (
  <Row>
    <Col xs={1}><StatusIcon order={order}/></Col>
    <Col>Bestilt : <MBqDisplay activity={order.ordered_activity_MBq}/></Col>
    <Optional exists={order.comment}>
      <Col xs={1}><Comment comment={order.comment}/></Col>
    </Optional>
    <Optional exists={[ORDER_STATUS.ACCEPTED, ORDER_STATUS.ORDERED].includes(order.status)}>
      <Col xs={1}><CancelIcon onClick={cancelOrder}/></Col>
    </Optional>
  </Row>)
}

type ProductionIsotopeTimeSlotProps = {
  orders : IsotopeOrder[],
  timeSlot : IsotopeDelivery
}

export function ProductionIsotopeTimeSlot({
  timeSlot, orders
} : ProductionIsotopeTimeSlotProps) {
  const state = useTracershopState();
  const collection = new IsotopeOrderCollection(orders, timeSlot, state);


  const orderRows = [];

  const [open, setOpen] = useState(false);


  for(const order of orders){
    orderRows.push(
      <OrderRow key={order.id} order={order}/>
    )
  }

  return (
    <Card style={PADDING.all.px0}>
      <CardHeader openState={[open, setOpen]} collection={collection}/>
      <Collapse in={open}>
        <Card.Body>
          {orderRows}
        </Card.Body>
      </Collapse>
    </Card>
  );
}