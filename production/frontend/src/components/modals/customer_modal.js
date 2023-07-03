
import React, { Component } from "react";
import { Modal, Button, Table, Row, FormControl, Col, Form, Container, Card, InputGroup } from "react-bootstrap";
import { DAYS, JSON_CUSTOMER, JSON_DELIVER_TIME, JSON_ENDPOINT, JSON_PRODUCTION, JSON_TRACER, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_TIME_SLOTS, PROP_ON_CLOSE, PROP_WEBSOCKET, TRACER_TYPE_ACTIVITY, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_MODEL_CREATE, WEEKLY_REPEAT_CHOICES, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES, WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER, WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_TIME_KEYWORD, } from "../../lib/constants.js";
import { CloseButton } from "../injectable/buttons.js";
import propTypes from "prop-types";
import { Select } from "../injectable/select.js"
import { ClickableIcon } from "../injectable/icons.js";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box.js"
import { WeeklyTimeTable } from "../injectable/weekly_time_table.js"

import styles from '../../css/Site.module.css'
import { ActivityDeliveryTimeSlot, ActivityProduction, Customer, DeliveryEndpoint, Tracer } from "../../dataclasses/dataclasses.js";
import { KEYWORD_ActivityDeliveryTimeSlot_DELIVERY_TIME, KEYWORD_ActivityDeliveryTimeSlot_PRODUCTION_RUN } from "../../dataclasses/keywords.js";
import { FormatTime, ParseDjangoModelJson, getDateName, nullParser } from "../../lib/formatting.js";
import { changeState } from "../../lib/state_management.js";


const RunOptions = [
  {name : "Hver uge", val : 1},
  {name : "Lige uger", val : 2},
  {name : "Ulige uger", val : 3}
];

function MarginInputGroup({children}){
  return <InputGroup style={{marginTop : "5px"}}>
    {children}
  </InputGroup>
}


export { CustomerModal }

const cleanTimeSlot = {
  weekly_repeat : 0,
  delivery_time : "",
  production_run : 0,
};

const cleanEndpoint = {
  name : "",
  address : "",
  city : "",
  zip_code : "",
  phone : "",
}

const timeSlotErrorContainer = {
  delivery_time_error : false,
}


const propType = {}

class CustomerModal extends Component {
  static propTypes = propType

  constructor(props) {
    super(props);

    const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(this.props[PROP_ACTIVE_CUSTOMER])


    const endpointIDs = []
    for(const [endpointID, _endpoint] of this.props[JSON_ENDPOINT]){
      const /**@type {DeliveryEndpoint} */ endpoint = _endpoint

      if(endpoint.owner == customer.id){
        endpointIDs.push(endpointID)
      }
    }

    const activeEndpointID = endpointIDs[0]
    const activeEndpoint = this.props[JSON_ENDPOINT].get(activeEndpointID);
    let activeTracer = undefined;
    for(const [tracerID, _tracer] of this.props[JSON_TRACER]){
      const /**@type {Tracer} */ tracer = _tracer
      if(tracer.tracer_type == TRACER_TYPE_ACTIVITY){
        activeTracer = tracerID;
        break;
      }
    }

    if (activeEndpoint === undefined){
      activeEndpoint = {...cleanEndpoint}
    }

    this.state = {
      errors : {},
      customerDirty : false,
      endpointDirty : false,
      timeSlotDirty : false,
      endpoints : endpointIDs,
      activeEndpoint : activeEndpointID,
      activeTimeSlot : undefined,
      tempCustomer : {...customer},
      tempEndpoint : {...activeEndpoint},
      tempTimeSlot : {...cleanTimeSlot}
  }
}

  /**
   * 
   * @param {ActivityDeliveryTimeSlot} timeSlot 
   * @returns {Number}
   */
  weeklyTimeTableDayGetter(timeSlot) {
    const /**@type {ActivityProduction} */ production = this.props[JSON_PRODUCTION].get(timeSlot.production_run);
    return production.production_day;
  }

