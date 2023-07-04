import React, { Component, useState } from "react";
import { Modal, Button, Form, FormControl, InputGroup, Row, Container } from "react-bootstrap";
import { Calculator } from "../injectable/calculator";
import { ParseDanishNumber, dateToDateString } from "../../lib/formatting";
import { LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_TRACER,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_ACTIVITY_ORDER, JSON_CUSTOMER, PROP_ORDER_MAPPING, PROP_ON_CLOSE, PROP_WEBSOCKET, JSON_TRACER, PROP_ACTIVE_TRACER, JSON_ISOTOPE, WEBSOCKET_MESSAGE_MODEL_CREATE, PROP_ACTIVE_DATE, DATABASE_CURRENT_USER, AUTH_USER_ID } from "../../lib/constants.js"

import { Customer } from "../../dataclasses/dataclasses";


import styles from '../../css/Site.module.css'
import { HoverBox } from "../injectable/hover_box";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { ClickableIcon } from "../injectable/icons";
import { Select } from "../injectable/select"
import { KEYWORD_ActivityOrder_DELIVERY_DATE, KEYWORD_ActivityOrder_ORDERED_ACTIVITY, KEYWORD_ActivityOrder_ORDERED_BY, KEYWORD_ActivityOrder_ORDERED_TIME_SLOT, KEYWORD_ActivityOrder_STATUS } from "../../dataclasses/keywords";
import { TracerShopInputGroup } from '../injectable/tracershop_input_group'


export function CreateOrderModal(props) {
    let activeCustomer = undefined;
    let DeliverTimeMapping = new Map();

    for(const [customerID, customer] of props[JSON_CUSTOMER]){
      DeliverTimeMapping = props[PROP_ORDER_MAPPING].get(customerID);
      if (activeCustomer === undefined){
        activeCustomer = customer;
      }
      if (DeliverTimeMapping){ //If it's empty pick a new one, since you can't order there
        break;
      }
    }

  const [amount, setAmount] = useState("");
  const [customerID, setCustomer] = useState(activeCustomer.id)
  const [showCalculator, setShowCalculator] = useState(false);
  const [timeSlotID, setTimeSlotID] = useState(0)

  function createOrder(_event){
    const amountNumber = ParseDanishNumber(amount);
    if(isNaN(amountNumber)){
      setState({
        ErrorMessage : "Aktiviteten er ikke et læstbart tal"
      });
      return;
    }

    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
    const skeleton = {}
    const TimeSlot = productions[state.selectedTimeSlot]
    skeleton[KEYWORD_ActivityOrder_ORDERED_ACTIVITY] = amountNumber
    skeleton[KEYWORD_ActivityOrder_STATUS] = 1
    skeleton[KEYWORD_ActivityOrder_DELIVERY_DATE] = dateToDateString(props[PROP_ACTIVE_DATE])
    skeleton[KEYWORD_ActivityOrder_ORDERED_TIME_SLOT] = TimeSlot.id;
    skeleton[KEYWORD_ActivityOrder_ORDERED_BY] = props[DATABASE_CURRENT_USER][AUTH_USER_ID]

    message[WEBSOCKET_DATA] = skeleton;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    props[PROP_WEBSOCKET].send(message);
    props[PROP_ON_CLOSE]();
  }

  function commitCalculator(activity){
    setShowCalculator(false);
    setAmount(activity);
  }

  const Tracer = props[JSON_TRACER].get(props[PROP_ACTIVE_TRACER])
  const activeProduction = state.selectedTimeSlot;

  const customerOptions = [...props[JSON_CUSTOMER].values()].map(
    (_customer) => {
      const /**@type {Customer} */ customer = _customer
      return {
        id : customer.id,
        name : customer.short_name,
      }
    }
  );

    const ActivityTimeSlots = [];

  for(const production of state.productions){
    ActivityTimeSlots.push(
      (<option key={production.id} value={ActivityTimeSlots.length}>{production.delivery_time}</option>)
    )
  }
  // Verbosity is mostly for the reader sake, so don't say I didn't think about you
  const Err = state.ErrorMessage.length == 0 ? false : true;

  return (
      <Modal
        show={true}
        onHide={props[PROP_ON_CLOSE]}
        className={styles.mariLight}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          { showCalculator ?
          <Calculator
            isotopes={props[JSON_ISOTOPE]}
            tracer={Tracer}
            productionTime={TargetDateTime}
            defaultMBq={300}
            cancel={() => {setShowCalculator(false)}}
            commit={commitCalculator}
          /> :
          <Container>
            <Row className={styles.Margin15tb}>
              <TracerShopInputGroup label="Kunde">
                <Select
                  options={customerOptions}
                  valueKey="id"
                  name="name"
                  onChange={(event) => {
                    setCustomer(Number(event.target.value))
                  }}
                  value={customerID}
                  aria-label={"customer-select"}
                />
              </TracerShopInputGroup>
              <TracerShopInputGroup label="Leverings Sted">

              </TracerShopInputGroup>
              <TracerShopInputGroup label="Kørsel">
                <Select
                  options={ActivityTimeSlots}
                  valueKey = "id"
                  nameKey = "name"
                  value={timeSlotID}
                  onChange={(event) => {setTimeSlotID(Number(event.target.value))}}
                />
              </TracerShopInputGroup>
              <TracerShopInputGroup label="Aktivitet">
              <FormControl
                  aria-label={"activity-input"}
                  onChange={(event) => {setAmount(event.target.value)}}
                  value={this.state.amount}
                />
              </TracerShopInputGroup>
            </Row>
            <Row className={styles.Margin15tb}>
              <InputGroup>
                <InputGroup.Text>Aktivitet</InputGroup.Text>
                
                <InputGroup.Text>MBq</InputGroup.Text>
                <InputGroup.Text>
                  {<ClickableIcon
                     src="/static/images/calculator.svg"
                     onClick={this.showCalculator.bind(this)}
                     altText={"calculator"}/>}
                </InputGroup.Text>
              </InputGroup>
            </Row>
            {Err ? <Row>
              <Container>
                {state.ErrorMessage}
              </Container>
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
