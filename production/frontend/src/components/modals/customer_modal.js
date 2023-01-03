import { ajax } from "jquery";
import React, { Component } from "react";
import { Modal, Button, Table, Row, FormControl, Col, Form } from "react-bootstrap";
import { changeState } from "../../lib/state_management.js"
import {renderTableRow, renderClickableIcon, renderSelect} from "../../lib/rendering.js"
import { JSON_CUSTOMER,WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,
  JSON_DELIVERTIME, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, KEYWORD_DELIVER_TIME,
  WEBSOCKET_MESSAGE_DELETE_DATA_CLASS, DAYS_OBJECTS,
} from "../../lib/constants.js"
import { FormatTime, ParseDanishNumber } from "../../lib/formatting.js"
import { addCharacter } from "../../lib/utils.js";
import { renderOnClose } from "../../lib/rendering.js";

import styles from '../../css/Site.module.css'


const RunOptions = [
  {name : "Hver uge", val : 1},
  {name : "Lige uger", val : 2},
  {name : "Ulige uger", val : 3}
];


export { CustomerModal }

class CustomerModal extends Component {
  constructor(props) {
    super(props)

    const customer = this.props.activeCustomer;
    const DeliverTimes = new Map();
    for(const [_DTID, deliverTime] of this.props.deliverTimes) {
      if(deliverTime.BID == customer.ID)
        DeliverTimes.set(deliverTime.DTID, deliverTime);
    }

    this.state = {

      customer : customer,
      deliverTimes : DeliverTimes,

      Realname : customer.Realname,
      contact : customer.contact,
      tlf : customer.tlf,
      email : customer.email,
      email2 : customer.email2,
      email3 : customer.email3,
      email4 : customer.email4,
      addr1  : customer.addr1,
      addr2  : customer.addr2,
      addr3  : customer.addr3,
      addr4  : customer.addr4,
      overhead : customer.overhead,

      new_day : 1,
      new_run : 1,
      new_dtime : "",
      new_repeat_t : 1,

      errorMessage : "",
    };
  }

  componentDidUpdate(prevProps){
    if (prevProps.deliverTimes !== this.props.deliverTimes){
      console.log("New Props detected!")
      const DeliverTimes = new Map();
        for(const [_DTID, deliverTime] of this.props.deliverTimes) {
      if(deliverTime.BID == this.props.activeCustomer.ID)
        DeliverTimes.set(deliverTime.DTID, deliverTime);
      }
      this.setState({...this.state, deliverTimes : DeliverTimes})
    }
  }

  // ValidationFunctions
  OverheadValidation(overheadString, This){
    const overhead = ParseDanishNumber(overheadString);
    if(isNaN(overhead)){
      return "Overhead skal være et tal.";
    }
    if(overhead < 0){
      return "Overhead skal være 0 eller positivt tal";
    }
    This.setState({...This.state, overhead : overhead});
    return "";
  }

  AlwaysValidate(){
    return "";
  }

  // Customer updates
  /**
   * This function
   * @param {String} kw - Keyword of the Customer, that is being altered
   * @param {CallableFunction} validateFunction - A function that validate the keyword
   * @param {Object} This - the customer modal
   * @returns {CallableFunction} -
   */
  changeCustomer(kw, validateFunction){
    const returnFunction = (_event) => {
      const ErrorMessage = validateFunction(this.state[kw], this);

      if (ErrorMessage === ""){
        this.setState({...this.state, errorMessage : ErrorMessage});
        this.state.customer[kw] = this.state[kw];
        const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
        message[WEBSOCKET_DATATYPE] = JSON_CUSTOMER;
        message[WEBSOCKET_DATA] = this.state.customer;
        this.props.websocket.send(message);
      } else {
        this.setState({...this.state, errorMessage : ErrorMessage});
      }
    };
    return returnFunction.bind(this);
  }

