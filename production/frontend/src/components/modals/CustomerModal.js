import { ajax } from "jquery";
import React, { Component } from "react";
import { Modal, Button, Table, Row, FormControl, Col } from "react-bootstrap";
import { ParseTelefonNumber, FormatTime, parseName, ParseEmail, isNotNaN } from "/src/lib/formatting.js"
import { JSON_CUSTOMER,WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_DELIVERTIMES, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
  WEBSOCKET_MESSAGE_DELETE_DATA_CLASS
} from "/src/lib/constants.js"


export { CustomerModal }

class CustomerModal extends Component {
  constructor(props) {
    super(props)

    const customer = this.props.customer.get(this.props.userid);
    const DeliverTimes = new Map();
    for(const [_DTID, deliverTime] of this.props.deliverTimes.entries()) {
      if(deliverTime.BID == this.props.userid)
        DeliverTimes.set(deliverTime.DTID, deliverTime);
    }

    this.state = {
      customerOverhead : customer.overhead,
      customer : customer,
      deliverTimes : DeliverTimes,

      change_Realname : false,
      change_contact  : false,
      change_tlf      : false,
      change_email    : false,
      change_email2   : false,
      change_email3   : false,
      change_email4   : false,
      change_overhead : false,

      error_Realname : false,
      error_contact  : false,
      error_tlf      : false,
      error_email    : false,
      error_email2   : false,
      error_email3   : false,
      error_email4   : false,
      error_overhead : false,

      new_Realname : customer.Realname,
      new_contact : customer.contact,
      new_tlf : customer.tlf,
      new_email : customer.email,
      new_email2 : customer.email2,
      new_email3 : customer.email3,
      new_email4 : customer.email4,
      new_overhead : customer.overhead,

      new_day : 1,
      new_run : 1,
      new_dtime : "",
      new_repeat_t : 1
    };
  }

  // State altering functions
  changeState(stateKW, newValue){
    const newState = {...this.state};
    newState[stateKW] = newValue;
    this.setState(newState);

  }

  // Customer updates
  updateCustomer(ValidationFunction, kw, NewValue){
    const error_keyword = "error_" + kw;
    const newState = {...this.state};
    if(ValidationFunction(NewValue)){
      const stateChangeKw = "change_" + kw;
      newState[stateChangeKw] = false;
      newState[error_keyword] = false;
      if (this.state.customer[kw] != NewValue){ // No reason to update something that's correct
        this.state.customer[kw] = NewValue
        const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
        message[WEBSOCKET_DATA] = this.state.customer;
        message[WEBSOCKET_DATATYPE] = JSON_CUSTOMER;
        this.props.websocket.send(JSON.stringify(message));
      }
    } else {
      newState[error_keyword] = true;
    }
    this.setState(newState);
  }

  key_updateCustomer(e, verifyFunction, kw, ParsedValue) {
    if (e.key === 'Enter'){
      this.updateCustomer(verifyFunction, kw, ParsedValue)
    }
  }

