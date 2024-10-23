
import React, { useState } from "react";
import { Row, Col, Button, Container, Card, Collapse, Modal } from 'react-bootstrap'
import { getId } from "../../lib/utils.js";
import { dateToDateString, formatTimeStamp, formatUsername, parseDateToDanishDate, renderDateTime } from "../../lib/formatting.js";
import { calculateProduction, CalculateProduction, fulfillmentActivity } from "../../lib/physics.js";
import { ActivityModal } from "../modals/activity_modal.js";
import { CreateOrderModal } from "../modals/create_activity_modal.js";
import propTypes from 'prop-types'


import { cssCenter, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER,
  PROP_ORDER_MAPPING, PROP_ON_CLOSE, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING,
  PROP_TRACER_CATALOG, ORDER_STATUS,
  DAYS_OBJECTS
} from "../../lib/constants.js";

import {WEBSOCKET_MESSAGE_RESTORE_ORDERS,
  WEBSOCKET_MESSAGE_MOVE_ORDERS, DATA_ACTIVITY_ORDER, DATA_DELIVER_TIME,
} from "~/lib/shared_constants.js"

import { ActivityDeliveryIcon, ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Customer,
  DeliveryEndpoint, Tracer} from "../../dataclasses/dataclasses.js";
import { compareTimeStamp, getDay, getTimeString, TimeStamp
  } from "../../lib/chronomancy.js";
import { ProductionTimeSlotOwnerShip, TimeSlotMapping, TracerCatalog,
  OrderMapping, ActivityOrderCollection } from "../../lib/data_structures.js";
import { OpenCloseButton } from "../injectable/open_close_button.js";
import { activityOrdersFilter, applyFilter, dailyActivityOrderFilter, productionDayTracerFilter, productionsFilter } from "../../lib/filters.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { TimeDisplay } from "../injectable/data_displays/time_display.js";
import { Comment } from "../injectable/data_displays/comment.js";
import { Optional } from "../injectable/optional.js";

const Modals = {
  create_modal : CreateOrderModal,
  activityModal : ActivityModal,
}

//#region Order Row
/**
  * Row of an order inside of a RenderedTimeSlot
  * @param {{
  *   order : ActivityOrder,
  *   overhead : Number,
  * }} props
  * @returns { Element }
  */
  function OrderRow({order, overhead}){
    const state = useTracershopState();
    const base_activity = fulfillmentActivity(order, state);
    const overhead_activity = Math.floor(base_activity * overhead);

    return (
    <Row>
      <Col xs={1}><StatusIcon order={order}/></Col>
      <Col>Order ID: {order.id}</Col>
      <Col>{base_activity} MBq</Col>
      <Col>{overhead_activity} MBq</Col>
      <Col><Comment comment={order.comment}/></Col>
    </Row>);
 }


//#region TimeSlotRow
/**
  * This is similar to the shop side TimeSlotCard,
  * however the functionality is quite different
  * Creates a number of OrderRow inside of the card.
  * @param {object} props
  * @param {ActivityDeliveryTimeSlot} props.timeSlot - The time slot for the Row
  * @param {Tracer} props.tracer - Tracer of the time slot
  * @param {React.Dispatch<React.SetStateAction<null>>} props.setModalIdentifier
  * Function for activating the activity modal
  * @param {React.Dispatch<React.SetStateAction<null>>} props.setTimeSlotID
  * Function for specifying it should be this time slot that should be opened
  * @param {TimeSlotMapping} props.timeSlotMapping
* @returns
*/
function TimeSlotRow({timeSlot,
                      setTimeSlotID,
                      setModalIdentifier,
                      tracer,
                      tracerCatalog,
                      orderMapping,
                      timeSlotMapping
  }){
  const state = useTracershopState();
  const websocket = useWebsocket();
  const owner = getTimeSlotOwner(timeSlot, state.delivery_endpoint, state.customer);
  const overhead = tracerCatalog.getOverheadForTracer(owner.id, tracer.id);
  // Prop extraction
  const orders = orderMapping.getOrders(timeSlot.id);
  const orderCollection = new ActivityOrderCollection(orders, timeSlot, state, overhead);

  const firstAvailableTimeSlot = timeSlotMapping.getFirstTimeSlot(timeSlot);
  const /**@type {Number} */ firstAvailableTimeSlotID = firstAvailableTimeSlot.id;

  const OrderData = [];

  for(const order of orders){
    const is_originalTimeSlot = order.ordered_time_slot === timeSlot.id
                             && order.moved_to_time_slot === null
                             || order.moved_to_time_slot === timeSlot.id

    if(is_originalTimeSlot){
      OrderData.push(<OrderRow key={order.id} order={order} overhead={overhead}/>);
    }
  }
  const canMove = firstAvailableTimeSlot.id !== timeSlot.id
               && orderCollection.minimum_status < ORDER_STATUS.RELEASED;

 // State
 const [open, setOpen] = useState(false);

// Functions
  function moveOrders(){
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_MOVE_ORDERS);
    console.log(firstAvailableTimeSlotID)
    const firstTimeSlotOrders = orderMapping.getOrders(firstAvailableTimeSlotID)

    const minimum_status =  firstTimeSlotOrders
      .map((order) => order.status)
      .reduce((x,y) => Math.min(x,y), 1000);

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
    }

    if (orderCollection.moved){
      return ['', <div>Rykket til <TimeDisplay time={firstAvailableTimeSlot.delivery_time}/></div>]
    }

    return [
      `Bestilt: ${Math.floor(orderCollection.ordered_activity)} MBq`,
      `Til Udlevering: ${Math.floor(orderCollection.deliver_activity)} MBq`,
    ];

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
            <ActivityDeliveryIcon
              orderCollection={orderCollection}
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
          <Row>
            <Col xs={1}></Col>
            <Col>Ordre ID</Col>
            <Col>uden overhead</Col>
            <Col>Med Overhead</Col>
            <Col></Col>
          </Row>
          {OrderData}
          <Optional exists={!(orderCollection.moved)}>
            <Row style={{justifyContent : "end"}}>
              <Col xs={1}>
                <Button
                  style={{
                    marginLeft : "-15px"
                  }}
                  onMouseDown={() => {
                    setTimeSlotID(timeSlot.id);
                    setModalIdentifier('activityModal');
                  }}>
                  Åben
                </Button>
              </Col>
            </Row>
          </Optional>
       </Card.Body>
     </Collapse>
   </Card>);
}


