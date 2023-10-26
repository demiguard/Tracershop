
import React, { useEffect, useRef, useState } from "react";
import { Modal, Row, FormControl, Col, Form, Container, Card, InputGroup } from "react-bootstrap";
import propTypes from "prop-types";

import { DAYS, PROP_ACTIVE_CUSTOMER, PROP_ON_CLOSE, TRACER_TYPE,
  WEEKLY_REPEAT_CHOICES, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES,
  WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
   WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC} from "~/lib/constants.js";
import { DATA_CUSTOMER, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_PRODUCTION, DATA_TRACER,
  WEBSOCKET_DATA } from "~/lib/shared_constants.js"
import { CloseButton } from "../injectable/buttons.js";
import { Select, toOptions } from "../injectable/select.js"
import { ClickableIcon } from "../injectable/icons.js";

import { WeeklyTimeTable } from "../injectable/weekly_time_table.js"

import styles from '~/css/Site.module.css'
import { ActivityDeliveryTimeSlot, ActivityProduction, Customer, DeliveryEndpoint, Tracer } from "~/dataclasses/dataclasses.js";
import { FormatTime, ParseDjangoModelJson, getDateName, nullParser } from "~/lib/formatting.js";
import { TimeInput } from "../injectable/inputs/time_input.js";
import { EndpointSelect } from "../injectable/derived_injectables/endpoint_select.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { setStateToEvent } from "~/lib/state_management.js";

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