  deleteDeliverTime(deliverTime, This){
    const returnFunction = (_event) => {
      const message = This.props.websocket.getMessage(WEBSOCKET_MESSAGE_DELETE_DATA_CLASS);
      message[WEBSOCKET_DATATYPE] = JSON_DELIVERTIME;
      message[WEBSOCKET_DATA] = deliverTime;
      This.props.websocket.send(message);
    }
    return returnFunction;
  }

  /**
   * This works like the addCharacter, however since it's doesn't effect a direct state
   * change, thus it doesn't work.
   * @param {Object} deliverTime - Delivertime to be updated
   * @returns {CallableFunction} - Event function , that handles the different delivertimes dtime ':' to be added
   */
  addCharacterDeliverTime(deliverTime){
    const returnFunction = (event) =>{
      if(event.code == "Backspace") return;
      if([2,5].includes(event.target.value.length)){
        const newState = {...this.state}
        const newDeliverTime = {...deliverTime};
        newDeliverTime.dtime = event.target.value + ':';
        newState.deliverTimes.set(newDeliverTime.DTID, newDeliverTime);
        this.setState(newState);
      }
    }
    return returnFunction.bind(this);
  }

  createDeliverTime(){
    // Validation
    const DeliverTime = FormatTime(this.state.new_dtime);
    if (DeliverTime == null){
      this.setState({...this.state, errorMessage : "Modtage tiden er ikke et tidspunkt"})
      return;
    }
    // Send data
    const newDelivertime = {
      day : this.state.new_day,
      run : this.state.new_run,
      dtime : DeliverTime,
      repeat_t : this.state.new_repeat_t,
      BID : this.props.userid
    };
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
    message[WEBSOCKET_DATA] = newDelivertime;
    message[WEBSOCKET_DATATYPE] = JSON_DELIVERTIME;
    this.props.websocket.send(message);
  }


  SelectUpdateDeliverTime(kw, deliverTime){
    const returnFunction = (event) => {
      const formattedValue = Number(event.target.value);
      const newState = {...this.state};
      const NewDeliverTime = {...deliverTime};
      NewDeliverTime[kw] = formattedValue;
      newState.deliverTimes.set(NewDeliverTime.DTID, NewDeliverTime);

      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
      message[WEBSOCKET_DATA] = deliverTime;
      message[WEBSOCKET_DATATYPE] = JSON_DELIVERTIME;
      this.props.websocket.send(message);
    };
    return returnFunction.bind(this)
  }


  changeDeliverTime(deliverTime){
    const returnFunction = (event) => {
      const newState = {...this.state};
      const NewDeliverTime = {...deliverTime};
      NewDeliverTime[KEYWORD_DELIVER_TIME] = event.target.value;
      newState.deliverTimes.set(NewDeliverTime.DTID, NewDeliverTime);
      this.setState(newState);
    }
    return returnFunction;
  }


  saveDeliverTime(deliverTime){
    const returnFunction = (_event) => {
      const FormattedTime = FormatTime(deliverTime.dtime);
      if(FormattedTime){
        const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
        message[WEBSOCKET_DATA] = deliverTime;
        message[WEBSOCKET_DATATYPE] = JSON_DELIVERTIME;
        this.props.websocket.send(message);
      } else {
        console.log(FormattedTime);
      }
    }
    return returnFunction.bind(this);
  }

  // Rendering Functions
  renderRow (deliverTime) {
    const options = [];

    for(const [_PTID, production] of this.props.runs){
      if(deliverTime.day === production.day) options.push(production);
    }

    const table = renderTableRow(deliverTime.DTID,[
      renderSelect(
        DAYS_OBJECTS, "day", "name",
        this.SelectUpdateDeliverTime("day", deliverTime).bind(this),
        deliverTime.day
      ),
      renderSelect(
        options, "run", "run",
        this.SelectUpdateDeliverTime("run", deliverTime).bind(this),
        deliverTime.run
      ),
      (<FormControl
          value={deliverTime.dtime}
          onBlur={this.saveDeliverTime(deliverTime)}
          onChange={this.changeDeliverTime(deliverTime)}
          onKeyDown={this.addCharacterDeliverTime(deliverTime).bind(this)}
        />),
      renderSelect(
          RunOptions, "val", "name",
          this.SelectUpdateDeliverTime("repeat_t", deliverTime).bind(this),
          deliverTime.repeat_t
      ),
      renderClickableIcon("static/images/decline.svg",
        this.deleteDeliverTime(deliverTime, this).bind(this))
    ]);
    return table;
  }

