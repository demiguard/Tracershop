import React, { Component, useState } from "react";
import { Modal, Button, Form, FormControl, InputGroup, Row, Container } from "react-bootstrap";
import { Calculator } from "../injectable/calculator";
import { ParseDanishNumber, dateToDateString } from "../../lib/formatting";
import { LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_TRACER,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_ACTIVITY_ORDER, JSON_CUSTOMER, PROP_ON_CLOSE, PROP_WEBSOCKET, JSON_TRACER, PROP_ACTIVE_TRACER, JSON_ISOTOPE, WEBSOCKET_MESSAGE_MODEL_CREATE, PROP_ACTIVE_DATE, DATABASE_CURRENT_USER, AUTH_USER_ID, PROP_TIME_SLOT_MAPPING, JSON_ENDPOINT, JSON_DELIVER_TIME } from "../../lib/constants.js"

import { ActivityDeliveryTimeSlot, ActivityOrder, Customer } from "../../dataclasses/dataclasses";


import styles from '../../css/Site.module.css'
import { HoverBox } from "../injectable/hover_box";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { ClickableIcon } from "../injectable/icons";
import { Select } from "../injectable/select"
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box"
import { TracershopInputGroup } from '../injectable/tracershop_input_group'
import { combineDateAndTimeStamp } from "../../lib/chronomancy";