export function CustomerModal({
  active_customer, on_close
}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const customer = state.customer.get(active_customer);

  const endpoints = []
  for(const endpoint of state.delivery_endpoint.values()){
    if(endpoint.owner == customer.id){
      endpoints.push(endpoint);
    }
  }


  const init = useRef({
    initial_endpoint : null,
    initial_tracer : null,
    initial_tempEndpoint : null
  });

  if(init.current.initial_endpoint === null
    || init.current.initial_tracer === null
    || init.current.initial_tempEndpoint === null)
    {
      const endpoint_exists = endpoints.length > 0;
      init.current.initial_endpoint = (endpoint_exists) ? endpoints[0].id : "";
      init.current.initial_tempEndpoint = (endpoint_exists) ?
          {...endpoints[0]}
        : {...cleanEndpoint};

      init.current.initial_tracer = ""
      for(const tracer of state.tracer.values()){
        if(tracer.tracer_type == TRACER_TYPE.ACTIVITY){
          init.current.initial_tracer = tracer.id;
          break;
        }
      }
    }

    const [activeEndpoint, _setActiveEndpoint] = useState(init.current.initial_endpoint);
    const [activeTracer,   _setActiveTracer] = useState(init.current.initial_tracer);
    const [activeTimeSlot, setActiveTimeSlot] = useState("");

    // Note, that I recreate the object to ensure that there is no reference to the init object.
    // As the React docs where very much a DON'T RENDER REFs!
    // I am unsure if this is needed or not, because it's a state
    // Again this potential inefficiency is a O(1).

    const [tempTimeSlot, setTempTimeSlot] = useState({...cleanTimeSlot})
    const [errors, setErrors] = useState({})

    function setActiveEndpoint(newEndpoint){
      _setActiveEndpoint(newEndpoint);
    }

    function setActiveTracer(newTracer){
      _setActiveTracer(newTracer);
    }

  /**
   * Function called in response to the user clicking the plus icon over Endpoints
   *
   * Should update state for a new endpoint to be filled
   */
  function initializeEndpoint(){}
  /**
   * Function called in response to the user clicking the plus icon over Time slots
   *
   * Should update state for a new endpoint to be filled
   */
  function initializeTimeSlotEndpoint(){}


  function CustomerConfiguration(){
    const [tempCustomer, _setTempCustomer] = useState({...customer});

    function setTempCustomer(kw){
      return (event) => {
        _setTempCustomer({...tempCustomer, [kw] : event.target.value })
      }
    }

    const tempCustomerShortName = nullParser(tempCustomer.short_name);
    const tempCustomerLongName = nullParser(tempCustomer.long_name);
    const tempCustomerBillingAddress = nullParser(tempCustomer.billing_address);
    const tempCustomerBillingCity = nullParser(tempCustomer.billing_city);
    const tempCustomerBillingZipCode = nullParser(tempCustomer.zip_code);
    const tempCustomerBillingBillingEmail = nullParser(tempCustomer.billing_email);

    const customerDirty = tempCustomer.short_name !== customer.short_name
                       || tempCustomer.long_name !== customer.long_name
                       || tempCustomer.billing_address !== customer.billing_address
                       || tempCustomer.billing_city !== customer.billing_city
                       || tempCustomer.zip_code !== customer.zip_code
                       || tempCustomer.billing_email !== customer.billing_email

  /**
   * Function called in response to the user clicking accept key on customers
   *
   * Should update the customer
   */
  function confirmCustomer(){
    const customer = {...tempCustomer}
    websocket.sendEditModel(DATA_CUSTOMER, [customer]);
  }

    return (<Col>
      <Row>
        <Col><h4>Kunde</h4></Col>
        {customerDirty ?
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
          onChange={setTempCustomer('short_name')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Kunde Navn</InputGroup.Text>
        <Form.Control
          value={tempCustomerLongName}
          onChange={setTempCustomer('long_name')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Addresse</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingAddress}
          onChange={setTempCustomer('billing_address')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings By</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingCity}
          onChange={setTempCustomer('billing_city')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Post nummer</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingZipCode}
          onChange={setTempCustomer('billing_zip_code')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Email</InputGroup.Text>
        <Form.Control
          value={tempCustomerBillingBillingEmail}
          onChange={setTempCustomer('billing_email')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Dispenser id</InputGroup.Text>
        <Form.Control
          value={tempCustomer.dispenser_id}
          onChange={setTempCustomer('dispenser_id')}
        />
      </MarginInputGroup>
    </Col>)
  }

  function EndpointConfig({active_endpoint}){

    const endpoint = (typeof(active_endpoint) === 'number') ?
    state.delivery_endpoint.get(active_endpoint)
    : {...cleanEndpoint}
    const activity_tracers = [...state.tracer.values()].filter(
      (tracer) => tracer.tracer_type === TRACER_TYPE.ACTIVITY
      )
    const [tempEndpoint, _setTempEndpoint] = useState({...init.current.initial_tempEndpoint})
    const endpointDirty = endpoint.name === tempEndpoint.name
                        || endpoint.address === tempEndpoint.address
                        || endpoint.city === tempEndpoint.city
                        || endpoint.zip_code === tempEndpoint.zip_code
                        || endpoint.phone === tempEndpoint.phone;

    const activityTracersOptions = toOptions(activity_tracers, 'shortname');

    function setTempEndpoint(kw){
      return (event) => {
        _setTempEndpoint({...tempEndpoint, [kw] : event.target.value })
      }
    }


    const tempEndpointName = nullParser(tempEndpoint.name);
    const tempEndpointAddress = nullParser(tempEndpoint.address);
    const tempEndpointCity = nullParser(tempEndpoint.city);
    const tempEndpointZipCode = nullParser(tempEndpoint.zip_code);
    const tempEndpointPhone = nullParser(tempEndpoint.phone);

  /**
   * Function called in response to the user clicking accept key on endpoint
   *
   * Should update the TimeSlot or create a new time slot if activeTimeSlot is undefined
   */
  function confirmEndpoint(){
    // This is the object that will be send to the server
    const endpoint = {...tempEndpoint};
    endpoint.owner = active_customer;
    if(activeEndpoint === undefined){
      websocket.sendCreateModel(DATA_ENDPOINT, [endpoint]).then((response) => {
        const map = ParseDjangoModelJson(response[WEBSOCKET_DATA][DATA_ENDPOINT])
        for(const endpointID of map.keys()){
          // it's only one iteration long
          setActiveEndpoint(endpointID)
          break;
        }
      });
    } else {
      websocket.sendEditModel(DATA_ENDPOINT, [endpoint])
    }
  }


    return(<Col>
      <Row>
        <Col><h4>LeveringsSted</h4></Col>
        <Col style={{display: "flex", justifyContent: "right"}}>
          {endpointDirty ? <ClickableIcon
                                        src={"static/images/accept.svg"}
                                        onClick={confirmEndpoint}
                                        /> : ""}
          {activeEndpoint != undefined
            ? <ClickableIcon
                src={"static/images/plus.svg"}
                onClick={initializeEndpoint}
              /> : ""}
        </Col>
      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Leveringssteder</InputGroup.Text>
        <EndpointSelect
          options={endpoints}
          onChange={() => {}}
          value={activeEndpoint}
        ></EndpointSelect>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Aktivitets Tracer</InputGroup.Text>
        <Select
          options={activityTracersOptions}
          value={activeTracer}
          onChange={setStateToEvent(setActiveTracer)}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Internt Navn</InputGroup.Text>
        <Form.Control
          value={tempEndpointName}
          onChange={setTempEndpoint('name')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Addresse</InputGroup.Text>
        <Form.Control
          value={tempEndpointAddress}
          onChange={setTempEndpoint('address')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings By</InputGroup.Text>
        <Form.Control
          value={tempEndpointCity}
          onChange={setTempEndpoint('city')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Postnummer</InputGroup.Text>
        <Form.Control
          onChange={setTempEndpoint('zip_code')}
          value={tempEndpointZipCode}></Form.Control>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings telefonnummer</InputGroup.Text>
        <Form.Control
          onChange={setTempEndpoint('phone')}
          value={tempEndpointPhone}
        />
      </MarginInputGroup>
    </Col>)
  }

  function DeliveryTimeTable(){
  /**
   * Gets how far to the left a time slot should be in the graph
   * @param {ActivityDeliveryTimeSlot} timeSlot
   * @returns {Number}
   */
  function weeklyTimeTableDayGetter(timeSlot) {
    const production = state.production.get(timeSlot.production_run);
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
      setActiveTimeSlot(entry.id);
      setTempTimeSlot({...entry});
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
    if(entry.id == activeTimeSlot){
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

    const timeSlots = []

    for(const timeSlot of state.deliver_times.values()){
      if(timeSlot.destination === activeEndpoint){
        timeSlots.push(timeSlot);
      }
    }

    const weeklyTimeTableProps = {
      [WEEKLY_TIME_TABLE_PROP_ENTRIES] : timeSlots,
      [WEEKLY_TIME_TABLE_PROP_DAY_GETTER] : weeklyTimeTableDayGetter,
      [WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] : weeklyTimeTableHourGetter,
      [WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] : weeklyTimeTableEntryOnClick,
      [WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] : weeklyTimeTableEntryColor,
      [WEEKLY_TIME_TABLE_PROP_INNER_TEXT] : weeklyTimeTableInnerText,
      [WEEKLY_TIME_TABLE_PROP_LABEL_FUNC] : weeklyTimeTableLabelFunction,
    };

    return(<WeeklyTimeTable {...weeklyTimeTableProps}/>);
  }

  function ActiveTimeSlotConfig({active_time_slot, active_endpoint, active_tracer}){
    // Use effect here?
    const [tempTimeSlot, _setTempTimeSlot] = useState({...cleanTimeSlot});

    const timeSlotCorrect = (active_time_slot === "") ?
          {...cleanTimeSlot}
        : state.deliver_times.get(active_time_slot);

    const timeSlotDirty = tempTimeSlot.delivery_time === timeSlotCorrect.delivery_time
                       || tempTimeSlot.weekly_repeat === timeSlotCorrect.weekly_repeat
                       || tempTimeSlot.production_run === timeSlotCorrect.production_run;

    useEffect(() => {
      const newTimeSlot = (active_time_slot === "") ?
          cleanTimeSlot
        : state.deliver_times.get(active_time_slot);
      _setTempTimeSlot({...newTimeSlot})
    }, [active_time_slot])


    function setTempTimeSlot(kw){
      return (event) => {
        _setTempTimeSlot({...tempTimeSlot, [kw] : event.target.value })
      }
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

    if(!active_endpoint){ // database indexes are 1 index therefore always return true on valid endpotin
      return false
    }

    return true;
  }


  /**
   * Function called in response to the user clicking accept key on timeslots
   *
   * Should update the TimeSlot or create a new time slot if activeTimeSlot is undefined
   */
  function confirmTimeSlot(){
    if(!validateTimeSlot(tempTimeSlot)){
      // validateTimeSlot is responsible for updating state, such that errors
      // are displayed
      return;
    }
    // This is the object that will be send to the server
    const timeSlot = {...tempTimeSlot};
    timeSlot.destination = active_endpoint
    timeSlot.delivery_time = FormatTime(tempTimeSlot.delivery_time);

    if(activeTimeSlot === undefined){
      websocket.sendCreateModel(DATA_DELIVER_TIME, [timeSlot])
    } else {
      websocket.sendEditModel(DATA_DELIVER_TIME, [timeSlot])
    }
  }


    const WeeklyRepeatOptions = toOptions([
      { id : 0, name : "Alle Uger"},
      { id : 1, name : "Lige Uger"},
      { id : 2, name : "Ulige Uger"},
    ])

    function productionNaming(production){
      `${getDateName(production.production_day)} - ${production.production_time}`
    }

    const filteredProductions = [...state.production.values()].filter(
      (prod) => prod.tracer === active_tracer
    );

    const productionOptions = toOptions(filteredProductions, productionNaming, 'id')


    return (<Col>
      <Row>
        <Col><h4>Leveringstidspunkt</h4></Col>
        <Col xs="4" style={{display:"flex", justifyContent : "right"}}>
        {timeSlotDirty ?
          <ClickableIcon
            label="time-slot-edit"
            src={"static/images/accept.svg"}
            onClick={confirmTimeSlot}
          /> : ""}
        {activeTimeSlot != undefined ?
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
          value={tempTimeSlot.delivery_time}
          stateFunction={setTempTimeSlot('tempTimeSlot', 'delivery_time', 'timeSlotDirty')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Ugenlig gentagelse</InputGroup.Text>
        <Select
          aria-label="weekly-select"
          options={WeeklyRepeatOptions}
          onChange={setTempTimeSlot('tempTimeSlot', 'weekly_repeat', 'timeSlotDirty')}
          value={tempTimeSlot.weekly_repeat}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Levering fra Production</InputGroup.Text>
        <Select
          options={productionOptions}
          onChange={setTempTimeSlot('tempTimeSlot', 'production_run', 'timeSlotDirty')}
          value={tempTimeSlot.production_run}
          aria-label="production-select"
        />
      </MarginInputGroup>
    </Col>)
  }

  return (
    <Modal
      show={true}
      size="xl"
      onHide={on_close}
      className = {styles.mariLight}
    >
      <Modal.Header>
        <Modal.Title>Kunde Konfigurering - {customer.short_name} </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            <CustomerConfiguration/>
            <EndpointConfig active_endpoint={activeEndpoint}/>
            <ActiveTimeSlotConfig
              active_time_slot={activeTimeSlot}
              active_endpoint={activeEndpoint}
              active_tracer={activeTracer}
            />
          </Row>
          <br/>
          <Row>
            <DeliveryTimeTable/>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <CloseButton onClick={on_close}/>
      </Modal.Footer>
    </Modal>
  );
}

