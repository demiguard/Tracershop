import React, { useState } from "react";
import { FormatTime, ParseDanishNumber, nullParser } from "../../../lib/formatting";
import { InjectionOrder, Tracer } from "../../../dataclasses/dataclasses";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { ClickableIcon, StatusIcon } from "../../injectable/icons";
import { Select, toOptionsFromEnum } from "../../injectable/select";
import { Card, Col, Form, Row } from "react-bootstrap";
import { ERROR_BACKGROUND_COLOR, INJECTION_USAGE, JSON_INJECTION_ORDER, cssCenter } from "../../../lib/constants";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { getTimeString } from "../../../lib/chronomancy";

/**
 * This is a card containing all the information on an injection order
 * It handles new orders as well as old, by the status indicator
 * It assumes that the parent have inputted the following fields in the order
 * * delivery_date
 * * endpoint
 * The backend is responsible for filling out the user who ordered it
 * @param {{
*  injectionOrder : InjectionOrder
*  injectionTracers : Array<Tracer>
*  websocket : TracerWebSocket
*  validDeadline : Boolean
* }} props 
* @returns Element
*/
export function InjectionOrderCard({
  injectionOrder,
  injectionTracers,
  websocket,
  validDeadline,
}) {
 // State
 const [tracer, setTracer] = useState(injectionOrder.tracer);
 const [injections, setInjections] = useState(injectionOrder.injections);
 const [errorInjections, setErrorInjections] = useState("")
 const [deliveryTime, setDeliveryTime] = useState(injectionOrder.delivery_time);
 const [errorDeliveryTime, setErrorDeliveryTime] = useState("")
 const [usage, setUsage] = useState(injectionOrder.tracer_usage)

 function resetErrors(){
   setErrorInjections("");
   setErrorDeliveryTime("");
 }

 function resetState(){
   setTracer(injectionTracers.tracer);
   setInjections(injectionOrder.injections);
   setDeliveryTime(injectionOrder.delivery_time);
   setUsage(injectionOrder.tracer_usage)

   resetErrors();
 }

 function validateState(){
   const numberInjections = ParseDanishNumber(injections);
   if(isNaN(numberInjections)){
     setErrorInjections("Antal injectioner er ikke et tal.");
   }
   if(numberInjections <= 0){
     setErrorInjections("Der skal bestilles et positivt antal injektioner.");
   }

   if(numberInjections != Math.floor(numberInjections)){
     setErrorInjections("Du kan ikke bestille fraktioner af injektioner.");

   }

   const formattedDeliveryTime = FormatTime(deliveryTime);
   if(formattedDeliveryTime === null){
     setErrorDeliveryTime("Tiden er ikke formateret korrekt.");
   }

   return errorInjections === "" && errorDeliveryTime === "";
 }

 function createInjectionOrder(){
   if(!validateState()){
     return
   }
   const numberInjections = ParseDanishNumber(injections)
   const delivery_time = FormatTime(deliveryTime)
   const newOrder = {...injectionOrder,
     tracer : tracer,
     injections : numberInjections,
     delivery_time : delivery_time,
     tracer_usage : usage,
   };

   websocket.sendCreateInjectionOrder(newOrder);
   resetState();
 }

 function editInjectionOrder(){
   if(!validateState()){
     return;
   }

   const numberInjections = ParseDanishNumber(injections);
   const delivery_time = FormatTime(deliveryTime);
   const newOrder = {...injectionOrder,
     tracer : tracer,
     injections : numberInjections,
     delivery_time : delivery_time,
     tracer_usage : usage,
   };

   websocket.sendEditModel(JSON_INJECTION_ORDER, [newOrder]);
   resetErrors();
 }

 const changed = !(injectionOrder.tracer === tracer
                 && nullParser(injectionOrder.injections) === injections
                 && nullParser(injectionOrder.delivery_time) === deliveryTime
                 && injectionOrder.tracer_usage === usage)

 const canEdit = injectionOrder.status <= 1 && !validDeadline;

 let statusIcon = ""
 if(0 < injectionOrder.status){
   statusIcon = <StatusIcon status={injectionOrder.status}></StatusIcon>
 }

 let statusInfo = "Ny ordre"
 if(0 < injectionOrder.status){
   statusInfo = `ID: ${injectionOrder.id}`
 }

 const tracerOptions = injectionTracers.map((tracer) => {
   return {
     id : tracer.id,
     name : tracer.shortname
   }
 });

 let tracerSelect = <Select
                       options={tracerOptions}
                       nameKey={'name'}
                       valueKey={'id'}
                       disabled
                       onChange={(event) => {setTracer(Number(event.target.value))}}
                       value={tracer}
                    />;

 if(canEdit){
   tracerSelect = <Select
     options={tracerOptions}
     nameKey={'name'}
     valueKey={'id'}
     onChange={(event) => {setTracer(Number(event.target.value))} /** This is ok because */}
     value={tracer}
   />;
 }

 let injectionForm = <Form.Control readOnly value={injections}/>;
 if(canEdit){
   injectionForm = <Form.Control
                     value={injections}
                     onChange={(event) =>
                                 {setInjections(event.target.value)}}
                   />;
   if (errorInjections){
     injectionForm = <Form.Control
                       style={{
                         backgroundColor : ERROR_BACKGROUND_COLOR,
                       }}
                       value={injections}
                       onChange={(event) =>
                                   {setInjections(event.target.value)}}
                     />;
   }
 }

 let deliveryTimeForm = <Form.Control readOnly value={deliveryTime}/>
 if(canEdit){
   deliveryTimeForm = <Form.Control
                         value={deliveryTime}
                         onChange={(event) =>
                                     {setDeliveryTime(event.target.value)}}
                      />;
   if(errorDeliveryTime){
     deliveryTimeForm = <Form.Control
                           style = {{
                             backgroundColor : ERROR_BACKGROUND_COLOR,
                           }}
                           value={deliveryTime}
                           onChange={(event) =>
                                       {setDeliveryTime(event.target.value)}}
                        />;
   }
 }


 const usageOptions = toOptionsFromEnum(INJECTION_USAGE)


  let usageSelect = <Select
    options={usageOptions}
    nameKey={'name'}
    valueKey={'id'}
    onChange={(event) => {setUsage(Number(event.target.value))}}
    value={usage}
    disabled
  />
  if(canEdit){
    usageSelect = <Select
      options={usageOptions}
      nameKey={'name'}
      valueKey={'id'}
      onChange={(event) => {setUsage(Number(event.target.value))}}
      value={usage}
    />
  }

 let ActionButton = <ClickableIcon
   src="static/images/update.svg"
   onClick={editInjectionOrder}
 />
 if(injectionOrder.status === 0){
   ActionButton = <ClickableIcon
     src="static/images/cart.svg"
     onClick={createInjectionOrder}
   />
 }

 return (
 <Card style={{padding : '0px'}}>
   <Card.Header>
     <Row>
       <Col xs={1}>{statusIcon}</Col>
       <Col>
         <TracershopInputGroup label="Tracer">
           {tracerSelect}
         </TracershopInputGroup>
       </Col>
       <Col>
         <TracershopInputGroup label="Injectioner">
           {injectionForm}
         </TracershopInputGroup>
       </Col>
       { injectionOrder.status === 3 ? <Col>
        <TracershopInputGroup label="Frigivet kl:">
          <Form.Control value={getTimeString(injectionOrder.freed_datetime)} readOnly/>
          </TracershopInputGroup>
       </Col> : ""}
       <Col xs={1}></Col>
     </Row>
     <Row>
       <Col xs={1} style={cssCenter} >{statusInfo}</Col>
       <Col>
         <TracershopInputGroup label={"Tid"}>
           {deliveryTimeForm}
         </TracershopInputGroup>
       </Col>
       <Col>
         <TracershopInputGroup label={"Brug"}>
           {usageSelect}
         </TracershopInputGroup>
       </Col>
       { injectionOrder.status === 3 ? <Col>
         <TracershopInputGroup label="lot:">
          <Form.Control value={injectionOrder.lot_number} readOnly/>
          </TracershopInputGroup>
       </Col> : ""}
       <Col xs={1}>
         {(changed) ? ActionButton : ""}
       </Col>
     </Row>
   </Card.Header>
 </Card>)
}