export function CreateOrderModal(props) {
  const /**@type {Map<Number, Map<Number, Array<ActivityDeliveryTimeSlot>>>} */ TimeSlotMapping = props[PROP_TIME_SLOT_MAPPING]

  let endpointInit, customerInit, timeSlotIdInit
  for(const [customerID, endpointMap] of TimeSlotMapping){
    customerInit = customerID
    for(const [endpointID, timeSlotOptions] of endpointMap){
      if(timeSlotOptions.length){
        endpointInit = endpointID
        timeSlotIdInit = timeSlotOptions[0].id
        break
      }
    }
    break;
  }

  const [state, _setState] = useState({
    amount : "",
    customerID : customerInit,
    endpointID : endpointInit,
    error : {
      missingEndpoint : "",
      missingTimeSlot : "",
      invalidOrder : "",
    },
    showCalculator : false,
    timeSlotID : timeSlotIdInit,
  })

  function setState(newState){
    _setState({...state, ...newState})
  }


  function createOrder(_event){
    const amountNumber = ParseDanishNumber(state.amount);
    if(isNaN(amountNumber)){
      setState({
        error : {...state.error,
                invalidOrder : "Aktiviteten er ikke et tal!",
        }
      });
      return;
    }

    if(amountNumber <= 0){
      setState({
        error : {...state.error,
                invalidOrder : "Aktiviteten er skal være positiv!",
        }
      });
      return;
    }

    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
    const skeleton = new ActivityOrder(undefined, // order_id
                                       amountNumber, // ordered_activity
                                       dateToDateString(props[PROP_ACTIVE_DATE]), // delivery_Date
                                       1, // status
                                       "", // comment
                                       state.timeSlotID, // ordered_time_Slot
                                       null, // moved_to_time_slot
                                       null, // ordered_by, set by backend
                                       null, // freed_by
    );

    message[WEBSOCKET_DATA] = skeleton;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    props[PROP_WEBSOCKET].send(message);
    props[PROP_ON_CLOSE]();
  }

  function changeCustomer(event){
    const newCustomerID = Number(event.target.value)
    let endpointMap = TimeSlotMapping.get(newCustomerID)
    if(endpointMap === undefined){
      const customer = props[JSON_CUSTOMER].get(newCustomerID)
      const newError = {...state.error}
      newError.missingEndpoint = `Kunden ${customer.short_name} har ikke nogen leveringsteder`
      setState({error : newError, customerID : newCustomerID})
      return
    }

    let endpointInit, timeSlotIdInit
    for(const [endpointID, timeSlots] of endpointMap){
      endpointInit = endpointID

      if (endpointID === undefined){
        const customer = props[JSON_CUSTOMER].get(newCustomerID)
        const newError = {...state.error}
        newError.missingEndpoint = `Kunden ${customer.short_name} har ikke nogen leveringsteder`
        setState({error : newError, customerID : newCustomerID})
        return
      }

      if (timeSlots.length === 0){
        const customer = props[JSON_CUSTOMER].get(newCustomerID)
        const newError = {...state.error}
        newError.missingTimeSlot = `Kunden ${customer.short_name} har ikke nogen leveringstidpunkter`
        setState({error : newError, endpointID : endpointID,  customerID : newCustomerID})
        return
      }

      timeSlotIdInit = timeSlots[0].id
      break;
    }

    setState({
      customerID : newCustomerID,
      endpointID : endpointInit,
      error : {
        ...state.error,
        missingEndpoint : "",
        missingTimeSlot : ""
      },
      timeSlotID : timeSlotIdInit,
    })
  }

  function changeEndpoint(event){
    const newEndpointID = Number(event.target.value);
    const newEndpoint = props[JSON_ENDPOINT].get(newEndpointID);
    const endpointMap = TimeSlotMapping.get(newEndpoint.owner);
    const timeSlots = endpointMap.get(newEndpointID);

    if (timeSlots.length === 0){
      const customer = props[JSON_CUSTOMER].get(state.customerID)
      const newError = {...state.error}
      newError.missingTimeSlot = `Kunden ${customer.short_name} har ikke nogen leveringstidpunkter`
      setState({error : newError, endpointID : newEndpointID})
      return
    }

    setState({endpointID : newEndpointID})
  }

  function hasError() {
    return state.error.invalidOrder != "" || state.error.missingEndpoint != "" || state.error.missingTimeSlot != "";
  }

  function getErrorMessage(){
    const errors = [...Object.values(state.error)].map((errorMessage, i) => {
      if(!errorMessage){
        return <div key={i}/>
      }
      return <p key={i}>{errorMessage}</p>
    })
    return (<div>{errors}</div>)
  }

  function getErrorLevel(){
    if(!(state.error.invalidOrder)){
      return ERROR_LEVELS.error
    }
    if(!(state.error.missingEndpoint && state.error.missingTimeSlot)){
      return ERROR_LEVELS.warning
    }
    return ""
  }

  function commitCalculator(activity){
    setState({
      showCalculator : false,
      amount : activity
    })
  }

  const Tracer = props[JSON_TRACER].get(props[PROP_ACTIVE_TRACER])

  const customerOptions = [...TimeSlotMapping.keys()].filter(
    (customerID) => {
      const condition_1 = props[JSON_CUSTOMER].has(customerID)

      return condition_1
    }
  ).map(
    (customerID) => {
      const /**@type {Customer} */ customer = props[JSON_CUSTOMER].get(customerID);
      return {
        id : customer.id,
        name : customer.short_name,
      }
    }
  );

  let endpointForm
  const endpointMap = TimeSlotMapping.get(state.customerID);

  if(endpointMap === undefined){
    const customer = props[JSON_CUSTOMER].get(state.customerID);
    setState({
      error : {...state.error,
        missingEndpoint : `Kunden ${customer.short_name} har ingen levering steder.`,
      }
    });
  } else {
      const endpointOptions = [...endpointMap.keys()].map(
        (endpointID) => {
        const endpoint = props[JSON_ENDPOINT].get(endpointID)
        return {
          id : endpoint.id,
          name : endpoint.name,
        }
      })

      if (1 == endpointOptions.length){
        endpointForm = <FormControl
                          value={endpointOptions[0].name}
                          aria-label={"endpoint-select"}
                          readOnly/>
    }
    else if (1 < endpointOptions.length){
      endpointForm = <Select
        options={endpointOptions}
        nameKey="name"
        valueKey="id"
        onChange={changeEndpoint}
        value={state.endpointID}
        aria-label={"endpoint-select"}
      />
    } else {
      const customer = props[JSON_CUSTOMER].get(state.customerID)
      setState({
        error : {...state.error,
          missingEndpoint : `Kunden ${customer.short_name} har ingen levering steder.`,
        }
      })
    }
  }

  let activityTimeSlotForm

  const ActivityTimeSlots = endpointMap.get(state.endpointID);
  // If statement for setting form
  if(state.error.missingTimeSlot == "" && ActivityTimeSlots != undefined){
    const ActivityOptions = ActivityTimeSlots.map(
      (activityDeliveryTimeSlot) => { return {
        id : activityDeliveryTimeSlot.id,
        name : activityDeliveryTimeSlot.delivery_time
    }})
    if (ActivityOptions.length == 1){
      activityTimeSlotForm = <FormControl readOnly value={ActivityOptions[0].name}></FormControl>
    } else if(1 < ActivityOptions.length){
      activityTimeSlotForm = <Select
                                aria-label="time-slot-select"
                                options={ActivityOptions}
                                valueKey="id"
                                nameKey="name"
                                value={state.timeSlotID}
                                onChange={
                                  (event) => {setState({
                                    timeSlotID : Number(event.target.value)
                                    })
                                    }
                                  }
                             />
    }
  } else {
    activityTimeSlotForm = <div/>
  }

  const /**@type {ActivityDeliveryTimeSlot} */ currentTimeSlot = props[JSON_DELIVER_TIME].get(state.timeSlotID);
  // This date doesn't matter since showing the calculator should be impossible
  let deliveryDateTime = new Date()
  if(currentTimeSlot){
    deliveryDateTime = combineDateAndTimeStamp(props[PROP_ACTIVE_DATE], currentTimeSlot.delivery_time)
  }

  const canShowActivityInput = currentTimeSlot !== undefined

  return (
      <Modal
        show={true}
        onHide={props[PROP_ON_CLOSE]}
        className={styles.mariLight}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          { state.showCalculator ?
          <Calculator
            isotopes={props[JSON_ISOTOPE]}
            tracer={Tracer}
            productionTime={deliveryDateTime}
            defaultMBq={300}
            cancel={() => {setState({showCalculator: false})}}
            commit={commitCalculator}
          /> :
          <Container>
            <Row className={styles.Margin15tb}>
              <TracershopInputGroup label="Kunde">
                <Select
                  options={customerOptions}
                  valueKey="id"
                  nameKey="name"
                  onChange={changeCustomer}
                  value={state.customerID}
                  aria-label={"customer-select"}
                />
              </TracershopInputGroup>
              <TracershopInputGroup label="Leverings Sted">
                {endpointForm}
              </TracershopInputGroup>
              <TracershopInputGroup label="Kørsel">
                {activityTimeSlotForm}
              </TracershopInputGroup>

              { canShowActivityInput ?
              <TracershopInputGroup label="Aktivitet">
                <FormControl
                  aria-label={"activity-input"}
                  onChange={(event) => {setState({amount : event.target.value})}}
                  value={state.amount}
                />
                <InputGroup.Text>
                  MBq
                </InputGroup.Text>
                <InputGroup.Text>
                  <ClickableIcon
                    src="/static/images/calculator.svg"
                    onClick={(_event) => {setState({showCalculator : true})}}
                  />
                </InputGroup.Text>
              </TracershopInputGroup> : ""
              }
            </Row>

            { hasError() ?
            <Row>
              <AlertBox
                message={getErrorMessage()}
                level={getErrorLevel()}
              >
              </AlertBox>
            </Row> : null }
          </Container>
          }

        </Modal.Body>
        <Modal.Footer>
          {state.showCalculator ? <HoverBox
            Base={<Button disabled={true}>Opret Ordre</Button>}
            Hover={<div>Du kan ikke opret en ordre imens at du bruger lommeregneren</div>}
          ></HoverBox>
           : <Button onClick={createOrder}>Opret Ordre</Button>}
          <Button onClick={props[PROP_ON_CLOSE]}>Luk</Button>
        </Modal.Footer>
      </Modal>
    )
}
