import React, { useState } from "react";

import { ActivityOrder, ActivityDeliveryTimeSlot, DeliveryEndpoint } from "../../../dataclasses/dataclasses";
import { ParseDanishNumber, nullParser } from "../../../lib/formatting";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { JSON_ACTIVITY_ORDER, cssCenter } from "../../../lib/constants";
import { ClickableIcon, StatusIcon } from "../../injectable/icons";
import { Card, Collapse, Col, Form, FormControl, InputGroup, Row } from "react-bootstrap";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";

import SiteStyles from '../../../css/Site.module.css'

/**
 * This component is a row in the card of the activity timeSlot
 * @param {{
*  date : Date
*  order : ActivityOrder,
*  timeSlot : ActivityDeliveryTimeSlot,
*  timeSlots : Map<Number, ActivityDeliveryTimeSlot>
*  websocket : TracerWebSocket,
* }} props
* @returns { Element }
*/
function ActivityOrderRow({date, order, timeSlot, timeSlots , websocket}){
 // State
 const [activity, setActivity] = useState(order.ordered_activity)
 const [comment, setComment] = useState(nullParser(order.comment))
 const [errorActivity, setErrorActivity] = useState("")
 // Functions
 function createOrder() {
   const orderedActivity = ParseDanishNumber(activity);
   if(isNaN(orderedActivity)){
     setErrorActivity("Aktiviten kan ikke læses som et tal")
     return;
   }
   if(orderedActivity <= 0){
     setErrorActivity("Der skal bestilles en positiv mængde MBq tracer");
     return;
   }
   const newOrder = new ActivityOrder(
     undefined, // activity_order_id
     orderedActivity, // ordered_activity
     dateToDateString(date), // deliveryDate
     1, // Status
     comment, // comment
     timeSlot.id, // ordered_time_slot
     null,
     null,
     null,
     null,
   )

   websocket.sendCreateActivityOrder(newOrder)
   setActivity("")
   setComment("")
   setErrorActivity("")
 }

 function updateOrder() {
   const newActivity = ParseDanishNumber(activity);
   if(isNaN(newActivity)){
     setErrorActivity("Aktiviten kan ikke læses som et tal")
     return;
   };

   if(newActivity <= 0){
     setErrorActivity("Der skal bestilles en positiv mængde MBq tracer");
     return;
   };
   const newOrder = {
     ...order
   };
   newOrder.ordered_activity = newActivity;
   newOrder.comment = comment;

   websocket.sendEditModel(JSON_ACTIVITY_ORDER, newOrder);
 }

 const ordered = order.status > 0

 const canEdit = order.status <= 1
 const changedActivity = !(order.ordered_activity === activity);
 const changedComment = !(nullParser(order.comment) === comment);

 let statusIcon;
 if(order.moved_to_time_slot){
   statusIcon = (<ClickableIcon src="static/images/move_top.svg"/>);
 } else if (ordered) {
   statusIcon = (<StatusIcon status={order.status}/>);
 } else {
   statusIcon = ""
 }

 let statusInfo
 if (order.moved_to_time_slot){
   const movedTimeSlot = timeSlots.get(order.moved_to_time_slot)
   statusInfo = `Rykket til ${movedTimeSlot.delivery_time}`;
 } else if (ordered) {
   statusInfo = `ID: ${order.id}`;
 } else {
   statusInfo = "Ny ordre";
 }

 const ActivityInput = canEdit ? <FormControl
   value={activity}
   onChange={(event) => {setActivity(event.target.value)}}
 /> : <FormControl value={activity} readOnly/>;

 const commentInput = canEdit ?  <Form.Control
     as="textarea"
     rows={1}
     value={comment}
     onChange={(event) => {setComment(event.target.value)}}
   /> : <Form.Control value={comment} readOnly/>

 const ActionImage = ordered ?
   <ClickableIcon src="/static/images/update.svg" onClick={updateOrder}/>
     : <ClickableIcon src="/static/images/cart.svg" onClick={createOrder}/>

 return <Row>
   <Col xs={1} style={cssCenter}>
     {statusIcon}
   </Col>
   <Col style={cssCenter} xs={1}>
     {statusInfo}
   </Col>
   <Col>
     <TracershopInputGroup label="Aktivitet">
       {ActivityInput}
       <InputGroup.Text>MBq</InputGroup.Text>
     </TracershopInputGroup>
   </Col>
   <Col>
     <TracershopInputGroup label="Kommentar">
       {commentInput}
     </TracershopInputGroup></Col>
   <Col xs={1} style={{
     justifyContent : 'right',
     display: 'flex',
   }}>
     {canEdit && (changedActivity || changedComment) ? ActionImage : ""}
   </Col>
 </Row>
}