  /**
   * 
   * @param {ActivityDeliveryTimeSlot} timeSlot 
   * @returns {Number}
   */
  weeklyTimeTableHourGetter(timeSlot) {
    const hour = Number(timeSlot.delivery_time.substring(0,2));
    const minutes = Number(timeSlot.delivery_time.substring(3,5));
    return hour + minutes / 60
  }

  /**
   * This produces the function that is called when the user clicks on an floating
   * timeslot (entry)
   * @param {ActivityDeliveryTimeSlot} entry
   */
  weeklyTimeTableEntryOnClick(entry){
    const returnFunction = () => {
      this.setState({...this.state, activeTimeSlot : entry.id, tempTimeSlot : {...entry},  timeSlotDirty: false})
    }

    return returnFunction.bind(this)
  }

  weeklyTimeTableInnerText(entry){
    return <div style={{
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto',
      width: '50%',
      //padding : '0px',
    }}><ClickableIcon
      src={"static/images/delivery.svg"}
    /></div>
  }

  /**
   * 
   * @param {*} entry 
   * @returns {string}
   */
  weeklyTimeTableEntryColor(entry){
    if(entry.id == this.state.activeTimeSlot){
      return 'orange';
    }

    if(entry.weekly_repeat == WEEKLY_REPEAT_CHOICES.ALL){
      return 'lightblue';
    }
    if(entry.weekly_repeat == WEEKLY_REPEAT_CHOICES.EVEN){
      return 'lightgreen';
    }
    if(entry.weekly_repeat == WEEKLY_REPEAT_CHOICES.ODD){
      return '#FFEE99';
    }
    throw "Unknown weekly repeat"
  }

  changeTempObject(tempObjectKeyword, tempKeyword, dirtyKeyword){
    const event_function = (event) => {
      const newState = {...this.state};
      const newTempObject = {...this.state[tempObjectKeyword]}
      newTempObject[tempKeyword] = event.target.value;
      newState[tempObjectKeyword] = newTempObject;
      newState[dirtyKeyword] = true;
      this.setState(newState)
    }
    return event_function.bind(this)
  }

  /**
   * Checks if the timeslot's field contains valid data
   * @param {ActivityDeliveryTimeSlot} timeSlot - timeslot in question
   * @returns {bool} - True if timeSlot is valid, false otherwise.
   */
  validateTimeSlot(timeSlot){
    const delivery_time = FormatTime(timeSlot.delivery_time)
    if(delivery_time === null){
      return false;
    }

    if(!this.state.activeEndpoint){ // database indexes are 1 index therefore always return true on valid endpotin
      return false
    }

    return true;
  }

  /**
   * Function called in response to the user clicking the plus icon over Endpoints
   *
   * Should update state for a new endpoint to be filled
   */
  initializeEndpoint(){
    this.setState({
      activeEndpoint : undefined,
      endpointDirty : false,
      tempEndpoint : {...cleanEndpoint},
    })
  }
  /**
   * Function called in response to the user clicking the plus icon over Time slots
   *
   * Should update state for a new endpoint to be filled
   */
  initializeTimeSlotEndpoint(){
    this.setState({
      activeTimeSlot : undefined,
      tempTimeSlot : {...cleanTimeSlot},
      timeSlotDirty : false,
    })
  }

  /**
   * Function called in response to the user clicking accept key on customers
   *
   * Should update the customer
   */
  confirmCustomer(){
    const customer = {...this.state.tempCustomer}

    const promise = this.props[PROP_WEBSOCKET].sendEditModel(JSON_CUSTOMER, [customer]).then(() => {
      this.setState({...this.state, customerDirty : false})
    })
  }


