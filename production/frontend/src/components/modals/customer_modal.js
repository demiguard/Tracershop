import { ajax } from "jquery";
import React, { Component } from "react";
import { Modal, Button, Table, Row, FormControl, Col, Form } from "react-bootstrap";
import { changeState } from "../../lib/state_management.js";
import {renderTableRow, renderSelect} from "../../lib/rendering.js";
import { JSON_CUSTOMER,WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,
  JSON_DELIVERTIME, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, KEYWORD_DELIVER_TIME,
  WEBSOCKET_MESSAGE_DELETE_DATA_CLASS, DAYS_OBJECTS,
} from "../../lib/constants.js";
import { FormatTime, ParseDanishNumber } from "../../lib/formatting.js";
import { addCharacter } from "../../lib/utils.js";
import { CloseButton } from "../injectable/buttons.js";
import propTypes from "prop-types";
import { Select } from "../injectable/select.js"
import { ClickableIcon } from "../injectable/icons.js";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box.js"

import styles from '../../css/Site.module.css'


const RunOptions = [
  {name : "Hver uge", val : 1},
  {name : "Lige uger", val : 2},
  {name : "Ulige uger", val : 3}
];


export { CustomerModal }

class CustomerModal extends Component {
  static propTypes = {
    activeCustomer : propTypes.object,
    deliverTimes : propTypes.instanceOf(Map),
    onClose : propTypes.func.isRequired,
    runs : propTypes.instanceOf(Map),
    //websocket : propTypes.instanceOf(TracerWebsocket),
  }

