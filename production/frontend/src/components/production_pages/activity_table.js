
import React, { Component, useState } from "react";
import { Row, Col, Table, Tab, Button, Container, Card, Collapse } from 'react-bootstrap'
import { renderStatusImage, renderTableRow } from "../../lib/rendering.js";
import { compareDates, getId } from "../../lib/utils.js";
import { FormatDateStr, dateToDateString, parseDateToDanishDate } from "../../lib/formatting.js";
import { CountMinutes, CalculateProduction } from "../../lib/physics.js";
import { ActivityModal } from "../modals/activity_modal.js";
import { CreateOrderModal } from "../modals/create_activity_modal.js";

import { LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, JSON_CUSTOMER, JSON_VIAL,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, cssCenter,
  JSON_TRACER, WEBSOCKET_MESSAGE_MOVE_ORDERS, JSON_GHOST_ORDER, JSON_RUN, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,
  JSON_ACTIVITY_ORDER, JSON_DELIVER_TIME, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_ID, LEGACY_KEYWORD_CHARGE, LEGACY_KEYWORD_FILLTIME,
  LEGACY_KEYWORD_FILLDATE, LEGACY_KEYWORD_CUSTOMER, LEGACY_KEYWORD_ACTIVITY, LEGACY_KEYWORD_VOLUME,
  WEBSOCKET_MESSAGE_EDIT_STATE, LEGACY_KEYWORD_TRACER, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_WEBSOCKET, JSON_ISOTOPE, PROP_MODAL_ORDER, PROP_ORDER_MAPPING, PROP_ON_CLOSE, JSON_PRODUCTION, JSON_ENDPOINT, JSON_ORDERS, PROP_ON_CLICK, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING, PROP_ACTIVE_PRODUCTION, PROP_ASSOCIATED_TIME_SLOTS, PROP_ASSOCIATED_ORDERS, JSON_TRACER_MAPPING, PROP_OVERHEAD_MAP, WEBSOCKET_MESSAGE_RESTORE_ORDERS} from "../../lib/constants.js";

import SiteStyles from "/src/css/Site.module.css"
import { KEYWORD_ActivityDeliveryTimeSlot_DELIVERY_TIME,  KEYWORD_ActivityOrder_ORDERED_ACTIVITY, KEYWORD_DeliveryEndpoint_OWNER } from "../../dataclasses/keywords.js";
import { ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { renderComment } from "../../lib/rendering.js";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Customer, DeliveryEndpoint, Isotope, Tracer, TracerCatalog, Vial } from "../../dataclasses/dataclasses.js";
import { compareTimeStamp, getDay } from "../../lib/chronomancy.js";
import { ArrayMap } from "../../lib/array_map.js";
import { createOrderMapping, createTimeSlotMapping } from "../../lib/data_structures.js";
import { sortOrderMapping } from "../../lib/sorting.js";

const Modals = {
  createModal : CreateOrderModal,
  activityModal : ActivityModal,
}

/**
 * Row inside of a RenderedTimeSlot
 * @param {{
 * order : ActivityOrder
 * }} param0
 * @returns {JSX }
 */
function OrderRow({order, timeSlotID}){
  let statusIcon = <StatusIcon status={order.status}/>

  if (order.moved_to_time_slot != null){
    statusIcon = <ClickableIcon src="/static/images/move_top.svg"/>
  }

  return (<Row>
    <Col>{statusIcon}</Col>
    <Col>Order ID: {order.id}</Col>
    <Col>{order.ordered_activity} MBq</Col>
    <Col>{order.comment ? renderComment(order.comment) : ""}</Col>
  </Row>)
}

/**
 * This is similiar to the shop side TimeSlotCard, however the functionality is quite different
 * Creates a number of OrderRow inside of the card.
 * @param {*} props
 * @returns
 */