  renderAddRow() {
    // Yeah there's dublicate code, that could be solved by some dependency injection & composition magic
    // Sorry for the bad code
    const productions = [];

    for(const [_PTID, production] of this.props.runs){
      if(Number(this.state.new_day) === production.day) productions.push(production);
    }

    return renderTableRow(-1,[
      renderSelect(DAYS_OBJECTS, "day", "name",
        changeState("new_day", this), this.state.new_day),
      renderSelect(productions, "run", "run",
        changeState("new_run", this), this.state.new_run),
      <FormControl
        value={this.state.new_dtime}
        onChange={changeState("new_dtime", this)}
        onKeyDown={addCharacter(':', "new_dtime", [2,5], this).bind(this)}
      />,
      renderSelect(RunOptions, "val", "name",
        changeState("new_repeat_t", this), this.state.new_repeat_t),
      renderClickableIcon("static/images/accept.svg", this.createDeliverTime.bind(this))
    ]);
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
      <Table>
        <tbody>
          {renderTableRow(1, [
            "Navn:",
            <FormControl
              value={this.state.Realname}
              onChange={changeState("Realname", this)}
              onBlur={this.changeCustomer("Realname",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(2, ["Overhead:", <FormControl
              value={this.state.overhead}
              onChange={changeState("overhead", this)}
              onBlur={this.changeCustomer("overhead",
                          this.OverheadValidation).bind(this)}
            />])
          }
          {renderTableRow(3, [
            "Kontakt Person:", <FormControl
              value={this.state.contact}
              onChange={changeState("contact", this)}
              onBlur={this.changeCustomer("contact",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(4,["Telefon", <FormControl
              value = {this.state.tlf}
              onChange={changeState("tlf", this)}
              onBlur={this.changeCustomer("tlf",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(5, ["Afdeling", <FormControl
              value = {this.state.addr1}
              onChange={changeState("addr1", this)}
              onBlur={this.changeCustomer("addr1",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(6, ["Hospital", <FormControl
              value = {this.state.addr2}
              onChange={changeState("addr2", this)}
              onBlur={this.changeCustomer("addr2",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(7, ["Addresse", <FormControl
              value = {this.state.addr3}
              onChange={changeState("addr3", this)}
              onBlur={this.changeCustomer("addr3",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(8, ["Post nummer", <FormControl
              value = {this.state.addr4}
              onChange={changeState("addr4", this)}
              onBlur={this.changeCustomer("addr4",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(9, ["Email", <FormControl
              value = {this.state.email}
              onChange={changeState("email", this)}
              onBlur={this.changeCustomer("email",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(10, ["Email", <FormControl
              value = {this.state.email2}
              onChange={changeState("email2", this)}
              onBlur={this.changeCustomer("email2",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(11, ["Email", <FormControl
              value = {this.state.email3}
              onChange={changeState("email3", this)}
              onBlur={this.changeCustomer("email3",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(12, ["Email", <FormControl
              value = {this.state.email4}
              onChange={changeState("email4", this)}
              onBlur={this.changeCustomer("email4",
                          this.AlwaysValidate).bind(this)}
            />])
          }
        </tbody>
      </Table>
        <Row>
          <Col className="col-12" > Kunde nummer: {this.state.customer.kundenr}</Col>
        </Row>
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
        className = {styles.mariLight}
      >
        <Modal.Header>
          <Modal.Title>Kunde Konfigurering - {this.state.customer.UserName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderbody()}
        </Modal.Body>
        <Modal.Footer>
          {renderOnClose(this.props.onClose)}
        </Modal.Footer>
      </Modal>
    );
  }
}
