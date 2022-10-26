import React, { Component } from "react";
import { Modal, Button, Form, FormControl, InputGroup, Row, Container } from "react-bootstrap";
import { renderClickableIcon, renderStatusImage } from "../../lib/Rendering";
import { Calculator } from "../injectables/calculator";
import { ParseDanishNumber } from "/src/lib/formatting";
export { CreateOrderModal }

import styles from '../../css/Site.module.css'

class CreateOrderModal extends Component {
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
    var run;
    for(const [DTrun, _] of NewProductions){
      run = DTrun;
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
    const AmountNumber = ParseDanishNumber(this.state.amount);

    if(isNaN(AmountNumber)){
      this.setState({
        ErrorMessage : "Aktiviteten er ikke et læstbart tal"
      });
      return
    }
    const customer = this.props.customers.get(Number(this.state.activeCustomerID));
    const activeProduction = this.state.productions.get(this.state.activeRun);

    this.props.createOrder(
      customer,
      this.state.activeRun,
      activeProduction.deliverTime,
      AmountNumber
    );
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

  commitCalculator(Activity){
    this.setState({...this.state,
      showCalculator : false,
      amount : Activity,
    });
  }

  render(){
    const Tracer = this.props.tracers.get(this.props.tracer)
    const activeProduction = this.state.productions.get(this.state.activeRun)
    const TargetDatetime = new Date(activeProduction.deliverTime)

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

    return  (
      <Modal
        show={this.props.show}
        onHide={this.props.onClose}
        className={styles.mariLight}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          { this.state.showCalculator ?
          <Calculator
            isotopes={this.props.isotopes}
            tracer={Tracer}
            productionTime={TargetDatetime}
            defaultMBq={300}
            cancel={this.hideCalculator.bind(this)}
            commit={this.commitCalculator.bind(this)}
          /> :
            <Container>
            <Row className={styles.Margin15tb}>
              <InputGroup>
              <InputGroup.Text>Kunde</InputGroup.Text>
              <select onChange={this.changeCustomer.bind(this)} value={this.state.activeCustomerID} className="form-select">
                {options}
              </select>
              </InputGroup>
            </Row>
            <Row className={styles.Margin15tb}>
              <InputGroup>
                <InputGroup.Text>Kørsel</InputGroup.Text>
                <select onChange={this.changeRun.bind(this)} value={this.state.activeRun} className="form-select">
                  {runs}
                </select>
              </InputGroup>
            </Row>
            <Row className={styles.Margin15tb}>
              <InputGroup>
                <InputGroup.Text>Aktivitet</InputGroup.Text>
                <FormControl onChange={this.changeAmount.bind(this)} value={this.state.amount}></FormControl>
                <InputGroup.Text>MBq</InputGroup.Text>
                <InputGroup.Text>
                  {renderClickableIcon("/static/images/calculator.svg", this.showCalculator.bind(this))}
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
          {this.state.showCalculator ? null : <Button onClick={this.createOrder.bind(this)}>Opret Ordre</Button>}
          <Button onClick={this.props.onClose}>Luk</Button>
        </Modal.Footer>
      </Modal>
    );;
  }
}