function RenderedTimeSlot(props){
  // Prop extraction
  const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = props[JSON_DELIVER_TIME].get(props.timeSlotID);
  const /**@type {DeliveryEndpoint} */ endpoint = props[JSON_ENDPOINT].get(timeSlot.destination);
  const /**@type {Customer} */ owner = props[JSON_CUSTOMER].get(endpoint.owner);
  const /**@type {Map<Number, Number>} */ overheadMap = props[PROP_OVERHEAD_MAP];
  const /**@type {Tracer} */ tracer = props[JSON_TRACER].get(props[PROP_ACTIVE_TRACER])
  const /**@type {Isotope} */ isotope = props[JSON_ISOTOPE].get(tracer.isotope)
  const /**@type {Map<Number, Vials>} */ vials = props[JSON_VIAL];
  const overhead = overheadMap.get(owner.id)

  const orderIds = props[JSON_ACTIVITY_ORDER].map(getId)
  const firstAvailableTimeSlot = props[PROP_ASSOCIATED_TIME_SLOTS][0]
  const firstAvailableTimeSlotID = firstAvailableTimeSlot.id

  let orderedMBq = 0;
  let deliveredMBq = 0;
  let freedMbq = 0;
  let minimumStatus = 3;
  const OrderData = [];
  let moved = true;

  for(const _order of props[JSON_ACTIVITY_ORDER]){
    const /**@type {ActivityOrder} */ order = _order
    const originalTimeSlot = order.ordered_time_slot === props.timeSlotID && order.moved_to_time_slot === null
    || order.moved_to_time_slot === props.timeSlotID
    if (originalTimeSlot){
      moved = false;
    }
    if(order.ordered_time_slot === props.timeSlotID){
      orderedMBq += order.ordered_activity;
      if (order.moved_to_time_slot === null) {
        deliveredMBq += order.ordered_activity * overhead
      }
    }
    if(order.moved_to_time_slot === props.timeSlotID){
      const /**@type {ActivityDeliveryTimeSlot} */ originalTimeSlot =  props[JSON_DELIVER_TIME].get(order.ordered_time_slot);
      const timeDelta = compareTimeStamp(originalTimeSlot.delivery_time, timeSlot.delivery_time);
      deliveredMBq += CalculateProduction(isotope.halflife_seconds, timeDelta.hour * 60 + timeDelta.minute, order.ordered_activity)  * overhead
    }

    minimumStatus = Math.min(minimumStatus, order.status);

    if(minimumStatus === 3){
      for(const [_vialID, _vial] of props[JSON_VIAL]){
        const /**@type {Vial} */ vial = _vial
        if (vial.assigned_to === order.id){
          freedMbq += vial.activity
        }
      }
    }
    if((originalTimeSlot)){
      OrderData.push(<OrderRow
        key={order.id}
        order={order}
        timeSlotID={props.timeSlotID}
        />);
      }
    }
  const canMove = firstAvailableTimeSlotID !== props.timeSlotID && minimumStatus < 3;


  // State
  const [open, setOpen] = useState(false);

  // Functions
  function moveOrders(){
    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MOVE_ORDERS);

    message[JSON_DELIVER_TIME] = firstAvailableTimeSlotID;
    message[JSON_ACTIVITY_ORDER] = orderIds
    props[PROP_WEBSOCKET].send(message);
  }

  function restoreOrders(){
    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_RESTORE_ORDERS);
    message[JSON_ACTIVITY_ORDER] = orderIds
    props[PROP_WEBSOCKET].send(message);
  }

  // Sub-components
  const openClassName = open ? SiteStyles.rotated : "";
  let headerIcon = <StatusIcon
                      label={`time-slot-icon-${props.timeSlotID}`}
                      status={minimumStatus}
                      onClick={() => props[PROP_ON_CLICK](props['timeSlotID'])}
                    />
  if(moved){
    headerIcon = <ClickableIcon
                    src="/static/images/move_top.svg"
                    label={`time-slot-icon-${props.timeSlotID}`}
                    onClick={canMove ? restoreOrders : () => {}}
                  />;
  }

  // Yes I know turnery are thing. But I think this is more readable
  // Fucking fight me
  let thirdColumnInterior;
  if (minimumStatus === 3){
    thirdColumnInterior = `Udleveret: ${Math.floor(freedMbq)} MBq`
  } else {
    thirdColumnInterior = `Bestilt: ${Math.floor(orderedMBq)} MBq`
  }

  let fourthColumnInterior;
  if (minimumStatus === 3){
    fourthColumnInterior = `Frigivet kl: ${"11:11:11"}`;
  } else {
    fourthColumnInterior = `Til Udlevering: ${Math.floor(deliveredMBq)} MBq`
  }

  let fifthColumnInterior = null;
  if (canMove && !moved){
    fifthColumnInterior = <ClickableIcon
                                  src="/static/images/move_top.svg"
                                  onClick={moveOrders}
                    />
  } else if (!moved && minimumStatus === 3) {
    fifthColumnInterior = <ClickableIcon
                    src="/static/images/delivery.svg"
                    onClick={()=>{}}
                  />
  }

  return (
    <Card key={props.timeSlotID}>
      <Card.Header>
        <Row>
          <Col xs={1} style={cssCenter}>
            {headerIcon}
          </Col>
          <Col style={cssCenter}>{owner.short_name} - {endpoint.name}</Col>
          <Col style={cssCenter}>{timeSlot.delivery_time}</Col>
          <Col style={cssCenter}>{thirdColumnInterior}</Col>
          <Col style={cssCenter}>{fourthColumnInterior}</Col>
          <Col style={cssCenter}>{fifthColumnInterior}</Col>
          <Col xs={1} style={{
            justifyContent : 'right',
            display : 'flex'
          }}>
            <ClickableIcon
            className={openClassName}
            src={"/static/images/next.svg"}
            onClick={() => {setOpen(!open)}}
            />
          </Col>
        </Row>
      </Card.Header>
      <Collapse in={open}>
        <Card.Body>
          {OrderData}
        </Card.Body>
      </Collapse>
    </Card>);
}

