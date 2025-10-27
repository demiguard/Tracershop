import React, { act, useEffect, useState } from "react";
import { Card, Col, Collapse, Form, FormText, Row } from "react-bootstrap";
import { StatusIcon } from "~/components/injectable/icons";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { IsotopeDelivery, IsotopeOrder } from "~/dataclasses/dataclasses";
import { IsotopeOrderCollection } from "~/lib/data_structures/isotope_order_collection";
import { CENTER, ExpandAndCenter, JUSTIFY, PADDING } from "~/lib/styles";
import { ORDER_STATUS, StateType } from "~/lib/constants";
import { isDirty } from "~/lib/utils";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { setTempClassToEvent, setTempObjectToEvent } from "~/lib/state_management";
import { parseStringInput, parseWholePositiveNumber } from "~/lib/user_input";
import { RecoverableError, useErrorState } from "~/lib/error_handling";

import { makeBlankIsotopeOrder } from "~/lib/blanks";
import { useUpdatingEffect } from "~/effects/updating_effect";
import { ShopActionButton } from "~/components/injectable/buttons/shop_action_button";
import { TimeDisplay } from "~/components/injectable/data_displays/time_display";
import { SUCCESS_STATUS_CRUD } from "~/lib/shared_constants";

type  CardHeaderDescriptionArgs = {
  isotopeOrderCollection: IsotopeOrderCollection
}

function CardHeaderDescription({isotopeOrderCollection} : CardHeaderDescriptionArgs){
  switch (isotopeOrderCollection.minimum_status){
    case ORDER_STATUS.EMPTY:
      return (
        <Col>
          <Row style={ExpandAndCenter}>
            <Col style={ExpandAndCenter} xs={2}>
              <TimeDisplay time={isotopeOrderCollection.delivery.delivery_time}/>
            </Col>
            <Col xs={8} style={ExpandAndCenter}>Der er ikke bestilt isotope til denne levering</Col>
          </Row>
        </Col>
      );
    case ORDER_STATUS.ORDERED:
      return (
        <Col>
          <Row style={ExpandAndCenter}>
            <Col style={ExpandAndCenter} xs={2}>
              <TimeDisplay
                time={isotopeOrderCollection.delivery.delivery_time}
              />
            </Col>
            <Col
              xs={8}
              style={ExpandAndCenter}>
                Der er bestilt: {isotopeOrderCollection.ordered_activity} MBq
            </Col>
          </Row>
        </Col>
      )
    default:
      console.log(isotopeOrderCollection.minimum_status);

      return (
      <Col>
        <Col style={ExpandAndCenter} xs={2}>
          <TimeDisplay
            time={isotopeOrderCollection.delivery.delivery_time}
          />
        </Col>
      </Col>)
  }
}


function CardHeader({isotopeOrderCollection, collapsedState}){
  const [collapsed, setCollapsed] = collapsedState

  return (
    <Card.Header>
      <Row style={JUSTIFY.between}>
        <Col xs={1} style={JUSTIFY.center}>
          <StatusIcon collection={isotopeOrderCollection}/>
        </Col>
        <CardHeaderDescription isotopeOrderCollection={isotopeOrderCollection}/>
        <Col xs={1} style={{
          ...JUSTIFY.left
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
  order : IsotopeOrder,
  deadlineValid : Boolean,
}

function OrderRow({order, deadlineValid}: OrderRowProps){
  const state = useTracershopState();
  const canEdit = deadlineValid && [ORDER_STATUS.AVAILABLE, ORDER_STATUS.ORDERED].includes(order.status);
  const [tempOrder, setTempOrder] =  useState(order);
  const [errorActivity, setErrorActivity] = useErrorState();
  const [errorComment, setErrorComment] = useErrorState();

  useUpdatingEffect(() => {
    setTempOrder((old) => {
      const newTempOrder = old.copy();

      newTempOrder.destination = order.destination;
      newTempOrder.delivery_date = order.delivery_date;

      return newTempOrder;
    })
  }, [order])

  function validate() : [boolean, any] {
    const [validActivity, activity] = parseWholePositiveNumber(tempOrder.ordered_activity_MBq, "Aktiviten");
    const [validComment, comment] = parseStringInput(tempOrder.comment, "Kommentaren", 500);

    if(!validActivity){
      setErrorActivity(activity);
    }

    if(!validComment){
      setErrorComment(comment);
    }

    if (!validActivity || !validComment) {
      return [false, {}];
    }

    return [true, {...tempOrder, status : ORDER_STATUS.ORDERED,  ordered_activity_MBq : activity,  comment : comment}];
  }

  function callback(data: any){
    if(data.status === SUCCESS_STATUS_CRUD.SUCCESS){
      setTempOrder((old) => {
        const copy = old.copy();
        copy.ordered_activity_MBq = "";
        copy.comment = "";

        return copy;
      });
    } else {
      console.log(data);
    }
  }

  const orderDirty = isDirty(order, tempOrder);

  return <Row>
    <Col xs={1} style={JUSTIFY.center}>
      <StatusIcon order={order}/>
    </Col>
    <Col>
      <TracershopInputGroup tail={"MBq"}>
        <Form.Control
          onChange={setTempClassToEvent<IsotopeOrder>({
            stateFunction : setTempOrder,
            keyword : "ordered_activity_MBq",
            errorFunction : setErrorActivity
          })}
          value={tempOrder.ordered_activity_MBq}
        />
      </TracershopInputGroup>
    </Col>
    <Col>
      <TracershopInputGroup tail={"Kommentar"}>
        <Form.Control
          as="textarea"
          rows={1}
          value={tempOrder.comment}
          onChange={setTempClassToEvent<IsotopeOrder>({
            stateFunction : setTempOrder,
            keyword : "comment",
            errorFunction : setErrorActivity
          })}
        />
      </TracershopInputGroup>
    </Col>
    <Col style={
      JUSTIFY.center
    } xs={1}>
      <ShopActionButton
        order={order}
        validate={validate}
        callback={callback}
        isDirty={orderDirty}
        canEdit={canEdit}
      />
    </Col>
  </Row>
}


interface TimeSlotCardIsotopeArgs {
  timeSlot : IsotopeDelivery,
  orders : Array<IsotopeOrder>,
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
      return <OrderRow key={order.id} order={order} deadlineValid={deadlineValid}/>
    });

  const blankOrder = makeBlankIsotopeOrder(timeSlot, state);

  console.log(blankOrder, deadlineValid, state.today);

  if(deadlineValid){
    renderedOrders.push(
      <OrderRow key={-1}
        order={ blankOrder }
        deadlineValid={deadlineValid}
      />
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