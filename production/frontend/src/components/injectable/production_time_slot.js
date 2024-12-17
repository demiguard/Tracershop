import React, { useState } from 'react'
import { Card, Row, Col, Collapse, Button } from 'react-bootstrap';
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context';
import { getTimeSlotOwner } from '~/lib/data_structures';
import { getId } from '~/lib/utils';
import { OrderMapping } from '~/lib/data_structures/order_mapping';
import { ORDER_STATUS, cssCenter } from '~/lib/constants';
import { Optional } from '~/components/injectable/optional';
import { OpenCloseButton } from '~/components/injectable/open_close_button';
import { ActivityDeliveryIcon, ClickableIcon, StatusIcon } from '~/components/injectable/icons';
import { Comment } from '~/components/injectable/data_displays/comment';
import { ActivityDeliveryTimeSlot } from '~/dataclasses/dataclasses';
import { TimeDisplay } from '~/components/injectable/data_displays/time_display';
import { fulfillmentActivity } from '~/lib/physics';
import { formatTimeStamp, formatUsername, renderDateTime } from '~/lib/formatting';

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


//#region ProductionTimeSlot
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
* @param {OrderMapping} props.orderMapping
* @returns
*/
export function ProductionTimeSlot({timeSlot,
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
const orderCollection = orderMapping.getOrders(timeSlot.id);


const firstAvailableTimeSlot = timeSlotMapping.getFirstTimeSlot(timeSlot);
const /**@type {Number} */ firstAvailableTimeSlotID = firstAvailableTimeSlot.id;

const OrderData = [];

for(const order of orderCollection.relevant_orders){
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