  /**
   * Function called in response to the user clicking accept key on endpoint
   *
   * Should update the TimeSlot or create a new time slot if activeTimeSlot is undefined
   */
  confirmEndpoint(){
    // This is the object that will be send to the server
    const endpoint = {...this.state.tempEndpoint};
    endpoint.owner = this.props[PROP_ACTIVE_CUSTOMER];
    let promise;
    if(this.state.activeEndpoint === undefined){
      promise = this.props[PROP_WEBSOCKET].sendCreateModel(JSON_ENDPOINT, [endpoint])
    } else {
      promise = this.props[PROP_WEBSOCKET].sendEditModel(JSON_ENDPOINT, [endpoint])
    }
    promise.then((response) => {
      console.log(response)
      const map = ParseDjangoModelJson(response[WEBSOCKET_DATA][JSON_ENDPOINT])

      let endpointID, endpoint;
      for(const [_endpointID, _endpoint] of map){ // it's only one iteration long
        endpointID = _endpointID;
        endpoint = _endpoint;
        break;
      }

      this.setState({
        ...this.state,
        endpointDirty : false,
        tempEndpoint: {...endpoint},
        activeEndpoint : endpointID,
      })
    })
  }


  /**
   * Function called in response to the user clicking accept key on timeslots
   *
   * Should update the TimeSlot or create a new time slot if activeTimeSlot is undefined
   */
  confirmTimeSlot(){
    if(!this.validateTimeSlot(this.state.tempTimeSlot)){
      // validateTimeSlot is responsible for updating state, such that errors
      // are displayed
      return;
    }
    // This is the object that will be send to the server
    const timeSlot = {...this.state.tempTimeSlot};
    timeSlot.destination = this.state.activeEndpoint
    timeSlot.delivery_time = FormatTime(this.state.tempTimeSlot.delivery_time);
    let promise;
    if(this.state.activeTimeSlot === undefined){
      promise = this.props[PROP_WEBSOCKET].sendCreateModel(JSON_DELIVER_TIME, [timeSlot])
    } else {
      promise = this.props[PROP_WEBSOCKET].sendEditModel(JSON_DELIVER_TIME, [timeSlot])
    }
    promise.then((_data) => {
      this.setState({...this.state, timeSlotDirty : false, tempTimeSlot : {...cleanTimeSlot} })
    })
  }


