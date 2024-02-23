
import React, { useState } from "react";
import { Row, Col, Button, Container, Card, Collapse } from 'react-bootstrap'
import { getId, getPDFUrls } from "../../lib/utils.js";
import { dateToDateString, formatTimeStamp, formatUsername, parseDateToDanishDate, renderDateTime } from "../../lib/formatting.js";
import { CalculateProduction } from "../../lib/physics.js";
import { ActivityModal } from "../modals/activity_modal.js";
import { CreateOrderModal } from "../modals/create_activity_modal.js";
import propTypes from 'prop-types'


import { cssCenter, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER,
  PROP_ORDER_MAPPING, PROP_ON_CLOSE, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING,
  PROP_TRACER_CATALOG, ORDER_STATUS
} from "../../lib/constants.js";

import {WEBSOCKET_MESSAGE_RESTORE_ORDERS,
  WEBSOCKET_MESSAGE_MOVE_ORDERS, DATA_ACTIVITY_ORDER, DATA_DELIVER_TIME,
} from "~/lib/shared_constants.js"

import { ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Customer,
  DeliveryEndpoint } from "../../dataclasses/dataclasses.js";
import { compareTimeStamp, getDay, getTimeString
  } from "../../lib/chronomancy.js";
import { ProductionTimeSlotOwnerShip, TimeSlotMapping, TracerCatalog,
  OrderMapping, ActivityOrderCollection } from "../../lib/data_structures.js";
import { OpenCloseButton } from "../injectable/open_close_button.js";
import { applyFilter, dailyActivityOrderFilter, productionDayTracerFilter } from "../../lib/filters.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { TimeDisplay } from "../injectable/data_displays/time_display.js";
import { Comment } from "../injectable/data_displays/comment.js";
import { Optional } from "../injectable/optional.js";

const Modals = {
  create_modal : CreateOrderModal,
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
 *  active_tracer : Number,
 *  active_date : Date
 * }} props
 * @returns {Element}
 */