//#region Production Row
/**
 * Row over the actual table,with the goal of informing the user of how much
 * tracer needs to be produced
 * @param {object} props
 * @param {Number} props.active_production - Id of the Production to be rendered
 * @param {ProductionTimeSlotOwnerShip} props.productionTimeSlotOwnerShip - Data structure
 *
 * {{
*  active_production : Number - ID of the production
*  productionTimeSlotOwnerShip : ProductionTimeSlotOwnerShip -
*  tracerCatalog : TracerCatalog - A catalog of the tracers the customers can
*  orderMapping : OrderMapping - A mapping of orders to time slots, taking into account that orders may have been moved
* }} props
* @returns
*/
function ProductionRow({active_production,
                        productionTimeSlotOwnerShip,
                        tracerCatalog,
                        orderMapping}){
  const state = useTracershopState();
  const production = state.production.get(active_production);
  const tracer = state.tracer.get(production.tracer);
  const isotope = state.isotopes.get(tracer.isotope);

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
          if(order.status === ORDER_STATUS.CANCELLED){
            continue;
          }

          const contributingTimeSlot = (() => {
            const id = order.moved_to_time_slot ? order.moved_to_time_slot : order.ordered_time_slot;
            return state.deliver_times.get(id);
          })();

          if(!(associatedTimeSlots.includes(contributingTimeSlot))){
            // This is indicate that the order have been moved to an other production
            // So it should not be included in the production!
            //console.log(`Order `, order, ` belongs to a time slot`, contributingTimeSlot, `that is not the production: ${associatedTimeSlots.map(getId)}`);
            continue;
          }
          const originalTimeSlot = state.deliver_times.get(order.ordered_time_slot)
          const timeDifference = compareTimeStamp(originalTimeSlot.delivery_time, production.production_time);
          const amount = calculateProduction(isotope.halflife_seconds, timeDifference.hour * 60 + timeDifference.minute, order.ordered_activity);

          activity_ordered += amount;
          activity_overhead += amount * overhead;
        }
      }
    }
 }

 return (
 <Row>
   <h4>
     Kørsel {production.production_time} : <strong>{Math.floor(activity_ordered)}</strong> MBq / Overhead : <strong>{Math.floor(activity_overhead)}</strong> MBq
   </h4>
 </Row>);
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

//#region Activity table
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
  const activeDay = getDay(active_date)
  const delivery_date = dateToDateString(active_date)
  const danishDateString = parseDateToDanishDate(delivery_date);
[]
  const relevantProductions = applyFilter(
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

  const productionRows = relevantProductions.map((productionID) => {
    return (<ProductionRow
      key={productionID}
      active_production={productionID}
      productionTimeSlotOwnerShip={productionTimeSlotOwnerShip}
      tracerCatalog={tracerCatalog}
      orderMapping={orderMapping}
    />);
  })

  const renderedTimeSlots = [];
  for (const timeSlot of orderMapping){
      renderedTimeSlots.push(<TimeSlotRow
                key={timeSlot.id}
                timeSlot = {timeSlot}
                tracer={tracer}
                tracerCatalog={tracerCatalog}
                orderMapping={orderMapping}
                timeSlotMapping={timeSlotMapping}
                setTimeSlotID={setTimeSlotID}
                setModalIdentifier={setModalIdentifier}
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

  let available_days_html = <div></div>;
  if(productionRows.length === 0 && active_tracer != -1){
    const /**@type {ActivityProduction[]} */ weekly_productions = productionsFilter(state, {tracerID : active_tracer});
    const /**@type {Set<Number>} */ production_days = new Set();
    for(const production of weekly_productions){
      production_days.add(production.production_day);
    }
    const available_days =  [...production_days]
      .sort((a,b) => a - b)
      .map((day) => DAYS_OBJECTS[day].name)
      .join(", ");
    if(tracer){
      available_days_html = <Row><h3>{tracer.shortname} bliver kun produceret: {available_days}</h3></Row>;
    } else {
      console.log("Active_tracer:", active_tracer)
      console.log(state)
    }
  }

  return (
    <div>
      <Container>
        <Row>
          <Col sm={10}>
            <Optional exists={!!productionRows.length} alternative={available_days_html}>
              <Row><h3>Produktioner - {danishDateString}:</h3></Row>
              {productionRows}
            </Optional>
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