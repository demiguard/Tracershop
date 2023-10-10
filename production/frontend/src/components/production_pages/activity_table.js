
import React, { useState } from "react";
import { Row, Col, Button, Container, Card, Collapse } from 'react-bootstrap'
import { getId, getPDFUrls } from "../../lib/utils.js";
import { dateToDateString, parseDateToDanishDate } from "../../lib/formatting.js";
import { CalculateProduction } from "../../lib/physics.js";
import { ActivityModal } from "../modals/activity_modal.js";
import { CreateOrderModal } from "../modals/create_activity_modal.js";

import { cssCenter, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER,
  PROP_ORDER_MAPPING, PROP_ON_CLOSE, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING,
  PROP_TRACER_CATALOG
} from "../../lib/constants.js";

import {DATA_CUSTOMER, DATA_VIAL, DATA_TRACER_MAPPING, WEBSOCKET_MESSAGE_RESTORE_ORDERS,
  WEBSOCKET_MESSAGE_MOVE_ORDERS, DATA_ACTIVITY_ORDER, DATA_DELIVER_TIME,
  DATA_ISOTOPE, DATA_PRODUCTION, DATA_ENDPOINT, DATA_TRACER
} from "~/lib/shared_constants.js"

import { ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { renderComment } from "../../lib/rendering.js";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Customer, DeliveryEndpoint, Isotope, Tracer, Vial } from "../../dataclasses/dataclasses.js";
import { compareTimeStamp, getDay, getTimeString } from "../../lib/chronomancy.js";
import { ProductionTimeSlotOwnerShip, TimeSlotMapping, TracerCatalog, OrderMapping } from "../../lib/data_structures.js";
import { OpenCloseButton } from "../injectable/open_close_button.js";
import { applyFilter, productionDayTracerFilter } from "../../lib/filters.js";
import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { useWebsocket } from "../tracer_shop_context.js";

const Modals = {
  createModal : CreateOrderModal,
  activityModal : ActivityModal,
}

/**
 * gets the owner of a time slot
 * @param {ActivityDeliveryTimeSlot} timeSlot - The timeslot you desire to find the owner of
 * @param {Map<Number, DeliveryEndpoint>} endpoints - Map of all known endpoints
 * @param {Map<Number, Customer>} customers - Map of all known customers
 * @return {Customer}
 */
function getTimeSlotOwner(timeSlot, endpoints, customers){
  const endpoint = endpoints.get(timeSlot.destination)
  const customer = customers.get(endpoint.owner);
  if (customer === undefined){
    throw "Database Integrity violated!"
  }
  return customer
}


/** This is the main row block of content
 *
 * @param {{
 * }} props 
 * @returns {Element}
 */
