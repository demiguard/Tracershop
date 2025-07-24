import React, { useState } from "react";
import { Card, Col, Collapse, Row } from "react-bootstrap";
import { StatusIcon } from "~/components/injectable/icons";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { IsotopeDelivery, IsotopeOrder } from "~/dataclasses/dataclasses";
import { IsotopeOrderCollection } from "~/lib/data_structures/isotope_order_collection";
import { CENTER, JUSTIFY, PADDING } from "~/lib/styles";
import { ORDER_STATUS, StateType } from "~/lib/constants";
import { isDirty } from "~/lib/utils";


function OrderButton ({order, isDirty}){
  if(order.status === ORDER_STATUS.RELEASED){
    return <ReleaseButton order={order}/>
  }

  return
}

/**
 *
 * @param {Object} props
 * @param {IsotopeOrderCollection} props.isotopeOrderCollection
 * @param {StateType<Boolean>} props.collapsedState
 * @returns
 */
function CardHeader({isotopeOrderCollection, collapsedState}){
  const [collapsed, setCollapsed] = collapsedState

  return (
    <Card.Header>
      <Row style={JUSTIFY.between}>
        <Col xs={1} style={JUSTIFY.center}>
          <StatusIcon orderCollection={isotopeOrderCollection}/>
        </Col>
        <Col xs={2} style={{...CENTER, display : "flex"}}>{isotopeOrderCollection.delivery.delivery_time}</Col>

        <Col xs={1} style={{
          justifyContent : 'right',
          display : "flex"
        }}>
          <OpenCloseButton
            open={collapsed}
            setOpen={setCollapsed}
          />
        </Col>
      </Row>
    </Card.Header>
  )
}

/** Row that displays the order
 *
 * @param {Object} props
 * @param {IsotopeOrder} props.order - The order to be rendered
 * @param {Boolean} props.canEdit - If the user should be able to edit the order
 * @returns
 */
function OrderRow({order, deadlineValid}){
  const canEdit = deadlineValid && [ORDER_STATUS.AVAILABLE, ORDER_STATUS.ORDERED].includes(order.status);


  const [tempOrder, setTempOrder] =  useState(order);

  const orderDirty = isDirty(order, tempOrder);

  return <Row>
    <Col>

    </Col>
    <Col>

    </Col>
    <Col xs={1}>

    </Col>
  </Row>
}

/**
 *
 * @param {Object} props
 * @param {IsotopeDelivery} props.timeSlot - This is the time slot that the card
 * should render
 * @param {Array<IsotopeOrder>} orders - The orders that have been place here
 */
export function TimeSlotCardIsotope({
  timeSlot,
  orders,
  deadlineValid,
}){
  const state = useTracershopState();
  const [collapsed, setCollapsed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(deadlineValid);

  const isotopeOrderCollection = new IsotopeOrderCollection(orders, timeSlot, state);

  const renderedOrders = orders.map(
    (order) => {
      return <OrderRow key={order.id} order={order}/>
    });

  if(deadlineValid){
    renderedOrders.push(
      <OrderRow key={-1} order={new IsotopeOrder(-1, ORDER_STATUS.AVAILABLE)}/>
    )
  }

  return (
    <Card style={PADDING.all.px0}>

      <CardHeader
        isotopeOrderCollection={isotopeOrderCollection}
        collapsedState={[collapsed, setCollapsed]}
      />

      <Collapse in={collapsed}>
        <Card.Body>
          {renderedOrders}
        </Card.Body>
      </Collapse>
    </Card>

  );
}