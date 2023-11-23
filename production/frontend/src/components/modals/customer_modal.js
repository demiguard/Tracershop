
import React, { useEffect, useRef, useState } from "react";
import { Modal, Row, FormControl, Col, Form, Container, Card, InputGroup } from "react-bootstrap";
import propTypes from "prop-types";

import { DAYS, PROP_ACTIVE_CUSTOMER, PROP_ON_CLOSE, TRACER_TYPE,
  WEEKLY_REPEAT_CHOICES, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES,
  WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
   WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC} from "~/lib/constants.js";
import { DATA_CUSTOMER, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_PRODUCTION, DATA_TRACER,
  DATA_TRACER_MAPPING,
  WEBSOCKET_DATA } from "~/lib/shared_constants.js"
import { CloseButton } from "../injectable/buttons.js";
import { Select, toOptions } from "../injectable/select.js"
import { ClickableIcon } from "../injectable/icons.js";

import { WeeklyTimeTable } from "../injectable/weekly_time_table.js"

import styles from '~/css/Site.module.css'
import { ActivityDeliveryTimeSlot, ActivityProduction, Customer, DeliveryEndpoint, Tracer, TracerCatalogPage } from "~/dataclasses/dataclasses.js";
import { FormatTime, ParseDjangoModelJson, getDateName, nullParser } from "~/lib/formatting.js";
import { TimeInput } from "../injectable/inputs/time_input.js";
import { EndpointSelect } from "../injectable/derived_injectables/endpoint_select.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { setStateToEvent, setTempObjectToEvent } from "~/lib/state_management.js";
import { compareLoosely } from "~/lib/utils.js";
import { CommitButton } from "../injectable/commit_button.js";
import { parseDanishPositiveNumberInput, parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input.js";
import { ErrorInput } from "../injectable/inputs/error_input.js";
import { clone } from "~/lib/serialization.js";

function MarginInputGroup({children}){
  return (<InputGroup style={{marginTop : "5px"}}>
    {children}
  </InputGroup>)
}

const cleanTimeSlot = {
  weekly_repeat : 0,
  delivery_time : "",
  production_run : 0,
  id : -1,
};

export function CustomerModal({
  active_customer, on_close
}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const customer = state.customer.get(active_customer);

  const cleanEndpoint = new DeliveryEndpoint(
    -1, // id 
    "Nyt", // name 
    "", // address 
    "", // city 
    "", // zip_code 
    "", // phone 
    active_customer
  )
  

  const endpoints = []
  for(const endpoint of state.delivery_endpoint.values()){
    if(endpoint.owner == customer.id){
      endpoints.push(endpoint);
    }
  }

  endpoints.push(clone(
    cleanEndpoint, DATA_ENDPOINT
  ));

  function initializeOverhead(endpointID, tracerID){
    for(const tracerCatalogPage of state.tracer_mapping.values()){
      if(tracerCatalogPage.endpoint === endpointID &&
          tracerCatalogPage.tracer === tracerID ){
          return [tracerCatalogPage.id, String(Math.round((tracerCatalogPage.overhead_multiplier - 1) * 100))];
        }
    }
    return [null, "0"];
  }


  const init = useRef({
    initial_endpoint : null,
    initial_tracer : null,
  });

  if(init.current.initial_endpoint === null
    || init.current.initial_tracer === null)
    {
      const endpoint_exists = endpoints.length > 0;
      init.current.initial_endpoint = (endpoint_exists) ? endpoints[0].id : -1;
      init.current.initial_tracer = ""
      for(const tracer of state.tracer.values()){
        if(tracer.tracer_type == TRACER_TYPE.ACTIVITY
           && !tracer.archived){
          init.current.initial_tracer = tracer.id;
          break;
        }
      }
    }
  const endpoint = 0 < init.current.initial_endpoint ?
    state.delivery_endpoint.get(init.current.initial_endpoint) : cleanEndpoint;

  const [tempTimeSlot, setTempTimeSlot] = useState({...cleanTimeSlot});
  const [endpointError, setEndpointError] = useState("");

  const [tempEndpoint, setTempEndpoint] = useState({...endpoint});
  const [activeTracer,   _setActiveTracer] = useState(init.current.initial_tracer);

  // Note that the tracerPage Id is unique on each render
  const [tracerPageId, initialOverhead] = initializeOverhead(tempEndpoint.id, activeTracer);
  const [overhead, setOverhead] = useState(initialOverhead);

  function initializeNewTimeSlot(){
    setTempTimeSlot({...cleanTimeSlot});
  }



  // These function should also import tempTimeSlot
  function setActiveEndpoint(newEndpointID){
    newEndpointID = Number(newEndpointID);
    if(newEndpointID === tempEndpoint.id){
      return;
    }

    const [, overhead] = initializeOverhead(newEndpointID, activeTracer);

    initializeNewTimeSlot();
    setOverhead(overhead);
  }

  function setActiveTracer(newTracer){
    newTracer = Number(newTracer);
    if(newTracer === activeTracer){
      return;
    }
    _setActiveTracer(newTracer);
    const [, overhead] = initializeOverhead(tempEndpoint.id, newTracer);
    setOverhead(overhead);
    initializeNewTimeSlot();
  }


  function CustomerConfiguration(){
    const [tempCustomer, setTempCustomer] = useState({...customer});
    const customerDirty = !compareLoosely(customer, tempCustomer);
    const [dispenserError, setDispenserError] = useState("");
  /**
   * Function called in response to the user clicking accept key on customers
   *
   * Should update the customer
   */
  function validateCustomer(){
    let dispenser = null;
    if(tempCustomer.dispenser_id) {
      const [validDispenser, n_dispenser] = parseWholePositiveNumber(tempCustomer.dispenser_id, 'Dispenser ID');

      if(!validDispenser){
        setDispenserError(dispenser);
        return [false,{}];
      }
      dispenser = n_dispenser;
    }
    setDispenserError("");

    return [true, {...tempCustomer, dispenser_id : dispenser}];
  }

    return (<Col>
      <Row>
        <Col><h4>Kunde</h4></Col>
        {customerDirty ?
          <Col style={{ justifyContent : "right", display: "flex"}}>
            <CommitButton
              label="customer-commit"
              temp_object={tempCustomer}
              object_type={DATA_CUSTOMER}
              validate={validateCustomer}/>
          </Col> : ""}
      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Internt Navn</InputGroup.Text>
        <Form.Control
          aria-label="short-name-input"
          value={nullParser(tempCustomer.short_name)}
          onChange={setTempObjectToEvent(setTempCustomer, 'short_name')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Kunde Navn</InputGroup.Text>
        <Form.Control
          aria-label="long-name-input"
          value={nullParser(tempCustomer.long_name)}
          onChange={setTempObjectToEvent(setTempCustomer, 'long_name')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Addresse</InputGroup.Text>
        <Form.Control
          aria-label="address-input"
          value={nullParser(tempCustomer.billing_address)}
          onChange={setTempObjectToEvent(setTempCustomer,'billing_address')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings By</InputGroup.Text>
        <Form.Control
          aria-label="city-input"
          value={nullParser(tempCustomer.billing_city)}
          onChange={setTempObjectToEvent(setTempCustomer,'billing_city')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Post nummer</InputGroup.Text>
        <Form.Control
          aria-label="zip-input"
          value={nullParser(tempCustomer.zip_code)}
          onChange={setTempObjectToEvent(setTempCustomer,'billing_zip_code')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Regnings Email</InputGroup.Text>
        <Form.Control
          aria-label="email-input"
          value={nullParser(tempCustomer.billing_email)}
          onChange={setTempObjectToEvent(setTempCustomer,'billing_email')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Dispenser id</InputGroup.Text>
        <ErrorInput>
          <Form.Control
            aria-label="dispenser-input"
            value={nullParser(tempCustomer.dispenser_id)}
            onChange={setTempObjectToEvent(setTempCustomer,'dispenser_id')}
          />
        </ErrorInput>
      </MarginInputGroup>
    </Col>)
  }

  function EndpointConfig(){
    const endpointDirty = !compareLoosely(endpoint, tempEndpoint);

    function validateEndpoint(){
      return [true, {...tempEndpoint, owner : active_customer}]
    }

    function commit_callback(response){
      if(tempEndpoint.id === -1){
        const map = ParseDjangoModelJson(response[WEBSOCKET_DATA][DATA_ENDPOINT])
          for(const endpointID of map.keys()){
            // it's only one iteration long
            setActiveEndpoint(endpointID);
            break;
        }
      }
    }

    return(<Col aria-label={`active-endpoint-${tempEndpoint.id}`}>
      <Row>
        <Col><h4>LeveringsSted</h4></Col>
        <Col style={{display: "flex", justifyContent: "right"}}>
          {endpointDirty ? <CommitButton
                              temp_object={tempEndpoint}
                              validate={validateEndpoint}
                              callback={commit_callback}
                              object_type={DATA_ENDPOINT}
                              label="commit-endpoint"
                           /> : ""}
        </Col>
      </Row>
      <MarginInputGroup>
        <InputGroup.Text>Leveringssteder</InputGroup.Text>
        <ErrorInput error={endpointError}>
          <EndpointSelect
            aria-label="endpoint-select"
            delivery_endpoint={endpoints}
            onChange={(event) => setActiveEndpoint(event.target.value)}
            value={tempEndpoint.id}
          />
        </ErrorInput>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Internt Navn</InputGroup.Text>
        <Form.Control
          value={nullParser(tempEndpoint.name)}
          onChange={setTempObjectToEvent(setTempEndpoint, 'name')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Addresse</InputGroup.Text>
        <Form.Control
          value={nullParser(tempEndpoint.address)}
          onChange={setTempObjectToEvent(setTempEndpoint, 'name')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings By</InputGroup.Text>
        <Form.Control
          value={nullParser(tempEndpoint.city)}
          onChange={setTempObjectToEvent(setTempEndpoint, 'city')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings Postnummer</InputGroup.Text>
        <Form.Control
          value={nullParser(tempEndpoint.zip_code)}
          onChange={setTempObjectToEvent(setTempEndpoint,'zip_code')}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Leverings telefonnummer</InputGroup.Text>
        <Form.Control
          value={nullParser(tempEndpoint.phone)}
          onChange={setTempObjectToEvent(setTempEndpoint,'phone')}
        />
      </MarginInputGroup>
    </Col>);
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
    setTempTimeSlot({...entry});
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
    if(entry.id == tempTimeSlot.id){
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
      if(timeSlot.destination === tempEndpoint.id){
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

  function ActiveTimeSlotConfig(){
    // Note that tempTimeSlot cannot be a state value here as it might
    // Change when the user changes endpoint.
    const timeSlotCorrect = (tempTimeSlot.id === -1) ? cleanTimeSlot : state.deliver_times.get(tempTimeSlot.id);
    const timeSlotDirty = !compareLoosely(timeSlotCorrect, tempTimeSlot);
    const [deliveryTimeError, setDeliveryTimeError] = useState("");
    const [overheadError, setOverheadError] = useState("");

    const tracerCatalogPage = tracerPageId !== null ? state.tracer_mapping.get(tracerPageId) :
        new TracerCatalogPage(-1, tempEndpoint.id, activeTracer, 1, )

    tempTimeSlot.delivery_time === timeSlotCorrect.delivery_time
                       || tempTimeSlot.weekly_repeat === timeSlotCorrect.weekly_repeat
                       || tempTimeSlot.production_run === timeSlotCorrect.production_run;

    function setTempTimeSlotDeliveryTime(value){
      setTempTimeSlot(obj => {return {
        ...obj, delivery_time : value
      }});
    }

    function validateOverhead(){
      const [validOverhead, parsedOverhead] = parseDanishPositiveNumberInput(overhead, "Overhead");

      if(!validOverhead){
        setOverheadError(parsedOverhead);
        return [false, {}];
      }

      setOverheadError("");

      return [true, {...tracerCatalogPage, overhead_multiplier : parsedOverhead / 100 + 1}];
    }

    /**
     * Function called in response to the user clicking accept key on timeslots
     *
     * Should update the TimeSlot or create a new time slot if activeTimeSlot is undefined
     */
    function validateTimeSlot(){
      const [validDeliveryTime, deliveryTime] = parseTimeInput(tempTimeSlot.delivery_time, 'Leverings tiden');

      if(!validDeliveryTime){
        setDeliveryTimeError(deliveryTime);
        return [false, {}];
      }

      setDeliveryTimeError("");

      if(tempEndpoint.id === -1){ // database indexes are 1 index therefore always return true on valid endpoint
        setEndpointError("Man skal oprette et leveringstedet før man kan lave leverings tidspunnkter");
        return [false, {}];
      }
      setEndpointError("");


      // This is the object that will be send to the server
      const timeSlot = {...tempTimeSlot};
      timeSlot.destination = tempEndpoint.id;
      timeSlot.delivery_time = deliveryTime;

      return [true, timeSlot];
    }

    const WeeklyRepeatOptions = toOptions([
      { id : 0, name : "Alle Uger"},
      { id : 1, name : "Lige Uger"},
      { id : 2, name : "Ulige Uger"},
    ]);

    function productionNaming(production){
      return `${getDateName(production.production_day)} - ${production.production_time}`;
    }

    const filteredProductions = [...state.production.values()].filter(
      (prod) => prod.tracer === activeTracer
    );

    const productionOptions = toOptions(filteredProductions, productionNaming, 'id')
    const activity_tracers = [...state.tracer.values()].filter(
      (tracer) => tracer.tracer_type === TRACER_TYPE.ACTIVITY
    );
    const activityTracersOptions = toOptions(activity_tracers, 'shortname');

    return (<Col aria-label={`active-time-slot-${tempTimeSlot.id}`}>
      <Row>
        <Col><h4>Leveringstidspunkt</h4></Col>
        <Col xs="4" style={{display:"flex", justifyContent : "right"}}>
        {timeSlotDirty ?
          <CommitButton
            temp_object={tempTimeSlot}
            object_type={DATA_DELIVER_TIME}
            label="time-slot-commit"
            validate={validateTimeSlot}
          /> : ""}
        {tempTimeSlot.id != -1 ?
          <ClickableIcon
            label="time-slot-initialize"
            src={"static/images/plus.svg"}
            onClick={initializeNewTimeSlot}
          /> : ""}
        </Col>
      </Row>
      <MarginInputGroup>
          <InputGroup.Text>Aktivitets Tracer</InputGroup.Text>
          <Select
            aria-label="active-tracer-select"
            options={activityTracersOptions}
            value={activeTracer}
            onChange={setStateToEvent(setActiveTracer)}
          />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Overhead</InputGroup.Text>
        <ErrorInput error={overheadError}>
          <Form.Control
            aria-label="overhead-input"
            value={overhead}
            onChange={setStateToEvent(setOverhead)}
            />
        </ErrorInput>
        <InputGroup.Text>%</InputGroup.Text>
        { overhead !== initialOverhead ?
          <InputGroup.Text>
            <CommitButton
              label="commit-overhead"
              temp_object={tracerCatalogPage}
              object_type={DATA_TRACER_MAPPING}
              validate={validateOverhead}
              add_image="/static/images/update.svg"
            />
          </InputGroup.Text> : ""
        }
      </MarginInputGroup>

      <MarginInputGroup>
        <InputGroup.Text>Leveringstid</InputGroup.Text>
        <ErrorInput error={deliveryTimeError}>
          <TimeInput
            aria-label="time-slot-delivery-time"
            value={tempTimeSlot.delivery_time}
            stateFunction={setTempTimeSlotDeliveryTime}
            />
        </ErrorInput>
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Ugenlig gentagelse</InputGroup.Text>
        <Select
          aria-label="weekly-select"
          options={WeeklyRepeatOptions}
          onChange={setTempObjectToEvent(setTempTimeSlot, 'weekly_repeat')}
          value={tempTimeSlot.weekly_repeat}
        />
      </MarginInputGroup>
      <MarginInputGroup>
        <InputGroup.Text>Levering fra Production</InputGroup.Text>
        <Select
          options={productionOptions}
          onChange={setTempObjectToEvent(setTempTimeSlot, 'production_run')}
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
            <EndpointConfig/>
            <ActiveTimeSlotConfig/>
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

