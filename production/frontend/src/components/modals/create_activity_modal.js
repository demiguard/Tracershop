import React, { useState } from "react";
import { Modal, Button, FormControl, InputGroup, Row, Container } from "react-bootstrap";
import { Calculator } from "../injectable/calculator";
import { dateToDateString } from "../../lib/formatting";
import { LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_TRACER,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_ACTIVITY_ORDER, JSON_CUSTOMER, PROP_ON_CLOSE, PROP_WEBSOCKET, JSON_TRACER, PROP_ACTIVE_TRACER, JSON_ISOTOPE, WEBSOCKET_MESSAGE_MODEL_CREATE, PROP_ACTIVE_DATE, DATABASE_CURRENT_USER, AUTH_USER_ID, PROP_TIME_SLOT_MAPPING, JSON_ENDPOINT, JSON_DELIVER_TIME, JSON_PRODUCTION } from "../../lib/constants.js"

import { ActivityDeliveryTimeSlot, ActivityOrder, Customer } from "../../dataclasses/dataclasses";


import styles from '../../css/Site.module.css'
import { HoverBox } from "../injectable/hover_box";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { ClickableIcon } from "../injectable/icons";
import { Select } from "../injectable/select"
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box"
import { TracershopInputGroup } from '../injectable/tracershop_input_group'
import { combineDateAndTimeStamp, getDay } from "../../lib/chronomancy";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { parseDanishPositiveNumberInput } from "../../lib/user_input";

export function CreateOrderModal(props) {
  const /**@type {Map<Number, Map<Number, Array<ActivityDeliveryTimeSlot>>>} */ TimeSlotMapping = props[PROP_TIME_SLOT_MAPPING]

  let endpointInit = ""
  let customerInit = ""
  let timeSlotIdInit = ""
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

  const [activeCustomer, setActiveCustomer] = useState(customerInit);
  const [activeEndpoint, setActiveEndpoint] = useState(endpointInit);
  const [activeTimeSlot, _setActiveTimeSlot] = useState(timeSlotIdInit);

  function setActiveTimeSlot(value){
    _setActiveTimeSlot(value)
  }



  const [state, _setState] = useState({
    amount : "",
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
    const [valid, amountNumber] = parseDanishPositiveNumberInput(state.amount, "Aktiviteten")

    if(!valid){
      setState({error : {...state.error, invalidOrder : amountNumber}});
      return;
    }

    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
    const skeleton = new ActivityOrder(undefined, // order_id
                                       amountNumber, // ordered_activity
                                       dateToDateString(props[PROP_ACTIVE_DATE]), // delivery_Date
                                       1, // status
                                       "", // comment
                                       activeTimeSlot, // ordered_time_Slot
                                       null, // moved_to_time_slot
                                       null, // ordered_by, set by backend
                                       null, // freed_by
    );

    message[WEBSOCKET_DATA] = skeleton;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    props[PROP_WEBSOCKET].send(message);
    props[PROP_ON_CLOSE]();
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

  const day = getDay(props[PROP_ACTIVE_DATE]);
  const filteredTimeSlots = [...props[JSON_DELIVER_TIME].values()].filter(
    (timeSlot) => {
      const production = props[JSON_PRODUCTION].get(timeSlot.production_run)
      return production.production_day == day;
    }
  )

  const Tracer = props[JSON_TRACER].get(props[PROP_ACTIVE_TRACER])

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
              <DestinationSelect
                ariaLabelCustomer="customer-select"
                ariaLabelEndpoint="endpoint-select"
                ariaLabelTimeSlot="time-slot-select"
                activeCustomer={activeCustomer}
                activeEndpoint={activeEndpoint}
                activeTimeSlot={activeTimeSlot}
                customer={props[JSON_CUSTOMER]}
                endpoints={props[JSON_ENDPOINT]}
                timeSlots={filteredTimeSlots}
                setCustomer={setActiveCustomer}
                setEndpoint={setActiveEndpoint}
                setTimeSlot={setActiveTimeSlot}
              />
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
              </TracershopInputGroup>
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
