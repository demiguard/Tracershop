import React, { useState } from "react";
import { FormatTime, ParseDanishNumber, nullParser } from "~/lib/formatting";
import { InjectionOrder, Tracer } from "~/dataclasses/dataclasses";
import { TracerWebSocket } from "~/lib/tracer_websocket";
import { ClickableIcon, StatusIcon } from "../../injectable/icons";
import { Select, toOptions } from "../../injectable/select";
import { Card, Col, Form, Row } from "react-bootstrap";
import { ERROR_BACKGROUND_COLOR, INJECTION_USAGE, ORDER_STATUS, cssCenter } from "~/lib/constants";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { getTimeString } from "../../../lib/chronomancy";
import { UsageSelect } from "../../injectable/derived_injectables/usage_select";
import { parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { setStateToEvent } from "~/lib/state_management";
import { InjectionOrderPDFUrl } from "~/lib/utils";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { EditableInput } from "~/components/injectable/inputs/number_input";

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
  validDeadline,
}) {
  const state = useTracershopState();
  const websocket = useWebsocket();

  // State
  const [tracer, setTracer] = useState(injectionOrder.tracer);
  const [injections, setInjections] = useState(injectionOrder.injections);
  const [errorInjections, setErrorInjections] = useState("")
  const [deliveryTime, setDeliveryTime] = useState(injectionOrder.delivery_time);
  const [errorDeliveryTime, setErrorDeliveryTime] = useState("")
  const [usage, setUsage] = useState(injectionOrder.tracer_usage)
  const endpoint = state.delivery_endpoint.get(injectionOrder.endpoint);

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
    const [validInjections, numInjections] = parseWholePositiveNumber(injections, "Injektioner");
    const [validTimeInput, timeInput] = parseTimeInput(deliveryTime, "Leverings Tiden");

    if(!validInjections){
      setErrorInjections(numInjections);
    }

    if(!validTimeInput){
     setErrorDeliveryTime(timeInput);
    }

    return validInjections && validTimeInput;
  }

  function createInjectionOrder(){
    if(!validateState()){
      return;
    }
    // Whoo double calculations - It's a smell, but boy it's insignificant
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
    // Whoo double calculations - It's a smell, but boy it's insignificant
    const numberInjections = ParseDanishNumber(injections);
    const delivery_time = FormatTime(deliveryTime);
    const newOrder = {...injectionOrder,
      tracer : tracer,
      injections : numberInjections,
      delivery_time : delivery_time,
      tracer_usage : usage,
    };

    websocket.sendEditModel(DATA_INJECTION_ORDER, [newOrder]);
    resetErrors();
  }

  const changed = !(injectionOrder.tracer === tracer
                  && nullParser(injectionOrder.injections) === injections
                  && nullParser(injectionOrder.delivery_time) === deliveryTime
                  && injectionOrder.tracer_usage === usage);

  const canEdit = injectionOrder.status <= 1 && !validDeadline;

  let statusIcon = "";
  if(0 < injectionOrder.status){
    statusIcon = <StatusIcon status={injectionOrder.status}></StatusIcon>;
  }

  let statusInfo = "Ny ordre";
  if(0 < injectionOrder.status){
    statusInfo = `ID: ${injectionOrder.id}`;
  }

  const tracerOptions = toOptions(injectionTracers, 'shortname');


  const ActionButton = (() => {
    if(injectionOrder.status === ORDER_STATUS.AVAILABLE && changed){
      return <ClickableIcon
        src="static/images/cart.svg"
        onClick={createInjectionOrder}
      />
    }
    if(injectionOrder.status === ORDER_STATUS.RELEASED){
      return <ClickableIcon
        src="/static/images/delivery.svg"
        onClick={()=>{
          window.location = InjectionOrderPDFUrl(injectionOrder);
        }}
      />
    }
    if(injectionOrder.status === ORDER_STATUS.ORDERED && changed){
      return <ClickableIcon
      src="static/images/update.svg"
      onClick={editInjectionOrder}
    />}
    return "";
  })();

  return (
  <Card style={{padding : '0px'}}>
    <Card.Header>
      <Row>
        <Col xs={1}>{statusIcon}</Col>
        <Col>
          <TracershopInputGroup label="Tracer">
            <Select
              canEdit={canEdit}
              options={tracerOptions}
              onChange={setStateToEvent(setTracer)}
              value={tracer}
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label="Injectioner">
            <ErrorInput error={errorInjections}>
              <EditableInput
                canEdit={canEdit}
                value={injections}
                onChange={setStateToEvent(setInjections)}
              />

            </ErrorInput>
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
            <ErrorInput error={errorDeliveryTime}>
              <TimeInput
                value={deliveryTime}
                canEdit={canEdit}
                stateFunction={setDeliveryTime}
              />
            </ErrorInput>
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label={"Brug"}>
            <UsageSelect
              onChange={setStateToEvent(setUsage)}
              value={usage}
              canEdit={canEdit}
            />
          </TracershopInputGroup>
        </Col>
        { injectionOrder.status === 3 ? <Col>
          <TracershopInputGroup label="lot:">
            <Form.Control value={injectionOrder.lot_number} readOnly/>
           </TracershopInputGroup>
        </Col> : ""}
        <Col xs={1}>
          {ActionButton}
        </Col>
      </Row>
    </Card.Header>
  </Card>);
}
