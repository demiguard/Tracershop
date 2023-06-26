import React, { Component } from "react";
import { Modal, Button, Form, FormControl, InputGroup, Row, Container } from "react-bootstrap";
import propTypes from "prop-types";
import { Calculator } from "../injectable/calculator";
import { ParseDanishNumber, dateToDateString } from "../../lib/formatting";


import { LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_TRACER,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_ACTIVITY_ORDER, JSON_CUSTOMER, PROP_ORDER_MAPPING, PROP_ON_CLOSE, PROP_WEBSOCKET, JSON_TRACER, PROP_ACTIVE_TRACER, JSON_ISOTOPE, WEBSOCKET_MESSAGE_MODEL_CREATE, PROP_ACTIVE_DATE, DATABASE_CURRENT_USER, AUTH_USER_ID } from "../../lib/constants.js"

import styles from '../../css/Site.module.css'
import { HoverBox } from "../injectable/hover_box";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { ClickableIcon } from "../injectable/icons";
import { KEYWORD_ActivityOrder_DELIVERY_DATE, KEYWORD_ActivityOrder_ORDERED_ACTIVITY, KEYWORD_ActivityOrder_ORDERED_BY, KEYWORD_ActivityOrder_ORDERED_TIME_SLOT, KEYWORD_ActivityOrder_STATUS } from "../../dataclasses/keywords";

export { CreateOrderModal }

class CreateOrderModal extends Component {
  /**
   * 
  static propTypes = {
    customers : propTypes.instanceOf(Map),
    DeliverTimeMap : propTypes.instanceOf(Map),
    isotopes : propTypes.instanceOf(Map),
    tracer : propTypes.number,
    onClose : propTypes.func,
    tracers : propTypes.instanceOf(Map),
    //websocket : propTypes.instanceOf(TracerWebSocket) //This is needed but javascript is a fucked language...
  }
  */

  constructor(props){
    super(props);

    let activeCustomer = undefined;
    let DeliverTimeMapping = new Map();

    for(const [customerID, customer] of this.props[JSON_CUSTOMER]){
      DeliverTimeMapping = this.props[PROP_ORDER_MAPPING].get(customerID);
      if (activeCustomer === undefined){
        activeCustomer = customer;
      }
      if (DeliverTimeMapping){ //If it's empty pick a new one, since you can't order there
        break;
      }
    }

    this.state = {
      showCalculator : false,
      productions : DeliverTimeMapping,
      activeCustomerID : activeCustomer.id,
      selectedTimeSlot : 0,
      amount : "",
      ErrorMessage : "",
    };
  }

  changeAmount(event){
    this.setState({
      amount : event.target.value,
      ErrorMessage : "",
    });
  }

  changeCustomer(event){
    const newCustomer = this.props[JSON_CUSTOMER].get(Number(event.target.value));
    const NewProductions = this.props[PROP_ORDER_MAPPING].get(newCustomer.id);
    const ActiveProduction = 0;

    this.setState({
      ...this.state,
      activeCustomerID : newCustomer.ID,
      productions : NewProductions,
      selectedTimeSlot : ActiveProduction,
      ErrorMessage : "",
    })
  }

  changeRun(event){
    this.setState({
      ...this.state,
      selectedTimeSlot : Number(event.target.value)
    });
  }

  createOrder(){
    const amountNumber = ParseDanishNumber(this.state.amount);
    if(isNaN(amountNumber)){
      this.setState({
        ErrorMessage : "Aktiviteten er ikke et læstbart tal"
      });
      return;
    }
    dateToDateString
    const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
    const skeleton = {}
    const TimeSlot = this.state.productions[this.state.selectedTimeSlot]
    skeleton[KEYWORD_ActivityOrder_ORDERED_ACTIVITY] = amountNumber
    skeleton[KEYWORD_ActivityOrder_STATUS] = 1
    skeleton[KEYWORD_ActivityOrder_DELIVERY_DATE] = dateToDateString(this.props[PROP_ACTIVE_DATE])
    skeleton[KEYWORD_ActivityOrder_ORDERED_TIME_SLOT] = TimeSlot.id;
    skeleton[KEYWORD_ActivityOrder_ORDERED_BY] = this.props[DATABASE_CURRENT_USER][AUTH_USER_ID]

    message[WEBSOCKET_DATA] = skeleton;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    this.props[PROP_WEBSOCKET].send(message);
    this.props[PROP_ON_CLOSE]();
  }

  showCalculator(){
    this.setState({...this.state,
      showCalculator : true
    })
  }

  hideCalculator(){
    this.setState({...this.state,
      showCalculator : false
    })
  }

  commitCalculator(activity){
    this.setState({...this.state,
      showCalculator : false,
      amount : activity,
    });
  }

  render(){
    const Tracer = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER])
    const activeProduction = this.state.selectedTimeSlot;


    const options = [];
    for(const [customerID, customer] of this.props[JSON_CUSTOMER]){
      const DeliverTimeMapping = this.props[PROP_ORDER_MAPPING].get(customerID);
      if(DeliverTimeMapping) {
        options.push(
          <option key={customerID} value={customerID}>{customer.short_name}</option>
        );
      }
    }

    const runs = [];

    for(const production of this.state.productions){
      runs.push(
        (<option key={production.id} value={runs.length}>{production.delivery_time}</option>)
      )
    }
    // Verbosity is mostly for the reader sake, so don't say I didn't think about you
    const Err = this.state.ErrorMessage.length == 0 ? false : true;

    return (
      <Modal
        show={true}
        onHide={this.props[PROP_ON_CLOSE]}
        className={styles.mariLight}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          { this.state.showCalculator ?
          <Calculator
            isotopes={this.props[JSON_ISOTOPE]}
            tracer={Tracer}
            productionTime={TargetDateTime}
            defaultMBq={300}
            cancel={this.hideCalculator.bind(this)}
            commit={this.commitCalculator.bind(this)}
          /> :
            <Container>
            <Row className={styles.Margin15tb}>
              <InputGroup>
              <InputGroup.Text>Kunde</InputGroup.Text>
              <select
                onChange={this.changeCustomer.bind(this)}
                value={this.state.activeCustomerID}
                aria-label={"customer-select"}
                className="form-select">
                {options}
              </select>
              </InputGroup>
            </Row>
            <Row className={styles.Margin15tb}>
              <InputGroup>
                <InputGroup.Text>Kørsel</InputGroup.Text>
                <select
                  aria-label={"run-select"}
                  onChange={this.changeRun.bind(this)}
                  value={this.state.selectedTimeSlot}
                  className="form-select"
                >
                  {runs}
                </select>
              </InputGroup>
            </Row>
            <Row className={styles.Margin15tb}>
              <InputGroup>
                <InputGroup.Text>Aktivitet</InputGroup.Text>
                <FormControl
                  aria-label={"activity-input"}
                  onChange={this.changeAmount.bind(this)}
                  value={this.state.amount}
                />
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
                {this.state.ErrorMessage}
              </Container>
            </Row> : null }
          </Container>
          }

        </Modal.Body>
        <Modal.Footer>
          {this.state.showCalculator ? <HoverBox
            Base={<Button disabled={true}>Opret Ordre</Button>}
            Hover={<div>Du kan ikke opret en ordre imens at du bruger lommeregneren</div>}
          ></HoverBox>
           : <Button onClick={this.createOrder.bind(this)}>Opret Ordre</Button>}
          <Button onClick={this.props[PROP_ON_CLOSE]}>Luk</Button>
        </Modal.Footer>
      </Modal>
    );;
  }
}
