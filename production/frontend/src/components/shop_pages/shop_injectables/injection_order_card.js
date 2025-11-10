import React, { useEffect, useState } from "react";
import { Card, Col, Form, FormControl, Row } from "react-bootstrap";
import propTypes from 'prop-types';

import { nullParser } from "~/lib/formatting";
import { InjectionOrder, Tracer } from "~/dataclasses/dataclasses";
import { ClickableIcon, InjectionDeliveryIcon, StatusIcon } from "~/components/injectable/icons.tsx";
import { Select, toOptions } from "../../injectable/select";
import { ORDER_STATUS } from "~/lib/constants";
import { cssCenter } from "~/lib/styles";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { getTimeString } from "../../../lib/chronomancy";
import { UsageSelect } from "../../injectable/derived_injectables/usage_select";
import { parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { setTempObjectToEvent } from "~/lib/state_management";
import { InjectionOrderPDFUrl, compareLoosely, nullify } from "~/lib/utils";
import { EditableInput } from "~/components/injectable/inputs/editable_input";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { Optional } from "~/components/injectable/optional";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { ShopActionButton } from "~/components/injectable/buttons/shop_action_button";

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
  const state = useTracershopState();
  const websocket = useWebsocket();

  function resetErrors(){
    setErrorInjections("");
    setErrorDeliveryTime("");
  }

  function resetState(){
    setTempInjectionOrder(injection_order);
    resetErrors();
  }

  function setDeliveryTime(value){
    setTempInjectionOrder(
      (prevState) => {return {...prevState, delivery_time : value}}
    );
  }

  function deleteOrder(){
    websocket.sendDeleteModels(DATA_INJECTION_ORDER, [injection_order]);
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
      comment : nullify(tempInjectionOrder.comment)
    }];
  }

  useEffect(function updateNewTracerSelection() {
    const current_tracer = tempInjectionOrder.tracer;

    for(const tracer of injection_tracers){
      if (tracer.id === current_tracer){
        return;
      }
    }
    const newCurrent = injection_tracers.length
      ? injection_tracers[0].id : undefined;

    setTempInjectionOrder(inj_order => {
      return {
        ...inj_order,
        tracer : newCurrent
      };
    });
  },[injection_tracers]);

  useEffect(function updateInjectionOrder() {
    setTempInjectionOrder(inj => {
      return {
        ...inj,
        ...injection_order
      }
    });
  },[injection_order]);

  const changed = !compareLoosely(injection_order, tempInjectionOrder);
  const canEdit = [ORDER_STATUS.AVAILABLE, ORDER_STATUS.ORDERED].includes(injection_order.status) && valid_deadline;
  const orderExists = !([ORDER_STATUS.AVAILABLE, ORDER_STATUS.UNAVAILABLE].includes(injection_order.status));
  const statusInfo = orderExists ? `ID: ${injection_order.id}` : "Ny ordre";

  const tracerOptions = toOptions(injection_tracers, 'shortname');
  const tempTracer = state.tracer.get(injection_order.tracer);


  return (
  <Card style={{padding : '0px'}}>
    <Card.Header>
      <Row>
        <Col xs={1} style={{alignItems : "center", justifyContent : "center", display : "flex"}}>
          <StatusIcon order={injection_order}/>
        </Col>
        <Col>
          <TracershopInputGroup readOnly={!canEdit} label="Tracer">
            <Select
              aria-label={`tracer-input-${injection_order.id}`}
              canEdit={canEdit}
              options={tracerOptions}
              onChange={setTempObjectToEvent(setTempInjectionOrder, 'tracer')}
              value={tempInjectionOrder.tracer}
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup readOnly={!canEdit} label="Injektioner">
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
            <TracershopInputGroup readOnly={!canEdit} label="Frigivet kl:">
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
        <Col xs={3}>
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
        <Col xs={3}>
          <TracershopInputGroup label={"Brug"}>
            <UsageSelect
              aria-label={`usage-input-${injection_order.id}`}
              onChange={setTempObjectToEvent(setTempInjectionOrder, 'tracer_usage')}
              value={tempInjectionOrder.tracer_usage}
              canEdit={canEdit}
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <Optional exists={!!(canEdit || tempInjectionOrder.comment)}>
            <TracershopInputGroup label="Kommentar">
              <EditableInput
                canEdit={canEdit}
                data-testid={`comment-${injection_order.id}`}
                as="textarea"
                rows={1}
                value={nullParser(tempInjectionOrder.comment)}
                onChange={setTempObjectToEvent(setTempInjectionOrder, 'comment')}
                />
            </TracershopInputGroup>
          </Optional>
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
        <Col xs={1} style={{
          alignItems : "center",
          display : "flex"
        }}>
          <ShopActionButton
            order={injection_order}
            label={`inj-action-${injection_order.id}`}
            validate={validate}
            isDirty={changed}
          />
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