  constructor(props) {
    super(props);

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
   * This function produces anonymous functions that updates the customer
   *  Note that the customer is duplicated in state and props.
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
    const newDeliverTime = {
      day : this.state.new_day,
      run : this.state.new_run,
      dtime : DeliverTime,
      repeat_t : this.state.new_repeat_t,
      BID : this.props.userid
    };
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
    message[WEBSOCKET_DATA] = newDeliverTime;
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
      }
    }
    return returnFunction.bind(this);
  }

  // Rendering Functions
  renderRow (deliverTime) {
    const productionOptions = [];

    for(const [_PTID, production] of this.props.runs){
      if(deliverTime.day === production.day) productionOptions.push(production);
    }

    const tableRow = renderTableRow(deliverTime.DTID,[
      <Select
        label={`delivertime-day-${deliverTime.DTID}`}
        options={DAYS_OBJECTS}
        valueKey={"day"}
        nameKey={"name"}
        onChange={this.SelectUpdateDeliverTime("day", deliverTime).bind(this)}
        initialValue={deliverTime.day}
      />,
      <Select
        label={`delivertime-run-${deliverTime.DTID}`}
        options={productionOptions}
        valueKey={"run"}
        nameKey={"run"}
        onChange={this.SelectUpdateDeliverTime("run", deliverTime).bind(this)}
        initialValue={deliverTime.run}
      />,
      (<FormControl
          aria-label={`delivertime-dtime-${deliverTime.DTID}`}
          value={deliverTime.dtime}
          onBlur={this.saveDeliverTime(deliverTime).bind(this)}
          onChange={this.changeDeliverTime(deliverTime).bind(this)}
          onKeyDown={this.addCharacterDeliverTime(deliverTime).bind(this)}
        />),
      <Select
      label={`delivertime-repeat_t-${deliverTime.DTID}`}
        options={RunOptions}
        valueKey={"val"}
        nameKey={"name"}
        onChange={this.SelectUpdateDeliverTime("repeat_t", deliverTime).bind(this)}
        initialValue={deliverTime.repeat_t}
      />,
      <ClickableIcon
        altText={`delete-delivertime-${deliverTime.DTID}`}
        src="static/images/decline.svg"
        onClick={this.deleteDeliverTime(deliverTime, this).bind(this)}/>
    ]);
    return tableRow;
  }

  renderAddRow() {
    // Yeah there's dublicate code, that could be solved by some dependency injection & composition magic
    // Sorry for the bad code
    const productionOptions = [];

    let initialRun = undefined;


    for(const [_PTID, production] of this.props.runs){
      if(Number(this.state.new_day) === production.day){
        if(initialRun === undefined){
          initialRun = production.run
        }
        productionOptions.push(production);
      }
    }

    return renderTableRow(-1,[
      <Select
        label={`delivertime-day-new`}
        options={DAYS_OBJECTS}
        valueKey={"day"}
        nameKey={"name"}
        onChange={changeState("new_day", this).bind(this)}
        initialValue={1}
      />,
      <Select
        label={`delivertime-run-new`}
        options={productionOptions}
        valueKey={"run"}
        nameKey={"run"}
        onChange={changeState("new_run")}
        initialValue={initialRun}
      />,
      (<FormControl
          aria-label={`delivertime-dtime-new`}
          value={this.state.new_dtime}
          onChange={changeState("new_dtime", this)}
          onKeyDown={addCharacter(':',"new_dtime",[2,5],this).bind(this)}
        />),
      <Select
        label={`delivertime-repeat_t-new`}
        options={RunOptions}
        valueKey={"val"}
        nameKey={"name"}
        onChange={changeState("new_repeat_t", this).bind(this)}
        initialValue={1}
      />,
      <ClickableIcon
        src={"static/images/accept.svg"}
        onClick={this.createDeliverTime.bind(this)}
        altText={"add-new-delivertime"}
      />
    ]);
  }

  renderbody(){
    const deliverTimes = []
    for(const [_, deliverTime] of this.state.deliverTimes) {
      deliverTimes.push(deliverTime)
    }
    deliverTimes.sort((dt1, dt2) => {
      if (dt1.day - dt2.day != 0){
        return dt1.day - dt2.day
      } else {return dt1.run - dt2.day}
    });
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
              aria-label="customer-realname"
              value={this.state.Realname}
              onChange={changeState("Realname", this)}
              onBlur={this.changeCustomer("Realname",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(2, ["Overhead:", <FormControl
              aria-label="customer-overhead"
              value={this.state.overhead}
              onChange={changeState("overhead", this)}
              onBlur={this.changeCustomer("overhead",
                          this.OverheadValidation).bind(this)}
            />])
          }
          {renderTableRow(3, [
            "Kontakt Person:", <FormControl
            aria-label="customer-contact"
              value={this.state.contact}
              onChange={changeState("contact", this)}
              onBlur={this.changeCustomer("contact",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(4,["Telefon", <FormControl
              aria-label="customer-tlf"
              value = {this.state.tlf}
              onChange={changeState("tlf", this)}
              onBlur={this.changeCustomer("tlf",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(5, ["Afdeling", <FormControl
              aria-label="customer-addr-1"
              value = {this.state.addr1}
              onChange={changeState("addr1", this)}
              onBlur={this.changeCustomer("addr1",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(6, ["Hospital", <FormControl
              aria-label="customer-addr-2"
              value = {this.state.addr2}
              onChange={changeState("addr2", this)}
              onBlur={this.changeCustomer("addr2",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(7, ["Addresse", <FormControl
              aria-label="customer-addr-3"
              value = {this.state.addr3}
              onChange={changeState("addr3", this)}
              onBlur={this.changeCustomer("addr3",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(8, ["Post nummer", <FormControl
              aria-label="customer-addr-4"
              value = {this.state.addr4}
              onChange={changeState("addr4", this)}
              onBlur={this.changeCustomer("addr4",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(9, ["Email", <FormControl
              aria-label="customer-email-1"
              value = {this.state.email}
              onChange={changeState("email", this)}
              onBlur={this.changeCustomer("email",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(10, ["Email", <FormControl
              aria-label="customer-email-2"
              value = {this.state.email2}
              onChange={changeState("email2", this)}
              onBlur={this.changeCustomer("email2",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(11, ["Email", <FormControl
              aria-label="customer-email-3"
              value = {this.state.email3}
              onChange={changeState("email3", this)}
              onBlur={this.changeCustomer("email3",
                          this.AlwaysValidate).bind(this)}
            />])
          }
          {renderTableRow(12, ["Email", <FormControl
              aria-label="customer-email-4"
              value = {this.state.email4}
              onChange={changeState("email4", this)}
              onBlur={this.changeCustomer("email4",
                          this.AlwaysValidate).bind(this)}
            />])
          }
        </tbody>
      </Table>
        {
          this.state.errorMessage != "" ? <AlertBox
            message={this.state.errorMessage}
            level={ERROR_LEVELS.error}
          /> : <div/>
        }
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
        show={true}
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
          <CloseButton onClick={this.props.onClose}/>
        </Modal.Footer>
      </Modal>
    );
  }
}