  renderCustomerConfiguration(){
    //const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(this.props[PROP_ACTIVE_CUSTOMER])
    const tempCustomerShortName = nullParser(this.state.tempCustomer.short_name);
    const tempCustomerLongName = nullParser(this.state.tempCustomer.long_name);
    const tempCustomerBillingAddress = nullParser(this.state.tempCustomer.billing_address);
    const tempCustomerBillingCity = nullParser(this.state.tempCustomer.billing_city);
    const tempCustomerBillingZipCode = nullParser(this.state.tempCustomer.zip_code);
    const tempCustomerBillingBillingEmail = nullParser(this.state.tempCustomer.billing_email);

    return (<Col>
      <Row>
        <Col><h4>Kunde</h4></Col>
        {this.state.customerDirty ?
          <Col style={{ justifyContent : "right", display: "flex"}}>
            <ClickableIcon src={"static/images/accept.svg"} onClick={this.confirmCustomer.bind(this)}/>
          </Col> : ""}
      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Internt Navn</InputGroup.Text>
        <Form.Control
          value={tempCustomerShortName}
          onChange={this.changeTempObject('tempCustomer', 'short_name', 'customerDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Kunde Navn</InputGroup.Text>
        <Form.Control
          value={tempCustomerLongName}
          onChange={this.changeTempObject('tempCustomer', 'long_name', 'customerDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Addresse</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingAddress}
          onChange={this.changeTempObject('tempCustomer', 'billing_address', 'customerDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings By</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingCity}
          onChange={this.changeTempObject('tempCustomer', 'billing_city', 'customerDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Post nummer</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingZipCode}
          onChange={this.changeTempObject('tempCustomer', 'billing_zip_code', 'customerDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Email</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingBillingEmail}
          onChange={this.changeTempObject('tempCustomer', 'billing_email', 'customerDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Dispenser id</InputGroup.Text>
        <Form.Control
          value={this.state.tempCustomer.dispenser_id}
          onChange={this.changeTempObject('tempCustomer', 'dispenser_id', 'customerDirty').bind(this)}
        />
      </MarginInputGroup>
    </Col>)
  }

  renderActiveEndpoint(){
    const /**@type {DeliveryEndpoint} */ endpoint = this.props[JSON_ENDPOINT].get(this.state.activeEndpoint)

    const endpointOptions = [];
    for(const [endpointID, _endpoint] of this.props[JSON_ENDPOINT]){
      const /**@type {DeliveryEndpoint} */ endpoint = _endpoint;
      if(endpoint.owner === this.props[PROP_ACTIVE_CUSTOMER]){
        endpointOptions.push({id : endpointID, name : endpoint.name})
      }
    }
    const activityTracersOptions = [];
    for(const [tracerID, _tracer] of this.props[JSON_TRACER]){
      const /**@type {Tracer} */ tracer = _tracer
      if(tracer.tracer_type == TRACER_TYPE_ACTIVITY){
        activityTracersOptions.push({id : tracerID, name : tracer.shortname});
      }
    }

    const tempEndpointName = nullParser(this.state.tempEndpoint.name);
    const tempEndpointAddress = nullParser(this.state.tempEndpoint.address);
    const tempEndpointCity = nullParser(this.state.tempEndpoint.city);
    const tempEndpointZipCode = nullParser(this.state.tempEndpoint.zip_code);
    const tempEndpointPhone = nullParser(this.state.tempEndpoint.phone);

    return(<Col>
      <Row>
        <Col><h4>LeveringsSted</h4></Col>
        <Col style={{display: "flex", justifyContent: "right"}}>
          {this.state.endpointDirty ? <ClickableIcon
                                        src={"static/images/accept.svg"}
                                        onClick={this.confirmEndpoint.bind(this)}
                                        /> : ""}
          {this.state.activeEndpoint != undefined
            ? <ClickableIcon
                src={"static/images/plus.svg"}
                onClick={this.initializeEndpoint.bind(this)}
              /> : ""}
        </Col>
      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Leveringssteder</InputGroup.Text>
        <Select
          options={endpointOptions}
          nameKey='name'
          valueKey='id'
          onChange={changeState('activeEndpoint', this)}
          value={this.state.activeEndpoint}
        ></Select>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Aktivitets Tracer</InputGroup.Text>
        <Select
          options={activityTracersOptions}
          nameKey="name"
          valueKey="id"
          value={this.state.activeTracer}
          onChange={changeState('activeTracer', this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Internt Navn</InputGroup.Text>
        <Form.Control
          value={tempEndpointName}
          onChange={this.changeTempObject('tempEndpoint', 'name', 'endpointDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Addresse</InputGroup.Text>
        <Form.Control
          value={tempEndpointAddress}
          onChange={this.changeTempObject('tempEndpoint', 'address', 'endpointDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings By</InputGroup.Text>
        <Form.Control
          value={tempEndpointCity}
          onChange={this.changeTempObject('tempEndpoint', 'city', 'endpointDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Postnummer</InputGroup.Text>
        <Form.Control
          onChange={this.changeTempObject('tempEndpoint', 'zip_code', 'endpointDirty').bind(this)}
          value={tempEndpointZipCode}></Form.Control>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings telefonnummer</InputGroup.Text>
        <Form.Control
          onChange={this.changeTempObject('tempEndpoint', 'phone', 'endpointDirty').bind(this)}
          value={tempEndpointPhone}
        />
      </MarginInputGroup>
    </Col>)
  }

  renderDeliveryTimeTable(){
    const timeSlots = []
    const /**@type {DeliveryEndpoint} */ endpoint = (this.state.activeEndpoint != undefined) ? this.props[JSON_ENDPOINT].get(this.state.activeEndpoint) : this.state.tempEndpoint;

    for(const [timeSlotID, _timeSlot] of this.props[JSON_DELIVER_TIME]){
      const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = _timeSlot;
      // Note that if it's a new endpoint, then id is undefined
      if(timeSlot.destination == endpoint.id){
        timeSlots.push(timeSlot);
      }
    }

    const weeklyTimeTableProps = {};
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRIES] = timeSlots;
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_DAY_GETTER] = this.weeklyTimeTableDayGetter.bind(this);
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] = this.weeklyTimeTableHourGetter.bind(this); // Bind is redundant
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] = this.weeklyTimeTableEntryOnClick.bind(this);
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] = this.weeklyTimeTableEntryColor.bind(this);
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_INNER_TEXT] = this.weeklyTimeTableInnerText.bind(this);

    return(<WeeklyTimeTable {...weeklyTimeTableProps}/>);
  }

  renderActiveTimeSlot(){
    const timeSlot = this.props[JSON_DELIVER_TIME].get(this.state.activeTimeSlot)

    const WeeklyRepeatOptions = [
      { id : 0, name : "Alle Uger"},
      { id : 1, name : "Lige Uger"},
      { id : 2, name : "Ulige Uger"},
    ]

    const productionOptions = [];
    for(const [productionID, _production] of this.props[JSON_PRODUCTION]){
      const /**@type {ActivityProduction} */ production = _production;
      productionOptions.push({
        id : productionID, name : `${getDateName(production.production_day)} - ${production.production_time}`
      })
    }

    return (<Col>
      <Row>
        <Col><h4>Leveringstidspunkt</h4></Col>
        <Col xs="4" style={{display:"flex", justifyContent : "right"}}>
        {this.state.timeSlotDirty ?
          <ClickableIcon
            src={"static/images/accept.svg"}
            onClick={this.confirmTimeSlot.bind(this)}
          /> : ""}
        {this.state.activeTimeSlot != undefined ?
          <ClickableIcon
            src={"static/images/plus.svg"}
            onClick={this.initializeTimeSlotEndpoint.bind(this)}
          /> : ""}
        </Col>

      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Leveringstid</InputGroup.Text>
        <Form.Control
          value={this.state.tempTimeSlot.delivery_time}
          onChange={this.changeTempObject('tempTimeSlot', 'delivery_time', 'timeSlotDirty').bind(this)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Ugenlig gentagelse</InputGroup.Text>
        <Select
          options={WeeklyRepeatOptions}
          nameKey={"name"}
          valueKey ={"id"}
          onChange={this.changeTempObject('tempTimeSlot', 'weekly_repeat', 'timeSlotDirty').bind(this)}
          value={this.state.tempTimeSlot.weekly_repeat}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Levering fra Production</InputGroup.Text>
        <Select
          options={productionOptions}
          nameKey={"name"}
          valueKey ={"id"}
          onChange={this.changeTempObject('tempTimeSlot', 'production_run', 'timeSlotDirty').bind(this)}
          value={this.state.tempTimeSlot.production_run}
        />
      </MarginInputGroup>
    </Col>)

  }


  render() {
    console.log(this.props, this.state)

    const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(this.props[PROP_ACTIVE_CUSTOMER])

    return (
      <Modal
        show={true}
        size="xl"
        onHide ={this.props[PROP_ON_CLOSE]}
        className = {styles.mariLight}
      >
        <Modal.Header>
          <Modal.Title>Kunde Konfigurering - {customer.short_name} </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              {this.renderCustomerConfiguration()}
              {this.renderActiveEndpoint()}
              {this.renderActiveTimeSlot()}
            </Row>
            <br></br>
            <Row>{this.renderDeliveryTimeTable()}</Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <CloseButton onClick={this.props[PROP_ON_CLOSE]}/>
        </Modal.Footer>
      </Modal>
    );
  }
}