export function ActivityTable ({active_tracer, active_date}) {
  const state = useTracershopState();

  const tracer = state.tracer.get(active_tracer);
  const isotope = state.isotopes.get(tracer.isotope);
  const activeDay = getDay(active_date)
  const delivery_date = dateToDateString(active_date)
  const danishDateString = parseDateToDanishDate(delivery_date);
  const websocket = useWebsocket();

  const /**@type {Array<Number>} */ relevantProductions = applyFilter(
    state.production,
    productionDayTracerFilter(activeDay, active_tracer)
  ).map(getId);

  const timeSlotMapping = new TimeSlotMapping(
    state.delivery_endpoint,
    state.deliver_times,
    relevantProductions,
  );

  const productionTimeSlotOwnerShip = new ProductionTimeSlotOwnerShip(
    relevantProductions,
    state.deliver_times
  );

  const tracerCatalog = new TracerCatalog(
    state.tracer_mapping,
    state.tracer
  );

  const [modalIdentifier, setModalIdentifier] = useState(null);
  const [timeSlotID, setTimeSlotID] = useState(null);

  // Order Filtering
  const todays_orders = applyFilter(state.activity_orders,
                                    dailyActivityOrderFilter(state.deliver_times,
                                                             state.production,
                                                             delivery_date,
                                                             active_tracer));

  const orderMapping = new OrderMapping(todays_orders,
                                        state.deliver_times,
                                        state.delivery_endpoint);

  /**
  * Row inside of a RenderedTimeSlot
  * @param {{
  *   order : ActivityOrder
  * }} props
  * @returns { Element }
  */
  function OrderRow({order}){
    return (<Row>
      <Col><StatusIcon order={order}/></Col>
      <Col>Order ID: {order.id}</Col>
      <Col>{order.ordered_activity} MBq</Col>
      <Col><Comment comment={order.comment}/></Col>
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
  function TimeSlotRow({timeSlot}){
    const endpoint = state.delivery_endpoint.get(timeSlot.destination);
    const owner = getTimeSlotOwner(timeSlot, state.delivery_endpoint, state.customer);
    const overhead = tracerCatalog.getOverheadForTracer(owner.id, tracer.id);
    // Prop extraction
    const orders = orderMapping.getOrders(timeSlot.id);
    const orderCollection = new ActivityOrderCollection(orders, state, overhead);

    const firstAvailableTimeSlot = timeSlotMapping.getFirstTimeSlot(timeSlot);
    const firstAvailableTimeSlotID = firstAvailableTimeSlot.id;

    const OrderData = [];

    for(const order of orders){
      const is_originalTimeSlot = order.ordered_time_slot === timeSlot.id
                               && order.moved_to_time_slot === null
                               || order.moved_to_time_slot === timeSlot.id

      if(is_originalTimeSlot){
        OrderData.push(<OrderRow key={order.id} order={order}/>);
      }
    }
    const canMove = firstAvailableTimeSlotID !== timeSlot.id
                 && orderCollection.minimum_status < ORDER_STATUS.RELEASED;

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

   function headerFunction(){
    if (orderCollection.moved && canMove) {
      restoreOrders()
    } else {
      setTimeSlotID(timeSlot.id);
      setModalIdentifier('activityModal');
    }
   }

   const [thirdColumnInterior, fourthColumnInterior] = (() => {
      if (orderCollection.minimum_status === ORDER_STATUS.CANCELLED){
        return [`Afvist af ${formatUsername(orderCollection.freed_by)}`,
                `Afvist Kl: ${renderDateTime(orderCollection.freed_time)}`];
      }

      if (orderCollection.minimum_status === ORDER_STATUS.RELEASED){
        return [`Udleveret: ${Math.floor(orderCollection.delivered_activity)} MBq`,
                `Frigivet kl: ${formatTimeStamp(orderCollection.freed_time)}`,
        ];
      } else {
        if (canMove && !orderCollection.moved){
        }
        return [
          `Bestilt: ${Math.floor(orderCollection.ordered_activity)} MBq`,
          `Til Udlevering: ${Math.floor(orderCollection.deliver_activity)} MBq`,
        ];
      }
    })();

   return (
     <Card key={timeSlot.id}>
       <Card.Header>
         <Row>
           <Col xs={1} style={cssCenter}>
              <StatusIcon
                label={`time-slot-icon-${timeSlot.id}`}
                orderCollection={orderCollection}
                onClick={headerFunction}
              />
           </Col>
           <Col style={cssCenter}>{orderCollection.owner.short_name} - {orderCollection.endpoint.name}</Col>
           <Col style={cssCenter}><TimeDisplay time={timeSlot.delivery_time}/></Col>
           <Col style={cssCenter}>{thirdColumnInterior}</Col>
           <Col style={cssCenter}>{fourthColumnInterior}</Col>
           <Col style={cssCenter}>
            <Optional exists={orderCollection.minimum_status === ORDER_STATUS.RELEASED && !orderCollection.moved}>
              <ClickableIcon
                src="/static/images/delivery.svg"
                onClick={()=>{
                  window.location = getPDFUrls(endpoint, tracer, new Date(orderCollection.ordered_date));
                }}
              />
            </Optional>
            <Optional exists={canMove && !orderCollection.moved}>
              <ClickableIcon
                src="/static/images/move_top.svg"
                onClick={moveOrders}
              />
            </Optional>
           </Col>
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
  const /**@type {ActivityProduction} */ production = state.production.get(active_production);

  let activity_ordered = 0;
  let activity_overhead = 0;

  const /**@type {Array<Number> | undefined} */ associatedTimeSlots = productionTimeSlotOwnerShip.getTimeSlots(active_production);

  if (associatedTimeSlots !== undefined) {
    for(const timeSlot of associatedTimeSlots){
      const customer = getTimeSlotOwner(timeSlot, state.delivery_endpoint, state.customer)
      const overhead = tracerCatalog.getOverheadForTracer(customer.id, tracer.id)
      const orders = orderMapping.getOrders(timeSlot.id);
      if(orders !== undefined) {
        for (const order of orders){
          const contributingTimeSlot = (() => {
            const id = order.moved_to_time_slot ? order.moved_to_time_slot : order.ordered_time_slot;
            return state.deliver_times.get(id);
          })();

          if(!(associatedTimeSlots.includes(contributingTimeSlot))){
            // This is indicate that the order have been moved to an other production
            // So it should not be included in the production!
            //console.log(`Order ${order.id} belongs to a time slot`, contributingTimeSlot, `that is not the production: ${associatedTimeSlots.map(getId)}`);
            continue;
          }
          const timeDifference = compareTimeStamp(contributingTimeSlot.delivery_time, production.production_time);
          let amount = CalculateProduction(isotope.halflife_seconds, timeDifference.hour * 60 + timeDifference.minute, order.ordered_activity);

          activity_ordered += amount;
          activity_overhead += amount * overhead;
        }
      }
    }
  }

  return (
  <Row>
    <h4>
      Kørsel {production.production_time} : {Math.floor(activity_ordered)} MBq / Overhead : {Math.floor(activity_overhead)} MBq
    </h4>
  </Row>);
  }

  const productionRows = relevantProductions.map((productionID) => {
    return (<ProductionRow key={productionID} active_production={productionID}/>);
  })

  const renderedTimeSlots = [];
  for (const timeSlot of orderMapping){
      renderedTimeSlots.push(<TimeSlotRow
                key={timeSlot.id}
                timeSlot = {timeSlot}
             />);
  }

  const modalProps = {
    [PROP_ACTIVE_TRACER] : active_tracer,
    [PROP_ACTIVE_DATE] : active_date,
    [PROP_ORDER_MAPPING] : timeSlotMapping,
    [PROP_ON_CLOSE] : () => {
      setModalIdentifier(null)
      setTimeSlotID(null)
    },
    [PROP_TIME_SLOT_ID] : timeSlotID,
    [PROP_TIME_SLOT_MAPPING] : timeSlotMapping,
    [PROP_ORDER_MAPPING] : orderMapping,
    [PROP_TRACER_CATALOG] : tracerCatalog,
  };

  let Modal = null;
  if(Modals[modalIdentifier]){
    const ModalType = Modals[modalIdentifier];
    Modal = <ModalType {...modalProps} />;
  }

  return (
    <div>
      <Container>
        <Row>
          <Col sm={10}>
            <Row><h3>Produktioner - {danishDateString}:</h3></Row>
            {productionRows}
          </Col>
          <Col sm={2}>
            <Button
              name="create-order"
              onClick={() => {setModalIdentifier("create_modal")}}>Opret ny ordre</Button>
          </Col>
        </Row>
      </Container>
      <Container>
        {renderedTimeSlots}
      </Container>
      { modalIdentifier != null ? Modal : null}
    </div>
  );
}

ActivityTable.propType = {
  [PROP_ACTIVE_TRACER] : propTypes.number.isRequired,
  [PROP_ACTIVE_DATE] : propTypes.objectOf(Date),
}