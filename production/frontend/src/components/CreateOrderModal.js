import React, { Component } from "react";
import { Modal, Button, Form, FormControl, InputGroup, Row, Container } from "react-bootstrap";
import "./css/MyRow.css"
import { ParseDanishNumber } from "./lib/formatting";
export { CreateOrderModal }

class CreateOrderModal extends Component {
  constructor(props){
    super(props);
    
    var activeCustomer; 

    for(const [customerID, customer] of this.props.customers){
      activeCustomer = customer;
      if (activeCustomer.productions.length > 0) break;
    }

    let productions = activeCustomer.productions
    let activeProduction = productions[0];

    this.state = {
      productions : productions,
      activeCustomerID : activeCustomer.ID,
      activeRun : activeProduction.run,
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
    const NewProductions = newCustomer.productions
    const DefaultRun = NewProductions[0];

    this.setState({
      ...this.state,
      activeCustomerID : newCustomer.ID,
      productions : NewProductions,
      activeRun : DefaultRun.run,
      ErrorMessage : "",
    })
  }

  changeRun(event){
    this.setState({
      ...this.state,
      activeRun : event.target.value
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
    
    var production = undefined;
    for(const CustomerProduction of customer.productions){
      if (this.state.activeRun == CustomerProduction.run){
        production = CustomerProduction;
        break
      }
    }

    if(production == undefined){
      this.setState({
        ErrorMessage: "Kan ikke funde produktion, Det burde være umuligt at nå her til."
      });
      return;
    }

    this.props.createOrder(
      customer,
      production,
      AmountNumber

    );
    this.props.onClose();
  }

  render(){
    console.log(this.state);
    console.log(this.props);

    const options = [];
    for(const [customerID, customer] of this.props.customers){
      if(customer.productions.length > 0) options.push(
        (<option key={customerID} value={customerID}>{customer.UserName}</option>)
      );
    }

    const runs = [];
    for(const production of this.state.productions){
      runs.push(
        (<option key={production.run} value={production.run}>{production.run} - {production.dtime}</option>)
      )
    }
    // Verbosity is mostly for the reader sake, so don't say I didn't think about you
    const Err = this.state.ErrorMessage.length == 0 ? false : true; 

    
    return  (
      <Modal
        show={this.props.show}
        onHide={this.props.onClose}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          <Container>
            <Row className="myRow">
              <InputGroup>
              <InputGroup.Text>Kunde</InputGroup.Text>
              <select onChange={this.changeCustomer.bind(this)} value={this.state.activeCustomerID} className="form-select">
                {options}
              </select>
              </InputGroup>
            </Row>
            <Row className="myRow">
              <InputGroup>
                <InputGroup.Text>Kørsel</InputGroup.Text>
                <select onChange={this.changeRun.bind(this)} value={this.state.activeRun} className="form-select">
                  {runs}
                </select>
              </InputGroup>
            </Row>
            <Row className="myRow">
              <InputGroup>
                <InputGroup.Text>Aktivitet</InputGroup.Text>
                <FormControl onChange={this.changeAmount.bind(this)} value={this.state.amount}></FormControl>
                <InputGroup.Text>MBq</InputGroup.Text>
              </InputGroup>
            </Row>
            {Err ? <Row>
              <Container>
                {this.state.ErrorMessage}
              </Container>
            </Row> : null }
          </Container>

        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.createOrder.bind(this)}>Opret Ordre</Button>
          <Button onClick={this.props.onClose}>Luk</Button>
        </Modal.Footer>
      </Modal>
    );;
  }

}
