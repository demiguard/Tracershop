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
import { IsotopeOrderReference } from "~/dataclasses/references/isotope_order_reference";


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
        <Col xs={2} style={{
          alignItems: 'center',
          textAlign: 'center',
          display : "flex"
          }}>{isotopeOrderCollection.delivery.delivery_time}</Col>
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

interface OrderRowProps {
  order : IsotopeOrderReference,
  deadlineValid : Boolean,
}

/** Row that displays the order
 *
 * @param {Object} props
 * @param {IsotopeOrder} props.order - The order to be rendered
 * @param {Boolean} props.canEdit - If the user should be able to edit the order
 * @returns
 */
function OrderRow({order, deadlineValid}: OrderRowProps){
  const canEdit = deadlineValid && [ORDER_STATUS.AVAILABLE, ORDER_STATUS.ORDERED].includes(order.status);

  console.log("Hello world")

  function validate(){
    return true;
  }

  const [tempOrder, setTempOrder] =  useState(order);

  const orderDirty = isDirty(order, tempOrder);

  return <Row>
    <Col>
      hello world
    </Col>
    <Col>

    </Col>
    <Col xs={1}>
      {order.shopActionButton({
        validate : validate,
        is_dirty : orderDirty,
        canEdit : canEdit,
      })}
    </Col>
  </Row>
}


interface TimeSlotCardIsotopeArgs {
  timeSlot : IsotopeDelivery,
  orders : Array<IsotopeOrderReference>,
  deadlineValid : Boolean
}


export function TimeSlotCardIsotope({
  timeSlot,
  orders,
  deadlineValid,
}: TimeSlotCardIsotopeArgs){
  const state = useTracershopState();
  const [collapsed, setCollapsed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(deadlineValid);

  const isotopeOrderCollection = new IsotopeOrderCollection(orders, timeSlot, state);

  const renderedOrders = orders.map(
    (order) => {
      return <OrderRow key={order.order.id} order={order} deadlineValid={deadlineValid}/>
    });

  if(deadlineValid){
    renderedOrders.push(
      <OrderRow key={-1}
      order={
        new IsotopeOrderReference(
          new IsotopeOrder(-1, ORDER_STATUS.AVAILABLE)
        )
      }
      deadlineValid={deadlineValid}
      />
    )
  }

  console.log(deadlineValid)

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