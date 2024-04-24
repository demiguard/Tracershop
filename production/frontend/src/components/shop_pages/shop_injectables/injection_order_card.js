import React, { useState } from "react";
import { Card, Col, Form, Row } from "react-bootstrap";
import propTypes from 'prop-types';

import { nullParser } from "~/lib/formatting";
import { InjectionOrder, Tracer } from "~/dataclasses/dataclasses";
import { ClickableIcon, StatusIcon } from "../../injectable/icons";
import { Select, toOptions } from "../../injectable/select";
import { ORDER_STATUS, cssCenter } from "~/lib/constants";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { getTimeString } from "../../../lib/chronomancy";
import { UsageSelect } from "../../injectable/derived_injectables/usage_select";
import { parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { setTempObjectToEvent } from "~/lib/state_management";
import { InjectionOrderPDFUrl, compareLoosely } from "~/lib/utils";
import { EditableInput } from "~/components/injectable/inputs/editable_input";
import { CommitButton } from "~/components/injectable/commit_button";
import { Optional } from "~/components/injectable/optional";

/**
 * This is a card containing all the information on an injection order
 * It handles new orders as well as old, by the status indicator
 * It assumes that the parent have inputted the following fields in the order
 * * delivery_date
 * * endpoint
 * The backend is responsible for filling out the user who ordered it
 * @param {{
*  injection_order : InjectionOrder
*  injection_tracers : Array<Tracer>
*  valid_deadline : Boolean
* }} props
* @returns Element
*/
export function InjectionOrderCard({
  injection_order,
  injection_tracers,
  valid_deadline,
}) {
  // State
  const [tempInjectionOrder, setTempInjectionOrder] = useState(injection_order);
  const [errorInjections, setErrorInjections] = useState("")
  const [errorDeliveryTime, setErrorDeliveryTime] = useState("")

  function resetErrors(){
    setErrorInjections("");
    setErrorDeliveryTime("");
  }

  function resetState(){
    setTempInjectionOrder(injection_order);
    resetErrors();
  }

  function setDeliveryTime(value){
    setTempInjectionOrder((prevState) => {return {...prevState, delivery_time : value}});
  }

  function validate(){
    const [validInjections, injections] = parseWholePositiveNumber(tempInjectionOrder.injections, "Injektioner");
    const [validTimeInput, delivery_time] = parseTimeInput(tempInjectionOrder.delivery_time, "Leverings Tiden");

    if(!validInjections){
      setErrorInjections(injections);
    }

    if(!validTimeInput){
     setErrorDeliveryTime(delivery_time);
    }

    const valid = validInjections && validTimeInput;
    if(valid){
      if( 0 < injection_order.id){
        resetState();
      } else {
        resetErrors();
      }
    }

    return [valid, {...injection_order,
      tracer : Number(tempInjectionOrder.tracer),
      injections : injections,
      delivery_time : delivery_time,
      tracer_usage : Number(tempInjectionOrder.tracer_usage),
      status : ORDER_STATUS.ORDERED,
    }];
  }


  const changed = !compareLoosely(injection_order, tempInjectionOrder);

  const canEdit = injection_order.status <= 1 && valid_deadline;

  let statusInfo = "Ny ordre";
  const orderExists = 0 < injection_order.status;

  if(orderExists){
    statusInfo = `ID: ${injection_order.id}`;
  }

  const tracerOptions = toOptions(injection_tracers, 'shortname');
  const ActionButton = (() => {
    if(injection_order.status === ORDER_STATUS.RELEASED){
      return <ClickableIcon
        label={`to-delivery-${injection_order.id}`}
        src="/static/images/delivery.svg"
        onClick={()=>{
          window.location = InjectionOrderPDFUrl(injection_order);
        }}
      />
    }
    if(changed && valid_deadline){
      return <CommitButton
        temp_object={tempInjectionOrder}
        object_type={DATA_INJECTION_ORDER}
        label={`commit-${injection_order.id}`}
        validate={validate}
      />
    }
    if(!changed && valid_deadline && orderExists){
      return <ClickableIcon
        src="static/images/decline.svg"
      />
    }


    return "";
  })();

  return (
  <Card style={{padding : '0px'}}>
    <Card.Header>
      <Row>
        <Col xs={1}>
          <Optional exists={ORDER_STATUS.AVAILABLE < injection_order.status}>
            <StatusIcon order={injection_order}/>
          </Optional>
        </Col>
        <Col>
        <div style={{
          display : "ruby"
        }}>
          <TracershopInputGroup label="Tracer">
            <Select
              aria-label={`tracer-input-${injection_order.id}`}
              canEdit={canEdit}
              options={tracerOptions}
              onChange={setTempObjectToEvent(setTempInjectionOrder, 'tracer')}
              value={tempInjectionOrder.tracer}
              />
          </TracershopInputGroup>
          </div>
        </Col>
        <Col>
          <TracershopInputGroup label="Injectioner">
            <ErrorInput error={errorInjections}>
              <EditableInput
                aria-label={`injections-input-${injection_order.id}`}
                canEdit={canEdit}
                value={tempInjectionOrder.injections}
                onChange={setTempObjectToEvent(setTempInjectionOrder, 'injections')}
              />
            </ErrorInput>
          </TracershopInputGroup>
        </Col>
        <Optional exists={injection_order.status === ORDER_STATUS.RELEASED}>
          <Col>
            <TracershopInputGroup label="Frigivet kl:">
              <Form.Control
                aria-label={`freed-datetime-${injection_order.id}`}
                value={getTimeString(injection_order.freed_datetime)}
                readOnly
              />
           </TracershopInputGroup>
          </Col>
        </Optional>
        <Col xs={1}></Col>
      </Row>
      <Row>
        <Col xs={1} style={cssCenter} >{statusInfo}</Col>
        <Col>
          <TracershopInputGroup label={"Tid"}>
            <ErrorInput error={errorDeliveryTime}>
              <TimeInput
                aria-label={`delivery-time-input-${injection_order.id}`}
                value={tempInjectionOrder.delivery_time}
                canEdit={canEdit}
                stateFunction={setDeliveryTime}
              />
            </ErrorInput>
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label={"Brug"}>
            <UsageSelect
              aria-label={`usage-input-${injection_order.id}`}
              onChange={setTempObjectToEvent(setTempInjectionOrder, 'tracer_usage')}
              value={tempInjectionOrder.tracer_usage}
              canEdit={canEdit}
            />
          </TracershopInputGroup>
        </Col>
        <Optional exists={injection_order.status === ORDER_STATUS.RELEASED}>
          <Col>
            <TracershopInputGroup label="lot:">
              <Form.Control
                aria-label={`lot-number-input-${injection_order.id}`}
                value={nullParser(injection_order.lot_number)}
                readOnly/>
             </TracershopInputGroup>
          </Col>
        </Optional>
        <Col xs={1}>
          {ActionButton}
        </Col>
      </Row>
    </Card.Header>
  </Card>);
}

InjectionOrderCard.propTypes = {
  injection_order : propTypes.instanceOf(InjectionOrder).isRequired,
  injection_tracers : propTypes.arrayOf(propTypes.instanceOf(Tracer)).isRequired,
  valid_deadline : propTypes.bool.isRequired,
}