export function ActivityTable (props) {
  const /**@type {Tracer} */ tracer = props[DATA_TRACER].get(props[PROP_ACTIVE_TRACER]);
  const /**@type {Isotope} */ isotope = props[DATA_ISOTOPE].get(tracer.isotope);
  const activeDay = getDay(props[PROP_ACTIVE_DATE])
  const delivery_date = dateToDateString(props[PROP_ACTIVE_DATE])
  const danishDateString = parseDateToDanishDate(delivery_date);
  const /**@type {TracerWebSocket} */ websocket = useWebsocket()

  const /**@type {Array<Number>} */ relevantProductions = applyFilter(
    props[DATA_PRODUCTION],
    productionDayTracerFilter(activeDay, props[PROP_ACTIVE_TRACER])
  ).map(getId)

  const timeSlotMapping = new TimeSlotMapping(
    props[DATA_ENDPOINT],
    props[DATA_DELIVER_TIME],
    relevantProductions,
  )

  const productionTimeSlotOwnerShip = new ProductionTimeSlotOwnerShip(
    relevantProductions,
    props[DATA_DELIVER_TIME]
  )

  const tracerCatalog = new TracerCatalog(
    props[DATA_TRACER_MAPPING],
    props[DATA_TRACER]
  )

  const [modalIdentifier, setModalIdentifier] = useState(null);
  const [timeSlotID, setTimeSlotID] = useState(null);



  // Order Filtering
  const /**@type {Array<ActivityOrder>} */ all_orders = [...props[DATA_ACTIVITY_ORDER].values()]
  const todays_orders = all_orders.filter((order) => {
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = props[DATA_DELIVER_TIME].get(order.ordered_time_slot);
    const /**@type {ActivityProduction} */ production = props[DATA_PRODUCTION].get(timeSlot.production_run)

    return order.delivery_date === delivery_date && production.tracer == props[PROP_ACTIVE_TRACER]
  });

  const orderMapping = new OrderMapping(todays_orders,
                                        props[DATA_DELIVER_TIME],
                                        props[DATA_ENDPOINT])

  /**
  * Row inside of a RenderedTimeSlot
  * @param {{
  * order : ActivityOrder
  * }} props
  * @returns {JSX }
  */
  function OrderRow({order}){
    let statusIcon = <StatusIcon status={order.status}/>

    if (order.moved_to_time_slot != null){
      statusIcon = <ClickableIcon src="/static/images/move_top.svg"/>
    }

    return (<Row>
      <Col>{statusIcon}</Col>
      <Col>Order ID: {order.id}</Col>
      <Col>{order.ordered_activity} MBq</Col>
      <Col>{order.comment ? renderComment(order.comment) : ""}</Col>
    </Row>);
 }

 /**
  * This is similiar to the shop side TimeSlotCard, however the functionality is quite different
  * Creates a number of OrderRow inside of the card.
  * @param {
  * timeSlot : ActivityDeliveryTimeSlot
  * } props
  * @returns
  */
  function RenderedTimeSlot({timeSlot}){
    const /**@type {DeliveryEndpoint} */ endpoint = props[DATA_ENDPOINT].get(timeSlot.destination)
    const owner = getTimeSlotOwner(timeSlot, props[DATA_ENDPOINT], props[DATA_CUSTOMER])
    const overhead = tracerCatalog.getOverheadForTracer(owner.id, tracer.id)
    // Prop extraction
    const orders = orderMapping.getOrders(timeSlot.id)

    const firstAvailableTimeSlot = timeSlotMapping.getFirstTimeSlot(timeSlot)
    const firstAvailableTimeSlotID = firstAvailableTimeSlot.id

    let orderedMBq = 0;
    let deliveredMBq = 0;
    let freedMbq = 0;
    let freedTime = ""
    let minimumStatus = 3;
    const OrderData = [];
    let moved = true;

    for(const order of orders){
      const is_originalTimeSlot = order.ordered_time_slot === timeSlot.id && order.moved_to_time_slot === null
      || order.moved_to_time_slot === timeSlot.id
      if (is_originalTimeSlot){
        moved = false;
      }
      if(order.ordered_time_slot === timeSlot.id){
        orderedMBq += order.ordered_activity;
        if (order.moved_to_time_slot === null) {
          deliveredMBq += order.ordered_activity * overhead
        }
      }
      if(order.moved_to_time_slot === timeSlot.id){
        const /**@type {ActivityDeliveryTimeSlot} */ originalTimeSlot =  props[DATA_DELIVER_TIME].get(order.ordered_time_slot);
        const timeDelta = compareTimeStamp(originalTimeSlot.delivery_time, timeSlot.delivery_time);
        deliveredMBq += CalculateProduction(isotope.halflife_seconds, timeDelta.hour * 60 + timeDelta.minute, order.ordered_activity)  * overhead
      }

      minimumStatus = Math.min(minimumStatus, order.status);

      if(minimumStatus === 3){
        for(const [_vialID, _vial] of props[DATA_VIAL]){
          const /**@type {Vial} */ vial = _vial
          if (vial.assigned_to === order.id){
            freedMbq += vial.activity
          }
        }

        if (order.freed_datetime && freedTime === "") {
          const timestamp = getTimeString(order.freed_datetime)
          const dateString = parseDateToDanishDate(dateToDateString(new Date  (order.freed_datetime)))

          freedTime = `${timestamp}`
        }
      }

      if(is_originalTimeSlot){
        OrderData.push(<OrderRow
          key={order.id}
          order={order}
          />);
        }
     }
    const canMove = firstAvailableTimeSlotID !== timeSlot.id && minimumStatus < 3;


   // State
   const [open, setOpen] = useState(false);

   // Functions
   function moveOrders(){
     const message = websocket.getMessage(WEBSOCKET_MESSAGE_MOVE_ORDERS);

     message[DATA_DELIVER_TIME] = firstAvailableTimeSlotID;
     message[DATA_ACTIVITY_ORDER] = orders.map(getId);
     websocket.send(message);
   }

   function restoreOrders(){
     const message = websocket.getMessage(WEBSOCKET_MESSAGE_RESTORE_ORDERS);
     message[DATA_ACTIVITY_ORDER] = orders.map(getId);
     websocket.send(message);
   }

   

   // Sub-components
   let headerIcon = <StatusIcon
                       label={`time-slot-icon-${timeSlot.id}`}
                       status={minimumStatus}
                       onClick={() => {
                         setTimeSlotID(timeSlot.id)
                         setModalIdentifier('activityModal')
                       }}
                     />
   if(moved){
     headerIcon = <ClickableIcon
                     src="/static/images/move_top.svg"
                     label={`time-slot-icon-${timeSlot.id}`}
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
     fourthColumnInterior = `Frigivet kl: ${freedTime}`;
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
                     onClick={()=>{
                       window.location = getPDFUrls(endpoint, tracer, props[PROP_ACTIVE_DATE])
                     }}
                   />
   }

   return (
     <Card key={timeSlot.id}>
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
             <OpenCloseButton
               label={`open-time-slot-${timeSlot.id}`}
               open={open}
               setOpen={setOpen}
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
 * @param {{
 *  active_production : Number - ID of the production
 * }} props 
 * @returns 
 */
function ProductionRow({active_production}){
  const /**@type {ActivityProduction} */ production = props[DATA_PRODUCTION].get(active_production)

  let activity_ordered = 0;
  let activity_overhead = 0

  const /**@type {Array<Number> | undefined} */ associatedTimeSlots = productionTimeSlotOwnerShip.getTimeSlots(active_production);
  console.log(associatedTimeSlots)

  if (associatedTimeSlots !== undefined) {
    for(const timeSlot of associatedTimeSlots){
      const customer = getTimeSlotOwner(timeSlot, props[DATA_ENDPOINT], props[DATA_CUSTOMER])
      const overhead = tracerCatalog.getOverheadForTracer(customer.id, tracer.id)
      const orders = orderMapping.getOrders(timeSlot.id)
      if(orders !== undefined) for (const order of orders){
        let contributingTimeSlot = order.ordered_time_slot
        if(order.moved_to_time_slot){
          contributingTimeSlot = order.moved_to_time_slot
        }

        if(!(associatedTimeSlots.includes(contributingTimeSlot))){
          continue;
        }
        const timeDifference = compareTimeStamp(contributingTimeSlot.delivery_time, production.production_time);
        let amount = CalculateProduction(isotope.halflife_seconds, timeDifference.hour * 60 + timeDifference.minute, order.ordered_activity);

        activity_ordered += amount;
        activity_overhead += amount * overhead;
      }
    }
  }

  return (
  <Row>
    Kørsel {production.production_time} : {Math.floor(activity_ordered)} MBq / Overhead : {Math.floor(activity_overhead)} MBq
  </Row>);
  }

  const productionRows = relevantProductions.map((productionID) => {
    return (<ProductionRow key={productionID} active_production={productionID}/>)
  })


  const renderedTimeSlots = [];
  for (const timeSlot of orderMapping){
      renderedTimeSlots.push(<RenderedTimeSlot
                key={timeSlot.id}
                timeSlot = {timeSlot}
             />)
  }


  const modalProps = {...props}
  modalProps[PROP_ORDER_MAPPING] = timeSlotMapping
  modalProps[PROP_ON_CLOSE] = () => {
    setModalIdentifier(null)
    setTimeSlotID(null)
  }
  modalProps[PROP_TIME_SLOT_ID] = timeSlotID
  modalProps[PROP_TIME_SLOT_MAPPING] = timeSlotMapping;
  modalProps[PROP_ORDER_MAPPING] = orderMapping;
  modalProps[PROP_TRACER_CATALOG] = tracerCatalog;

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
