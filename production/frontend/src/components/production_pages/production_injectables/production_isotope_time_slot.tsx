import React, { useState } from 'react'
import { Card, Col, Collapse, Row } from 'react-bootstrap'

import { EndpointDisplay } from '~/components/injectable/data_displays/endpoint';
import { MBqDisplay } from '~/components/injectable/data_displays/mbq_display';
import { AcceptIcon, CancelIcon, StatusIcon } from '~/components/injectable/icons';
import { OpenCloseButton } from '~/components/injectable/open_close_button';
import { Optional } from '~/components/injectable/optional';
import { useTracershopState } from '~/contexts/tracer_shop_context';
import { IsotopeDelivery, IsotopeOrder } from '~/dataclasses/dataclasses'
import { ORDER_STATUS, StateType } from '~/lib/constants';
import { IsotopeOrderCollection } from '~/lib/data_structures/isotope_order_collection';
import { JUSTIFY, PADDING } from '~/lib/styles';
import { Comment } from '~/components/injectable/data_displays/comment';
import { TimeDisplay } from '~/components/injectable/data_displays/time_display';
import { IsotopeOrderModal } from '~/components/modals/isotope_order_modal';
import { IsotopeOrderRow } from './isotope_order_row';

type CardHeaderProps = {
  openState : StateType<boolean>,
  collection : IsotopeOrderCollection,
  showModal : () => void,
}

function CardHeader({openState, collection, showModal} : CardHeaderProps){
  const [open, setOpen] = openState;

  return (
    <Card.Header>
      <Row style={JUSTIFY.left}>
        <Col xs={1}><StatusIcon orderCollection={collection} onClick={showModal}/></Col>
        <Col><EndpointDisplay endpoint={collection.endpoint}/></Col>
        <Col><TimeDisplay time={collection.delivery.delivery_time} /></Col>
        <Col>Bestilt: <MBqDisplay activity={collection.ordered_activity}/></Col>
        <Col>Udleveret: <MBqDisplay activity={collection.delivered_activity}/></Col>
        <Optional exists={collection.minimum_status === ORDER_STATUS.ORDERED}>
          <Col xs={1}>
            <AcceptIcon orders={collection.orders}/>
          </Col>
        </Optional>
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

type ProductionIsotopeTimeSlotProps = {
  orders : IsotopeOrder[],
  timeSlot : IsotopeDelivery
}

export function ProductionIsotopeTimeSlot({
  timeSlot, orders
} : ProductionIsotopeTimeSlotProps) {
  const state = useTracershopState();
  const collection = new IsotopeOrderCollection(orders, timeSlot, state);
  const [showingModal, setShowingModal] = useState(false);

  const showModal = () => { setShowingModal(true);};
  const hideModal = () => { setShowingModal(false);};


  const orderRows = [];
  const [open, setOpen] = useState(false);

  for(const order of orders){
    orderRows.push(
      <IsotopeOrderRow key={order.id} order={order}/>
    )
  }

  return (
    <Card style={PADDING.all.px0}>
      <CardHeader openState={[open, setOpen]} collection={collection} showModal={showModal}/>
      <Collapse in={open}>
        <Card.Body>
          {orderRows}
        </Card.Body>
      </Collapse>
      <Optional exists={showingModal}>
        <IsotopeOrderModal
          collection={collection}
          onClose={hideModal}/>
      </Optional>
    </Card>
  );
}