/**
* This is a card, representing the users view of ActivityDeliveryTimeSlot
* It contains all ordered
* @param {{
*  timeSlot : ActivityProduction,
*  date : Date
*  overhead : Number
*  activityOrders: Array<ActivityOrder>,
*  websocket : TracerWebSocket,
*  timeSlots : Map<Number, ActivityProduction>
*  expiredDeadline : Boolean
* }} props - Input props
* @returns {Element}
*/
export function TimeSlotCard({timeSlot, activityOrders, websocket, date, timeSlots, overhead, expiredDeadline}){
 // State
 const [collapsed, setCollapsed] = useState(false)
 // Filter out irrelevant orders
 const /**@type {Array<ActivityOrder>} */ orderedActivityOrders = activityOrders.filter((_order) => {
   const /**@type {ActivityOrder} */ order = _order
   return order.ordered_time_slot === timeSlot.id
 });

 const /**@type {Array<ActivityOrder>} */ deliverableActivityOrders = activityOrders.filter((_order) => {
   const /**@type {ActivityOrder} */ order = _order
   const orderedHere = order.ordered_time_slot === timeSlot.id && (order.moved_to_time_slot === null)
   const movedToHere = order.moved_to_time_slot === timeSlot.id

   return orderedHere || movedToHere;
 });

 // This Component displays all order in their original positions
 const orderRows = orderedActivityOrders.map((order) => {
   return <ActivityOrderRow
     key={order.id}
     order={order}
     websocket={websocket}
     timeSlot={timeSlot}
     timeSlots={timeSlots}
     date={date}
     />
 })

 let header = <div></div>
 let timeSlotActivity = 0
 if(orderedActivityOrders.length){
   let minimumStatus = 5;
   for(const order of orderedActivityOrders){
     timeSlotActivity += order.ordered_activity
     minimumStatus = Math.min(minimumStatus, order.status);
   }
   header = <StatusIcon status={minimumStatus}/>
 }

 if(!expiredDeadline){
  orderRows.push(<ActivityOrderRow
    key={-1}
    order={{
      status : 0,
      ordered_activity : "",
      comment : "",
      moved_to_time_slot : null,
    }}
    date={date}
    timeSlot={timeSlot}
    timeSlots={timeSlots}
    websocket={websocket}
    />)
  }

 const CollapseImageClassName = collapsed ? SiteStyles.rotated : ""
 let deliveryActivity = 0
 const DeliveryHour = Number(timeSlot.delivery_time.substring(0,2))
 const DeliveryMinute = Number(timeSlot.delivery_time.substring(3,5))
 for(const order of deliverableActivityOrders){
   if(order.moved_to_time_slot === null){
     deliveryActivity += overhead * order.ordered_activity
   } else {
     const originalTimeSlot = timeSlots.get(order.ordered_time_slot);
     const originalHour = Number(originalTimeSlot.delivery_time.substring(0,2))
     const originalMinute = Number(originalTimeSlot.delivery_time.substring(3,5))

     const minuteDifference = (originalHour - DeliveryHour) * 60 + (originalMinute - DeliveryMinute)
   }
 }

 return (
 <Card style={{
   padding : '0px'
 }}>
   <Card.Header>
     <Row>
       <Col xs={1}>{header}</Col>
       <Col xs={2} style={cssCenter}>{timeSlot.delivery_time}</Col>
       <Col xs={3}>Bestilt: {timeSlotActivity} MBq</Col>
       <Col xs={3}>Til Udlevering: {deliveryActivity}</Col>
       <Col style={{
         justifyContent : 'right',
         display : 'flex',
       }}>
         <ClickableIcon
           className={CollapseImageClassName}
           src={"/static/images/next.svg"}
           onClick={() => {setCollapsed(!collapsed)}}
         />
       </Col>
     </Row>
   </Card.Header>
   <Collapse in={collapsed}>
     <Card.Body>
       {orderRows}
     </Card.Body>
   </Collapse>
 </Card>)
}

