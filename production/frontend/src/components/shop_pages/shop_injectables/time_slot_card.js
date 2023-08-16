import React, { useEffect, useState } from "react";

import { ActivityOrder, ActivityDeliveryTimeSlot, Vial, Isotope } from "../../../dataclasses/dataclasses";
import { ParseDanishNumber, dateToDateString, nullParser } from "../../../lib/formatting";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { JSON_ACTIVITY_ORDER, JSON_ISOTOPE, JSON_TRACER, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_COMMIT, PROP_ON_CLOSE, cssCenter } from "../../../lib/constants";
import { ClickableIcon, StatusIcon } from "../../injectable/icons";
import { Card, Collapse, Col, Form, FormControl, InputGroup, Row } from "react-bootstrap";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";

import SiteStyles from '../../../css/Site.module.css'
import { CalculatorModal } from "../../modals/calculator_modal";
import { combineDateAndTimeStamp, getTimeString } from "../../../lib/chronomancy";

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

 useEffect(() => {
    setActivity(order.ordered_activity)
    setComment(order.comment)

    return () => {}
 }, [order])
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
*  activeTracer : Tracer
*  date : Date
*  overhead : Number
*  activityOrders: Array<ActivityOrder>,
*  websocket : TracerWebSocket,
*  timeSlots : Map<Number, ActivityProduction>
*  validDeadline : Boolean
*  Isotopes : Map<Number, Isotope>
*  vials : Map<Number, Vial>
* }} props - Input props
* @returns {Element}
*/
export function TimeSlotCard({
  timeSlot,
  isotopes,
  activityOrders,
  activeTracer,
  websocket,
  date,
  timeSlots,
  overhead,
  validDeadline,
  vials
}){
  // State
  const [collapsed, setCollapsed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [newOrder, _setNewOrderActivity] = useState({
    status : "",
    ordered_activity : "",
    comment : "",
    moved_to_time_slot : "",
  }); // This is a new object because otherwise react rendering engine fucks up

  function setNewOrderActivity(newActivity){
    _setNewOrderActivity({...newOrder, ordered_activity : Math.floor(newActivity)});
  }
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
  let minimumStatus = 5;
  if(orderedActivityOrders.length){
    for(const order of orderedActivityOrders){
      timeSlotActivity += order.ordered_activity
      minimumStatus = Math.min(minimumStatus, order.status);
    }
    header = <StatusIcon status={minimumStatus}/>
  }

  if(validDeadline){
    orderRows.push(<ActivityOrderRow
      key={-1}
      order={newOrder}
      date={date}
      timeSlot={timeSlot}
      timeSlots={timeSlots}
      websocket={websocket}
    />)
  }

  const CollapseImageClassName = collapsed ? SiteStyles.rotated : ""
  const orderIds = [];
  let deliveryActivity = 0;
  let freedActivity = 0;
  let freedTime = ""
  const DeliveryHour = Number(timeSlot.delivery_time.substring(0,2))
  const DeliveryMinute = Number(timeSlot.delivery_time.substring(3,5))
  for(const order of deliverableActivityOrders){
    if(freedTime === "" && order.status === 3){
      freedTime = getTimeString(order.freed_datetime)
    }
    orderIds.push(order.id);

    if(order.moved_to_time_slot === null){
      deliveryActivity += overhead * order.ordered_activity
    } else {
      const originalTimeSlot = timeSlots.get(order.ordered_time_slot);
      const originalHour = Number(originalTimeSlot.delivery_time.substring(0,2))
      const originalMinute = Number(originalTimeSlot.delivery_time.substring(3,5))

      const minuteDifference = (originalHour - DeliveryHour) * 60 + (originalMinute - DeliveryMinute)
    }
  }

  for(const vial of vials.values()){
    if(orderIds.includes(vial.assigned_to)){
      freedActivity += vial.activity;
    }
  }

  //  Card Content
  let thirdColumnContent = "";
  let fourthColumnContent = "";
  let fifthColumnContent = "";

  if(minimumStatus == 3){
    thirdColumnContent = `Udleveret ${freedActivity} MBq`;
    fourthColumnContent = `Frigivet kl ${freedTime}`;
    fifthColumnContent = <ClickableIcon src="static/images/delivery.svg"
      onClick={() => {
        window.location.replace(
          `/`
        )
      }}
    />
  } else {
    thirdColumnContent = `Bestilt: ${timeSlotActivity} MBq`
    fourthColumnContent = `Til Udlevering: ${Math.floor(deliveryActivity)} MBq`
    if(validDeadline){
      fifthColumnContent = <ClickableIcon
                        style={{
                          display : "inline-block",
                          marginLeft : "15px",
                          marginRight : "15px",
                        }}
                        className={SiteStyles.Margin15lr}
                        key={-1}
                        onClick={() => {setShowCalculator(!showCalculator)}}
                        src="static/images/calculator.svg"/>
    } else {
      fifthColumnContent = ""
    }

  }


  const calculatorProps = {}
  calculatorProps[PROP_ACTIVE_DATE] = combineDateAndTimeStamp(date,
                                                              timeSlot.delivery_time)
  calculatorProps[JSON_ISOTOPE] = isotopes;
  calculatorProps[PROP_ON_CLOSE] = () => {setShowCalculator(false);}
  calculatorProps[PROP_ACTIVE_TRACER] = activeTracer;
  calculatorProps[PROP_COMMIT] = (activity) => {
    setNewOrderActivity(String(activity))
  }
  calculatorProps.initial_MBq = 300


  return (
  <Card style={{
   padding : '0px'
  }}>
    {showCalculator ? <CalculatorModal
                        {...calculatorProps}
    /> : ""}
  <Card.Header>
    <Row>
      <Col xs={1} style={cssCenter}>{header}</Col>
      <Col xs={2} style={cssCenter}>{timeSlot.delivery_time}</Col>
      <Col xs={3} style={cssCenter}>{thirdColumnContent}</Col>
      <Col xs={3} style={cssCenter}>{fourthColumnContent}</Col>
      <Col style={cssCenter}> {fifthColumnContent}</Col>
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