/**
 * Row over the actual table,with the goal of informing the user of how much
 * tracer needs to be produced
 * @param {*} props 
 * @returns 
 */
function ProductionRow(props){
  const /**@type {ActivityProduction} */ production = props[JSON_PRODUCTION].get(props[PROP_ACTIVE_PRODUCTION])
  const /**@type {Tracer} */tracer = props[JSON_TRACER].get(props[PROP_ACTIVE_TRACER]);
  const /**@type {Isotope} */ isotope = props[JSON_ISOTOPE].get(tracer.isotope);

  let total = 0;
  let total_o = 0

  const /**@type {Array<Number>} */ associatedTimeSlots = props[PROP_ASSOCIATED_TIME_SLOTS].get(production.id)
  for(const _order of props[PROP_ASSOCIATED_ORDERS]){
    const /**@type {ActivityOrder} */ order = _order
    let timeSlotID = order.ordered_time_slot
    if(order.moved_to_time_slot){
      timeSlotID = order.moved_to_time_slot
    }
    if(!(associatedTimeSlots.includes(timeSlotID))){
      continue;
    }
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = props[JSON_DELIVER_TIME].get(timeSlotID);
    const /**@type {DeliveryEndpoint} */ endpoint = props[JSON_ENDPOINT].get(timeSlot.destination);
    const /**@type {Customer} */ customer = props[JSON_CUSTOMER].get(endpoint.owner)
    const overhead = props[PROP_OVERHEAD_MAP].get(customer.id);
    const timeDifference = compareTimeStamp(timeSlot.delivery_time, production.production_time);
    let amount = CalculateProduction(isotope.halflife_seconds, timeDifference.hour * 60 + timeDifference.minute, order.ordered_activity);

    total += amount;
    total_o += amount * overhead;
  }

  return (
  <Row>
    Kørsel {production.production_time} : {Math.floor(total)} MBq / Overhead : {Math.floor(total_o)} MBq
  </Row>);
}



/** This is the main row block of content
 *
 * @param {{
 * }} props 
 * @returns {Element}
 */
