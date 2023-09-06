
import React, { useState } from "react";
import { Modal, Button, Table, Row, FormControl, Col, Form, Container, Card, InputGroup } from "react-bootstrap";
import { DAYS, JSON_CUSTOMER, JSON_DELIVER_TIME, JSON_ENDPOINT, JSON_PRODUCTION, JSON_TRACER, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_TIME_SLOTS, PROP_ON_CLOSE, PROP_WEBSOCKET, TRACER_TYPE_ACTIVITY, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_MODEL_CREATE, WEEKLY_REPEAT_CHOICES, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES, WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER, WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC, WEEKLY_TIME_TABLE_PROP_TIME_KEYWORD, } from "../../lib/constants.js";
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
import { TimeInput } from "../injectable/time_form.js";


const RunOptions = [
  {name : "Hver uge", val : 1},
  {name : "Lige uger", val : 2},
  {name : "Ulige uger", val : 3}
];

function MarginInputGroup({children}){
  return (<InputGroup style={{marginTop : "5px"}}>
    {children}
  </InputGroup>)
}


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

export function CustomerModal(props) {
    const /**@type {Customer} */ customer = props[JSON_CUSTOMER].get(props[PROP_ACTIVE_CUSTOMER])
    const endpointIDs = []
    for(const [endpointID, _endpoint] of props[JSON_ENDPOINT]){
      const /**@type {DeliveryEndpoint} */ endpoint = _endpoint

      if(endpoint.owner == customer.id){
        endpointIDs.push(endpointID)
      }
    }

    const activeEndpointID = endpointIDs[0]
    let activeEndpoint = props[JSON_ENDPOINT].get(activeEndpointID);
    let activeTracer = undefined;
    for(const [tracerID, _tracer] of props[JSON_TRACER]){
      const /**@type {Tracer} */ tracer = _tracer
      if(tracer.tracer_type == TRACER_TYPE_ACTIVITY){
        activeTracer = tracerID;
        break;
      }
    }

    if (activeEndpoint === undefined){
      activeEndpoint = {...cleanEndpoint}
    }

    const [state, _setState] = useState({
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
  })

  function setState(newState){
    _setState({...state, ...newState})
  }

  /**
   * Gets how far to the left a time slot should be in the graph
   * @param {ActivityDeliveryTimeSlot} timeSlot
   * @returns {Number}
   */
  function weeklyTimeTableDayGetter(timeSlot) {
    const /**@type {ActivityProduction} */ production = props[JSON_PRODUCTION].get(timeSlot.production_run);
    return production.production_day;
  }

  /**
   * Gets how far down the weekly time table an entry should be
   * @param {ActivityDeliveryTimeSlot} timeSlot - The entry in question
   * @returns {Number}
   */
  function weeklyTimeTableHourGetter(timeSlot) {
    const hour = Number(timeSlot.delivery_time.substring(0,2));
    const minutes = Number(timeSlot.delivery_time.substring(3,5));
    return hour + minutes / 60
  }

  /**
   * This produces the function that is called when the user clicks on an floating
   * timeslot (entry)
   * @param {ActivityDeliveryTimeSlot} entry
   */
  function weeklyTimeTableEntryOnClick(entry){
    return (_event) => {
      setState({
        activeTimeSlot : entry.id,
        tempTimeSlot : {...entry},
        timeSlotDirty: false
      })
    }
  }


  function weeklyTimeTableInnerText(entry){
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
   * get the color of said entry
   * @param {ActivityDeliveryTimeSlot} entry - 
   * @returns {string}
   */
  function weeklyTimeTableEntryColor(entry){
    if(entry.id == state.activeTimeSlot){
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

  /**
   * creates a label to be tagged to the cell, created by the entry
   * @param {ActivityDeliveryTimeSlot} entry - entry in question
   * @returns {String}
   */
  function weeklyTimeTableLabelFunction(entry){
    // This function exists to create targets for test to select for
    return `time-slot-${entry.id}`
  }


  function changeTempObject(tempObjectKeyword, tempKeyword, dirtyKeyword){
    const event_function = (event) => {
      const newState = {...state};
      const newTempObject = state[tempObjectKeyword]
      newTempObject[tempKeyword] = event.target.value;
      newState[tempObjectKeyword] = newTempObject;
      newState[dirtyKeyword] = true;
      setState(newState)
    }
    return event_function
  }

  /**
   * Checks if the timeslot's field contains valid data
   * @param {ActivityDeliveryTimeSlot} timeSlot - timeslot in question
   * @returns {bool} - True if timeSlot is valid, false otherwise.
   */
  function validateTimeSlot(timeSlot){
    const delivery_time = FormatTime(timeSlot.delivery_time)
    if(delivery_time === null){
      return false;
    }

    if(!state.activeEndpoint){ // database indexes are 1 index therefore always return true on valid endpotin
      return false
    }

    return true;
  }

  /**
   * Function called in response to the user clicking the plus icon over Endpoints
   *
   * Should update state for a new endpoint to be filled
   */
  function initializeEndpoint(){
    setState({
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
  function initializeTimeSlotEndpoint(){
    setState({
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
  function confirmCustomer(){
    const customer = {...state.tempCustomer}

    props[PROP_WEBSOCKET].sendEditModel(JSON_CUSTOMER, [customer]).then(() => {
      setState({customerDirty : false})
    })
  }


  /**
   * Function called in response to the user clicking accept key on endpoint
   *
   * Should update the TimeSlot or create a new time slot if activeTimeSlot is undefined
   */
  function confirmEndpoint(){
    // This is the object that will be send to the server
    const endpoint = {...state.tempEndpoint};
    endpoint.owner = props[PROP_ACTIVE_CUSTOMER];
    let promise;
    if(state.activeEndpoint === undefined){
      promise = props[PROP_WEBSOCKET].sendCreateModel(JSON_ENDPOINT, [endpoint])
    } else {
      promise = props[PROP_WEBSOCKET].sendEditModel(JSON_ENDPOINT, [endpoint])
    }
    promise.then((response) => {
      const map = ParseDjangoModelJson(response[WEBSOCKET_DATA][JSON_ENDPOINT])

      let endpointID, endpoint;
      for(const [_endpointID, _endpoint] of map){ // it's only one iteration long
        endpointID = _endpointID;
        endpoint = _endpoint;
        break;
      }

      setState({
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
  function confirmTimeSlot(){
    if(!validateTimeSlot(state.tempTimeSlot)){
      // validateTimeSlot is responsible for updating state, such that errors
      // are displayed
      return;
    }
    // This is the object that will be send to the server
    const timeSlot = {...state.tempTimeSlot};
    timeSlot.destination = state.activeEndpoint
    timeSlot.delivery_time = FormatTime(state.tempTimeSlot.delivery_time);
    let promise;

    if(state.activeTimeSlot === undefined){
      promise = props[PROP_WEBSOCKET].sendCreateModel(JSON_DELIVER_TIME, [timeSlot])
    } else {
      promise = props[PROP_WEBSOCKET].sendEditModel(JSON_DELIVER_TIME, [timeSlot])
    }
    promise.then((_data) => {
      setState({timeSlotDirty : false, tempTimeSlot : {...cleanTimeSlot} })
    })
  }


  function renderCustomerConfiguration(){
    //const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(this.props[PROP_ACTIVE_CUSTOMER])
    const tempCustomerShortName = nullParser(state.tempCustomer.short_name);
    const tempCustomerLongName = nullParser(state.tempCustomer.long_name);
    const tempCustomerBillingAddress = nullParser(state.tempCustomer.billing_address);
    const tempCustomerBillingCity = nullParser(state.tempCustomer.billing_city);
    const tempCustomerBillingZipCode = nullParser(state.tempCustomer.zip_code);
    const tempCustomerBillingBillingEmail = nullParser(state.tempCustomer.billing_email);

    return (<Col>
      <Row>
        <Col><h4>Kunde</h4></Col>
        {state.customerDirty ?
          <Col style={{ justifyContent : "right", display: "flex"}}>
            <ClickableIcon
              aria-label="customer-dirty"
              src={"static/images/accept.svg"}
              onClick={confirmCustomer}/>
          </Col> : ""}
      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Internt Navn</InputGroup.Text>
        <Form.Control
          value={tempCustomerShortName}
          onChange={changeTempObject('tempCustomer', 'short_name', 'customerDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Kunde Navn</InputGroup.Text>
        <Form.Control
          value={tempCustomerLongName}
          onChange={changeTempObject('tempCustomer', 'long_name', 'customerDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Addresse</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingAddress}
          onChange={changeTempObject('tempCustomer', 'billing_address', 'customerDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings By</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingCity}
          onChange={changeTempObject('tempCustomer', 'billing_city', 'customerDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Post nummer</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingZipCode}
          onChange={changeTempObject('tempCustomer', 'billing_zip_code', 'customerDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Email</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingBillingEmail}
          onChange={changeTempObject('tempCustomer', 'billing_email', 'customerDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Dispenser id</InputGroup.Text>
        <Form.Control
          value={state.tempCustomer.dispenser_id}
          onChange={changeTempObject('tempCustomer', 'dispenser_id', 'customerDirty')}
        />
      </MarginInputGroup>
    </Col>)
  }

  function renderActiveEndpoint(){
    const /**@type {DeliveryEndpoint} */ endpoint = props[JSON_ENDPOINT].get(state.activeEndpoint)

    const endpointOptions = [];
    for(const [endpointID, _endpoint] of props[JSON_ENDPOINT]){
      const /**@type {DeliveryEndpoint} */ endpoint = _endpoint;
      if(endpoint.owner === props[PROP_ACTIVE_CUSTOMER]){
        endpointOptions.push({id : endpointID, name : endpoint.name})
      }
    }
    const activityTracersOptions = [];
    for(const [tracerID, _tracer] of props[JSON_TRACER]){
      const /**@type {Tracer} */ tracer = _tracer
      if(tracer.tracer_type == TRACER_TYPE_ACTIVITY){
        activityTracersOptions.push({id : tracerID, name : tracer.shortname});
      }
    }

    const tempEndpointName = nullParser(state.tempEndpoint.name);
    const tempEndpointAddress = nullParser(state.tempEndpoint.address);
    const tempEndpointCity = nullParser(state.tempEndpoint.city);
    const tempEndpointZipCode = nullParser(state.tempEndpoint.zip_code);
    const tempEndpointPhone = nullParser(state.tempEndpoint.phone);

    return(<Col>
      <Row>
        <Col><h4>LeveringsSted</h4></Col>
        <Col style={{display: "flex", justifyContent: "right"}}>
          {state.endpointDirty ? <ClickableIcon
                                        src={"static/images/accept.svg"}
                                        onClick={confirmEndpoint}
                                        /> : ""}
          {state.activeEndpoint != undefined
            ? <ClickableIcon
                src={"static/images/plus.svg"}
                onClick={initializeEndpoint}
              /> : ""}
        </Col>
      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Leveringssteder</InputGroup.Text>
        <Select
          options={endpointOptions}
          nameKey='name'
          valueKey='id'
          onChange={() => {}}
          value={state.activeEndpoint}
        ></Select>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Aktivitets Tracer</InputGroup.Text>
        <Select
          options={activityTracersOptions}
          nameKey="name"
          valueKey="id"
          value={state.activeTracer}
          onChange={() => {}}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Internt Navn</InputGroup.Text>
        <Form.Control
          value={tempEndpointName}
          onChange={changeTempObject('tempEndpoint', 'name', 'endpointDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Addresse</InputGroup.Text>
        <Form.Control
          value={tempEndpointAddress}
          onChange={changeTempObject('tempEndpoint', 'address', 'endpointDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings By</InputGroup.Text>
        <Form.Control
          value={tempEndpointCity}
          onChange={changeTempObject('tempEndpoint', 'city', 'endpointDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Postnummer</InputGroup.Text>
        <Form.Control
          onChange={changeTempObject('tempEndpoint', 'zip_code', 'endpointDirty')}
          value={tempEndpointZipCode}></Form.Control>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings telefonnummer</InputGroup.Text>
        <Form.Control
          onChange={changeTempObject('tempEndpoint', 'phone', 'endpointDirty')}
          value={tempEndpointPhone}
        />
      </MarginInputGroup>
    </Col>)
  }

  function renderDeliveryTimeTable(){
    const timeSlots = []
    const /**@type {DeliveryEndpoint} */ endpoint = (state.activeEndpoint != undefined) ? props[JSON_ENDPOINT].get(state.activeEndpoint) : state.tempEndpoint;

    for(const [timeSlotID, _timeSlot] of props[JSON_DELIVER_TIME]){
      const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = _timeSlot;
      // Note that if it's a new endpoint, then id is undefined
      if(timeSlot.destination == endpoint.id){
        timeSlots.push(timeSlot);
      }
    }

    const weeklyTimeTableProps = {};
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRIES] = timeSlots;
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_DAY_GETTER] = weeklyTimeTableDayGetter;
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] = weeklyTimeTableHourGetter;
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] = weeklyTimeTableEntryOnClick;
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] = weeklyTimeTableEntryColor;
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_INNER_TEXT] = weeklyTimeTableInnerText;
    weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_LABEL_FUNC] = weeklyTimeTableLabelFunction;

    return(<WeeklyTimeTable {...weeklyTimeTableProps}/>);
  }

  function renderActiveTimeSlot(){
    const timeSlot = props[JSON_DELIVER_TIME].get(state.activeTimeSlot)

    const WeeklyRepeatOptions = [
      { id : 0, name : "Alle Uger"},
      { id : 1, name : "Lige Uger"},
      { id : 2, name : "Ulige Uger"},
    ]

    const productionOptions = [];
    for(const [productionID, _production] of props[JSON_PRODUCTION]){
      const /**@type {ActivityProduction} */ production = _production;
      productionOptions.push({
        id : productionID, name : `${getDateName(production.production_day)} - ${production.production_time}`
      })
    }

    return (<Col>
      <Row>
        <Col><h4>Leveringstidspunkt</h4></Col>
        <Col xs="4" style={{display:"flex", justifyContent : "right"}}>
        {state.timeSlotDirty ?
          <ClickableIcon
            label="time-slot-edit"
            src={"static/images/accept.svg"}
            onClick={confirmTimeSlot}
          /> : ""}
        {state.activeTimeSlot != undefined ?
          <ClickableIcon
            label="time-slot-create"
            src={"static/images/plus.svg"}
            onClick={initializeTimeSlotEndpoint}
          /> : ""}
        </Col>

      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Leveringstid</InputGroup.Text>
        <TimeInput
          aria-label="time-slot-delivery-time"
          value={state.tempTimeSlot.delivery_time}
          stateFunction={changeTempObject('tempTimeSlot', 'delivery_time', 'timeSlotDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Ugenlig gentagelse</InputGroup.Text>
        <Select
          aria-label="weekly-select"
          options={WeeklyRepeatOptions}
          nameKey={"name"}
          valueKey ={"id"}
          onChange={changeTempObject('tempTimeSlot', 'weekly_repeat', 'timeSlotDirty')}
          value={state.tempTimeSlot.weekly_repeat}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Levering fra Production</InputGroup.Text>
        <Select
          options={productionOptions}
          nameKey={"name"}
          valueKey ={"id"}
          onChange={changeTempObject('tempTimeSlot', 'production_run', 'timeSlotDirty')}
          value={state.tempTimeSlot.production_run}
          aria-label="production-select"
        />
      </MarginInputGroup>
    </Col>)
  }



  return (
    <Modal
      show={true}
      size="xl"
      onHide ={props[PROP_ON_CLOSE]}
      className = {styles.mariLight}
    >
      <Modal.Header>
        <Modal.Title>Kunde Konfigurering - {customer.short_name} </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            {renderCustomerConfiguration()}
            {renderActiveEndpoint()}
            {renderActiveTimeSlot()}
          </Row>
          <br></br>
          <Row>{renderDeliveryTimeTable()}</Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <CloseButton onClick={props[PROP_ON_CLOSE]}/>
      </Modal.Footer>
    </Modal>
  );
}

