import React, { Component } from "react";
import { Modal, Button, Form, FormControl, InputGroup, Row, Container } from "react-bootstrap";
import propTypes from "prop-types";
import { Calculator } from "../injectable/calculator";
import { ParseDanishNumber } from "../../lib/formatting";


import { KEYWORD_BID, KEYWORD_DELIVER_DATETIME, KEYWORD_RUN, KEYWORD_AMOUNT, KEYWORD_TRACER,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_ACTIVITY_ORDER, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS } from "../../lib/constants.js"

import styles from '../../css/Site.module.css'
import { HoverBox } from "../injectable/hover_box";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { ClickableIcon } from "../injectable/icons";

export { CreateOrderModal }

class CreateOrderModal extends Component {
  static propTypes = {
    customers : propTypes.instanceOf(Map),
    DeliverTimeMap : propTypes.instanceOf(Map),
    isotopes : propTypes.instanceOf(Map),
    tracer : propTypes.number,
    onClose : propTypes.func,
    tracers : propTypes.instanceOf(Map),
    //websocket : propTypes.instanceOf(TracerWebSocket) //This is needed but javascript is a fucked language...
  }

  constructor(props){
    super(props);

    var activeCustomer;
    var DeliverTimeMapping;

    for(const [customerID, customer] of this.props.customers){
      activeCustomer = customer;
      DeliverTimeMapping = this.props.DeliverTimeMap.get(customerID);
      if (DeliverTimeMapping.size){ //If it's empty pick a new one, since you can't order there
        break;
      }
    }

    var run;
    for(const [DTrun, _] of DeliverTimeMapping){
      run = DTrun;
      break;
    }

    this.state = {
      showCalculator : false,
      productions : DeliverTimeMapping,
      activeCustomerID : activeCustomer.ID,
      activeRun : run,
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
    const newCustomer = this.props.customers.get(Number(event.target.value));
    const NewProductions = this.props.DeliverTimeMap.get(newCustomer.ID);
    let run;
    for(const [deliverTimeRun, _] of NewProductions){
      run = deliverTimeRun;
      break;
    }

    this.setState({
      ...this.state,
      activeCustomerID : newCustomer.ID,
      productions : NewProductions,
      activeRun : run,
      ErrorMessage : "",
    })
  }

  changeRun(event){
    this.setState({
      ...this.state,
      activeRun : Number(event.target.value)
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
    const customer = this.props.customers.get(Number(this.state.activeCustomerID));
    const activeProduction = this.state.productions.get(this.state.activeRun);

    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
    const skeleton = {};
    skeleton[KEYWORD_BID] = customer.ID;
    skeleton[KEYWORD_DELIVER_DATETIME] = activeProduction.deliverTime;
    skeleton[KEYWORD_RUN] = this.state.activeRun;
    skeleton[KEYWORD_AMOUNT] = amountNumber;
    skeleton[KEYWORD_TRACER] = this.props.tracer;

    message[WEBSOCKET_DATA] = skeleton;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    this.props.websocket.send(message);
    this.props.onClose();
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
    //console.log(activity)
    this.setState({...this.state,
      showCalculator : false,
      amount : activity,
    });
  }

  render(){
    const Tracer = this.props.tracers.get(this.props.tracer)
    const activeProduction = this.state.productions.get(this.state.activeRun)
    const TargetDateTime = new Date(activeProduction.deliverTime)

    const options = [];
    for(const [customerID, customer] of this.props.customers){
      const DeliverTimeMapping = this.props.DeliverTimeMap.get(customerID);
      if(DeliverTimeMapping.size > 0) options.push(
        (<option key={customerID} value={customerID}>{customer.UserName}</option>)
      );
    }

    const runs = [];
    for(const [run, production] of this.state.productions){
      runs.push(
        (<option key={run} value={run}>{run} - {production.deliverTime.substr(11,5)}</option>)
      )
    }
    // Verbosity is mostly for the reader sake, so don't say I didn't think about you
    const Err = this.state.ErrorMessage.length == 0 ? false : true;

    return (
      <Modal
        show={true}
        onHide={this.props.onClose}
        className={styles.mariLight}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          { this.state.showCalculator ?
          <Calculator
            isotopes={this.props.isotopes}
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
                  value={this.state.activeRun}
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
          <Button onClick={this.props.onClose}>Luk</Button>
        </Modal.Footer>
      </Modal>
    );;
  }
}