  deleteDeliverTime(deliverTime){
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_DELETE_DATA_CLASS);
    message[WEBSOCKET_DATATYPE] = JSON_DELIVERTIMES;
    message[WEBSOCKET_DATA] = deliverTime;
    this.props.websocket.send(JSON.stringify(message));
  }

  createDeliverTime(){
    // Validation


    //
    const newDelivertime = {
      day : this.state.new_day,
      run : this.state.new_run,
      dtime : this.state.new_dtime,
      repeat_t : this.state.new_repeat_t,
      BID : this.props.userid
    };
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
    message[WEBSOCKET_DATA] = newDelivertime;
    message[WEBSOCKET_DATATYPE] = JSON_DELIVERTIMES;
    this.props.websocket.send(JSON.stringify(message));
  }

  // Deliver Times updates
  changeDeliverTime(newValue, kw, deliverTime){
    deliverTime[kw] = newValue;
    const newState = {...this.state};
    newState.deliverTimes.set(deliverTime.DTID, deliverTime);
    this.setState(newState);
    // Validate state and send to server
    if(kw === "dtime" && newValue){
      if(newValue.length < 3) return;
      // Do validation

      const formatted_time = FormatTime(newValue);
      if(!formatted_time) return;
      deliverTime[kw] = formatted_time;

    }
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
    message[WEBSOCKET_DATA] = deliverTime;
    message[WEBSOCKET_DATATYPE] = JSON_DELIVERTIMES;
    this.props.websocket.send(JSON.stringify(message));
  }


  // Rendering Functions
  renderDatePicker(deliverTime) {
    return (
      <select
        value={deliverTime.day}
        onChange={(event) => this.changeDeliverTime(Number(event.target.value),"day", deliverTime)}
      >
        <option value="1">Mandag</option>
        <option value="2">Tirsdag</option>
        <option value="3">Onsdag</option>
        <option value="4">Torsdag</option>
        <option value="5">Fredag</option>
        <option value="6">Lørdag</option>
        <option value="7">Søndag</option>
      </select>
    );
  }

  renderRunPicker(deliverTime) {
    const options = [];

    for(const [_PTID, production] of this.props.runs){
      if(deliverTime.day === production.day) options.push((<option key={production.run} value={production.run}>{production.run}</option>));
    }

    return (
      <select
        value={deliverTime.run}
        onChange={(event) => this.changeDeliverTime(Number(event.target.value),"run", deliverTime) }
      >
        {options}
      </select>
    );
  }

  renderReceiveTime(deliverTime) {
    return(
      <FormControl
        value={deliverTime.dtime}
        onChange={(event) => {
          this.changeDeliverTime(FormatTime(event.target.value), "dtime", deliverTime)
        }}
      />
    );
  }



  renderRepeat(deliverTime) {
    return(
      <select
        value={deliverTime.repeat}
        onChange={
          (event) => this.changeDeliverTime(Number(event.target.value),"repeat_t", deliverTime)
        }
      >
        <option value="1">Hver Uge</option>
        <option value="2">Lige Uger</option>
        <option value="3">Ulige Uger</option>
      </select>
    );
  }


  renderRow (deliverTime) {
    return (
      <tr key={deliverTime.DTID}>
        <td>{this.renderDatePicker(deliverTime)}</td>
        <td>{this.renderRunPicker(deliverTime)}</td>
        <td>{this.renderReceiveTime(deliverTime)}</td>
        <td>{this.renderRepeat(deliverTime)}</td>
        <td><img src="static/images/decline.svg" className="tableButton" onClick={() => this.deleteRow(deliverTime)} /></td>
      </tr>
    )
  }

  renderAddRow() {
    // Yeah there's dublicate code, that could be solved by some dependency injection & composition magic
    // Sorry for the bad code
    return(
      <tr key={-1}>
        <td>
          <select
            onChange={(event) => this.changeState("new_day", Number(event.target.value))}
            value={this.state.new_day}
            >
        <option value="1">Mandag</option>
        <option value="2">Tirsdag</option>
        <option value="3">Onsdag</option>
        <option value="4">Torsdag</option>
        <option value="5">Fredag</option>
        <option value="6">Lørdag</option>
        <option value="7">Søndag</option>
      </select>
        </td>
        <td>
          <select
            onChange={(event) => this.changeState("new_run", Number(event.target.value))}
            value={this.state.new_run}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </td>
        <td>
          <FormControl
            onChange={(event) => {this.changeState("new_dtime",event.target.value)}}
            value={this.state.new_dtime}
            />
        </td>
        <td>
          <select
            onChange={(event) => this.changeState("new_repeat_t", Number(event.target.value))}
            value={this.state.new_repeat}
          >
            <option value="1">Hver Uge</option>
            <option value="2">Lige Uger</option>
            <option value="3">Ulige Uger</option>
          </select>
        </td>
        <td><img src="static/images/accept.svg" className="tableButton"/></td>
      </tr>
    );
  }

  renderCustomerRow(kw, editFunction, clearifyer, verifyFunction, ParsingFunction, error_message){
    const change_kw = "change_" + kw;
    const error_kw = "error_" + kw;
    const new_kw = "new_" + kw;
    return (
      <div>
        { this.state[change_kw] ?
        <Row>
          <Col className="col-2"> {clearifyer}:</Col>
          <Col className="col-9">
            <FormControl
              value = {this.state[new_kw]}
              onKeyDown = {(e) => this.key_updateCustomer (e, verifyFunction, kw, ParsingFunction(this.state[new_kw]) )}
              onChange = {(event) => {this.changeState(new_kw, event.target.value)}}
              />
            { this.state[error_kw] ? <div>{error_message}</div> : ""}
          </Col>
          <Col className="col-1">
            <img
              src="static/images/accept.svg" className="tableButton"
              onClick={() => this.updateCustomer(verifyFunction, kw, ParsingFunction(this.state[new_kw]))}
            />
          </Col>
        </Row>
     : <Row>
        <Col className="col-2">{clearifyer}:</Col>
        <Col className="col-9">{this.state.customer[kw]}</Col>
        <Col className="col-1">
          <img src="static/images/pen.svg"
               className="tableButton"
               onClick={editFunction}
               />
        </Col>
      </Row>
      }
    </div>)
  }


  renderbody(){
    const deliverTimes = []
    for(const [_, deliverTime] of this.state.deliverTimes) {
      deliverTimes.push(deliverTime)
    }
    deliverTimes.sort((dt1, dt2) => {if (dt1.day - dt2.day != 0){
      return dt1.day - dt2.day
    } else {return dt1.run - dt2.day}} );
    const renderedDeliverTimes = []; // Filtering have been done
    for(const dt of deliverTimes){
      renderedDeliverTimes.push(this.renderRow(dt));
    }
    renderedDeliverTimes.push(this.renderAddRow());

    return (
      <div>
        {this.renderCustomerRow(
          "Realname", () => {this.changeState("change_Realname", true)}, "Kunde",
          parseName, String, "Et tomt navn er ikke gyldigt"
        )}
        <Row>
          <Col className="col-12" > Kunde nummer: {this.state.customer.kundenr}</Col>
        </Row>
        {this.renderCustomerRow(
          "contact", () => {this.changeState("change_contact", true)}, "Kontakt",
          parseName, String, "Et tomt kontakt er ikke gyldigt"
        )}
        {this.renderCustomerRow(
          "tlf", () => {this.changeState("change_tlf", true)}, "Telefon",
          ParseTelefonNumber, String, "Telefon nummeret er ikke formatteret korrekt"
        )}
        {this.renderCustomerRow(
          "email", () => {this.changeState("change_email", true)}, "Email 1",
          ParseEmail, String, "Emailen er formatteret korrekt"
        )}
        {this.renderCustomerRow(
          "email2", () => {this.changeState("change_email2", true)}, "Email 2",
          ParseEmail, String, "Emailen er formatteret korrekt"
        )}
        {this.renderCustomerRow(
          "email3", () => {this.changeState("change_email3", true)}, "Email 3",
          ParseEmail, String, "Emailen er formatteret korrekt"
        )}
        {this.renderCustomerRow(
          "email4", () => {this.changeState("change_email4", true)}, "Email 4",
          ParseEmail, String, "Emailen er formatteret korrekt"
        )}
        {this.renderCustomerRow(
          "overhead", () => {this.changeState("change_overhead", true)}, "Overhead",
          isNotNaN, Number, "Overhead skal være et tal"
        )}

        <Table>
          <thead>
            <tr>
              <th>Ugedag</th>
              <th>Kørsel</th>
              <th>Modtagetid</th>
              <th>Gentage</th>
              <th/>
            </tr>
          </thead>
          <tbody>
            {renderedDeliverTimes}
          </tbody>
        </Table>
      </div>
    );
  }

  render() {
    return (
      <Modal
        show={this.props.show}
        size="lg"
        onHide ={this.props.onClose}
      >
        <Modal.Header>
          <Modal.Title>Kunde Konfigurering</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderbody()}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onClose}>
            Luk
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