export function ActivityTable (props) {
  const activeDay = getDay(props[PROP_ACTIVE_DATE])
  const delivery_date = dateToDateString(props[PROP_ACTIVE_DATE])
  const danishDateString = parseDateToDanishDate(delivery_date)

  const /**@type {Array<Number>} */ relevantProductions = [...props[JSON_PRODUCTION].values()].filter((production) => {
    return production.production_day === activeDay && production.tracer === props[PROP_ACTIVE_TRACER]
  }).map(getId)

  const /**@type {Map<Number, Map<Number, Array<ActivityDeliveryTimeSlot>>>} */ timeSlotMapping = createTimeSlotMapping(
    props[JSON_ENDPOINT],
    props[JSON_DELIVER_TIME],
    relevantProductions,
  )

  const /**@type {ArrayMap<Number, Number>} */ contributingTimeSlots = new ArrayMap()

  for(const [activityDeliveryTimeSlotId,_activityDeliveryTimeSlot] of props[JSON_DELIVER_TIME]){
    // You can't turn this into a map because of the sorting ruins parallelism
    const /**@type {ActivityDeliveryTimeSlot} */ activityDeliveryTimeSlot = _activityDeliveryTimeSlot
    if(!relevantProductions.includes(activityDeliveryTimeSlot.production_run)){
      continue;
    }
    contributingTimeSlots.set(activityDeliveryTimeSlot.production_run, activityDeliveryTimeSlotId)
  }

  const [modalIdentifier, setModalIdentifier] = useState(null);
  const [timeSlotID, setTimeSlotID] = useState(null);

  const overheadMap = new Map()

  for(const [_, _tracerCatalogPage] of props[JSON_TRACER_MAPPING]){
    const /**@type {TracerCatalog} */ tracerCatalogPage = _tracerCatalogPage;
    if(tracerCatalogPage.tracer != props[PROP_ACTIVE_TRACER]){
      continue
    }
    overheadMap.set(tracerCatalogPage.customer, tracerCatalogPage.overhead_multiplier)
  }


  // Order Filtering
  const /**@type {Array<ActivityOrder>} */ all_orders = [...props[JSON_ACTIVITY_ORDER].values()]
  const todays_orders = all_orders.filter((order) => {
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = props[JSON_DELIVER_TIME].get(order.ordered_time_slot);
    const /**@type {ActivityProduction} */ production = props[JSON_PRODUCTION].get(timeSlot.production_run)

    return order.delivery_date === delivery_date && production.tracer == props[PROP_ACTIVE_TRACER]
  });

  const OrderMapping = createOrderMapping(todays_orders)

  console.log(timeSlotMapping, relevantProductions)

  const renderedTimeSlots = Array.from(OrderMapping).sort(
    sortOrderMapping(props[JSON_DELIVER_TIME], props[JSON_ENDPOINT])
    ).map(([timeSlotID, orders]) => {
      const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = props[JSON_DELIVER_TIME].get(timeSlotID);
      const /**@type {DeliveryEndpoint} */ endpoint = props[JSON_ENDPOINT].get(timeSlot.destination);
      const /**@type {Array<ActivityDeliveryTimeSlot>} */ timeSlots = timeSlotMapping.get(endpoint.owner).get(endpoint.id)

      const RenderedTimeSlotProps = {...props};
      RenderedTimeSlotProps[PROP_OVERHEAD_MAP] = overheadMap;
      RenderedTimeSlotProps[PROP_ASSOCIATED_TIME_SLOTS] = timeSlots;
      RenderedTimeSlotProps[JSON_ACTIVITY_ORDER] = orders;
      RenderedTimeSlotProps[PROP_ON_CLICK] = () => {
        setModalIdentifier("activityModal")
        setTimeSlotID(timeSlotID)
      }

      RenderedTimeSlotProps['timeSlotID'] = timeSlotID;

      return <RenderedTimeSlot key={timeSlotID} {...RenderedTimeSlotProps}/>
    })


  const productionRows = relevantProductions.map((productionID) => {
    const productionProps = {...props}

    productionProps[PROP_OVERHEAD_MAP] = overheadMap;
    productionProps[PROP_ASSOCIATED_ORDERS] = todays_orders;
    productionProps[PROP_ASSOCIATED_TIME_SLOTS] = contributingTimeSlots;
    productionProps[PROP_ACTIVE_PRODUCTION] = productionID;


    return (<ProductionRow key={productionID} {...productionProps}/>)
  })

  const modalProps = {...props}
  modalProps[PROP_ORDER_MAPPING] = timeSlotMapping
  modalProps[PROP_ON_CLOSE] = () => {
    setModalIdentifier(null)
    setTimeSlotID(null)
  }
  modalProps[PROP_TIME_SLOT_ID] = timeSlotID
  modalProps[PROP_TIME_SLOT_MAPPING] = timeSlotMapping;
  modalProps[PROP_ORDER_MAPPING] = OrderMapping;
  modalProps[PROP_OVERHEAD_MAP] = overheadMap;

  let Modal = null
  if(Modals[modalIdentifier]){
    const ModalType = Modals[modalIdentifier]
    Modal = <ModalType {...modalProps} />
  }
  


  return (
    <div>
      <Container>
        <Row>
          <Col sm={10}>
            <Row>Produktioner - {danishDateString}:</Row>
            {productionRows}
          </Col>
          <Col sm={2}>
            <Button 
              name="create-order"
              onClick={() => {setModalIdentifier("createModal")}}>Opret ny ordre</Button>
          </Col>
        </Row>
      </Container>
      <Container>
        {renderedTimeSlots}
      </Container>
      { modalIdentifier != null ? Modal : null }
    </div>
  );
}
