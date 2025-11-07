import React, { act, useEffect, useState } from "react";
import { Card, Col, Collapse, Form, FormText, Row } from "react-bootstrap";
import { ClickableIcon, DeliveryIcon, StatusIcon } from "~/components/injectable/icons";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { IsotopeDelivery, IsotopeOrder, IsotopeVial } from "~/dataclasses/dataclasses";
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
import { FlexMinimizer } from "~/components/injectable/flexMinimizer";
import { MBqDisplay } from "~/components/injectable/data_displays/mbq_display";
import { Image } from "~/components/injectable/image";
import { DatetimeDisplay } from "~/components/injectable/data_displays/datetime_display";

type CardHeaderDescriptionArgs = {
  collection: IsotopeOrderCollection
}

function CardHeaderDescription({ collection } : CardHeaderDescriptionArgs){
  switch (collection.minimum_status){
    case ORDER_STATUS.UNAVAILABLE:
    case ORDER_STATUS.AVAILABLE:
      return (
        <Col>
          <Row style={ExpandAndCenter}>
            <Col style={ExpandAndCenter} xs={2}>
              <TimeDisplay time={collection.delivery.delivery_time}/>
            </Col>
            <Col xs={8} style={ExpandAndCenter}>Der er ikke bestilt isotope til denne levering</Col>
          </Row>
        </Col>
      );

    case ORDER_STATUS.ORDERED:
    case ORDER_STATUS.ACCEPTED:
      return (
        <Col>
          <Row style={ExpandAndCenter}>
            <Col style={ExpandAndCenter} xs={3}>
              <TimeDisplay
                time={collection.delivery.delivery_time}
              />
            </Col>
            <Col
              xs={8}
              style={ExpandAndCenter}>
                Der er bestilt: {collection.ordered_activity} MBq
            </Col>
          </Row>
        </Col>
      );
    case ORDER_STATUS.RELEASED:
      return (
        <Col>
          <Row>
            <FlexMinimizer style={{ display : "flex", alignItems : "center" }}>
              <TimeDisplay time={collection.delivery.delivery_time}/>
            </FlexMinimizer>
            <Col xs={4} style={{ display : "flex", alignItems : "center" }}>
              Der er bestilt: <MBqDisplay activity={collection.ordered_activity}/>
            </Col>
            <Col style={{ display : "flex", alignItems : "center" }}>
              Der er leveret <MBqDisplay activity={collection.delivered_activity}/> kalibret til kl: <TimeDisplay time={collection.delivery.delivery_time}/>
            </Col>
            <Col xs={1}>
              <DeliveryIcon collection={collection}/>
            </Col>
          </Row>
        </Col>
      )
    default:
      return (
      <Col>
        <Col xs={2}>
          <FlexMinimizer>
            <TimeDisplay
              time={collection.delivery.delivery_time}
            />
          </FlexMinimizer>
        </Col>
      </Col>)
  }
}


function CardHeader({collection, collapsedState}){
  const [collapsed, setCollapsed] = collapsedState

  return (
    <Card.Header>
      <Row style={JUSTIFY.between}>
        <Col xs={1} style={JUSTIFY.center}>
          <StatusIcon collection={collection}/>
        </Col>
        <CardHeaderDescription collection={collection}/>
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

  const orderDirty = isDirty(tempOrder, order);

  return <Row>
    <Col xs={1} style={JUSTIFY.center}>
      <StatusIcon order={order}/>
    </Col>
    <Col>
      <TracershopInputGroup readonly={!canEdit} tail={"MBq"} error={errorActivity}>
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
      <TracershopInputGroup readonly={!canEdit} tail={"Kommentar"} error={errorComment}>
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

type DisplayRowIsotopeVialShopProps = {
  vial : IsotopeVial
}

function DisplayRowIsotopeVialShop({vial} : DisplayRowIsotopeVialShopProps){
  return (
    <Row>
      <Col style={{flexGrow : 0}}>
        <Image
          src="/static/images/vial.svg"
          style={{
            paddingLeft : "12px",
            paddingRight : "12px",
            border : "1px",
            width : '24px',
            height : '24px'
          }}
          width="24"
          height="24"
        />
      </Col>
      <Col>
        Aktivitet: <MBqDisplay activity={vial.vial_activity} /> kalibret til <DatetimeDisplay datetime={vial.calibration_datetime} />
      </Col>
    </Row>
  );
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

  const collection = new IsotopeOrderCollection(orders, timeSlot, state);

  const renderedOrders = orders.map(
    (order) => {
      return <OrderRow key={order.id} order={order} deadlineValid={deadlineValid}/>
    });

  const blankOrder = makeBlankIsotopeOrder(timeSlot, state);

  if(deadlineValid){
    renderedOrders.push(
      <OrderRow key={-1}
        order={ blankOrder }
        deadlineValid={deadlineValid}
      />
    )
  }

  const vialRows = [];
  for(const vial of collection.getVials()){
    vialRows.push(<DisplayRowIsotopeVialShop
      key={vial.id}
      vial={vial}
    />);
  }


  return (
    <Card style={PADDING.all.px0}>
      <CardHeader
        collection={collection}
        collapsedState={[collapsed, setCollapsed]}
      />
      <Collapse in={collapsed}>
        <Card.Body>
          {renderedOrders}
          {vialRows}
        </Card.Body>
      </Collapse>
    </Card>
  );
}