
import React, { useRef, useState, useEffect } from "react";
import { Modal, Row, Col, Form, Container } from "react-bootstrap";

import {  TRACER_TYPE,
  WEEKLY_REPEAT_CHOICES, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES,
  WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
   WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC} from "~/lib/constants.js";
import { DATA_CUSTOMER, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_TRACER_MAPPING,
  WEBSOCKET_DATA } from "~/lib/shared_constants.js"
import { CloseButton } from "../injectable/buttons.js";
import { Select, toOptions } from "../injectable/select.js"
import { ClickableIcon } from "../injectable/icons.js";

import { WeeklyTimeTable } from "../injectable/weekly_time_table.js"

import { ActivityDeliveryTimeSlot, ActivityProduction, DeliveryEndpoint, TracerCatalogPage } from "~/dataclasses/dataclasses.js";
import { ParseDjangoModelJson, getDateName, nullParser } from "~/lib/formatting.js";
import { TimeInput } from "../injectable/inputs/time_input.js";
import { EndpointSelect } from "../injectable/derived_injectables/endpoint_select.js";
import { useTracershopState } from "../tracer_shop_context.js";
import { setStateToEvent, setTempObjectToEvent } from "~/lib/state_management.js";
import { compareLoosely, nullify } from "~/lib/utils.js";
import { CommitButton } from "../injectable/commit_button.js";
import { parseDanishPositiveNumberInput, parseStringInput, parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input.js";
import { clone } from "~/lib/serialization.js";
import { timeSlotsFilter, tracerTypeFilter } from "~/lib/filters.js";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group.js";
import { Optional } from "~/components/injectable/optional.js";
import { FONT, MARGIN } from "~/lib/styles.js";


const WeeklyRepeatOptions = toOptions([
  { id : 0, name : "Alle Uger"},
  { id : 1, name : "Lige Uger"},
  { id : 2, name : "Ulige Uger"},
]);

export const DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE = "Der kan ikke laves en levering før den valgte produktion";

function DeliveryTimeTable({tempTimeSlotID, setTempTimeSlot, timeSlots}){
  const state = useTracershopState();
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
    if(entry.id == tempTimeSlotID){
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
    /* istanbul ignore next */
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

  const weeklyTimeTableProps = {
    [WEEKLY_TIME_TABLE_PROP_ENTRIES] : timeSlots,
    [WEEKLY_TIME_TABLE_PROP_DAY_GETTER] : weeklyTimeTableDayGetter,
    [WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] : weeklyTimeTableHourGetter,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] : weeklyTimeTableEntryOnClick,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] : weeklyTimeTableEntryColor,
    [WEEKLY_TIME_TABLE_PROP_INNER_TEXT] : weeklyTimeTableInnerText,
    [WEEKLY_TIME_TABLE_PROP_LABEL_FUNC] : weeklyTimeTableLabelFunction,
  };

  return <WeeklyTimeTable {...weeklyTimeTableProps}/>;
}


export function CustomerModal({active_customer, on_close}) {
  const state = useTracershopState();
  const customer = state.customer.get(active_customer);

  const cleanEndpoint = new DeliveryEndpoint(
    -1, // id
    "", // address
    "", // city
    "", // zip_code
    "", // phone
    "Nyt", // name
    active_customer
  );

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

  function initializeProductionRun(activity_tracer) {
    /**
     * Compares two activity production to find the better default
     * @param {ActivityProduction | null} prod_1
     * @param {ActivityProduction} prod_2
     * @returns {ActivityProduction}
     */
    function compare_productions(prod_1, prod_2){
      if(prod_1 === null){
        return prod_2;
      }
      if(prod_1.production_day < prod_2.production_day){
        return prod_1;
      }
      if(prod_1.production_day > prod_2.production_day){
        return prod_2;
      }
      if(prod_1.production_time < prod_2.production_time){
        return prod_1;
      } else {
        return prod_2;
      }
    }

    let prod = null;
    for(const production of state.production.values()){
      if(production.tracer === Number(activity_tracer)){
        prod = compare_productions(prod, production);
      }
    }
    return prod ? prod.id : "";
  }

  const init = useRef({
    initial_endpoint : null,
    initial_tracer : null,
  });

  if(init.current.initial_endpoint === null
    || init.current.initial_tracer === null) {
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

  const [activeTracer,   _setActiveTracer] = useState(init.current.initial_tracer);
  const [endpointError, setEndpointError] = useState("");
  const [tempEndpoint, setTempEndpoint] = useState({...endpoint});
  const initial_production = initializeProductionRun(activeTracer);

  const cleanTimeSlot = new ActivityDeliveryTimeSlot(
    -1, // id
    0, // weekly_repeat
    "", //delivery_time
    tempEndpoint.id,
    initial_production,
    null
  );

  const [tempTimeSlot, setTempTimeSlot] = useState({...cleanTimeSlot});

  // Note that the tracerPage Id is unique on each render
  const [tracerPageId, initialOverhead] = initializeOverhead(tempEndpoint.id, activeTracer);
  const [overhead, setOverhead] = useState(initialOverhead);

  const [tempCustomer, setTempCustomer] = useState({...customer});
  const customerDirty = !compareLoosely(customer, tempCustomer);
  const [dispenserError, setDispenserError] = useState("");

  // Effects
  useEffect(function updateProduction(){
    const initial_production = initializeProductionRun(activeTracer);
    setTempTimeSlot(oldTimeSlot => {
      return {
        ...oldTimeSlot,
        production_run : initial_production
      };
    });
  }, [activeTracer]);

  const availableTimeSlots = timeSlotsFilter(state, {
    tracerID : activeTracer,
    endpointID : tempEndpoint.id,
  });

  function initializeNewTimeSlot(){
    setTempTimeSlot({...cleanTimeSlot});
  };

  // These function should also import tempTimeSlot
  function setActiveEndpoint(newEndpointID){
    const newEndpointIDNumber = Number(newEndpointID);
    if(newEndpointIDNumber === tempEndpoint.id){
      return;
    }

    const newEndpoint = state.delivery_endpoint.has(newEndpointIDNumber) ?
      {...state.delivery_endpoint.get(newEndpointIDNumber)}
       : {...cleanEndpoint, id : newEndpointIDNumber}
    setTempEndpoint(newEndpoint);

    const [, overhead] = initializeOverhead(newEndpointIDNumber, activeTracer);

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
        setDispenserError(n_dispenser);
        return [false,{}];
      }
      dispenser = n_dispenser;
    }
    setDispenserError("");

    return [true, {...tempCustomer, dispenser_id : dispenser}];
  }

  const endpointDirty = !compareLoosely(endpoint, tempEndpoint);
  const [tempEndpointError, setTempEndpointError] = useState({
      name : "",
      address : "",
      city : "",
      phone : "",
      zip_code : "",
  });

  function validateEndpoint(){
    const [validName, name] = parseStringInput(tempEndpoint.name, 'Navnet', 32, false);
    const [validAddress, address] = parseStringInput(tempEndpoint.address, 'Addressen', 128);
    const [validCity, city] = parseStringInput(tempEndpoint.city, 'Byen', 128);
    const [validZipCode, zipCode] = parseStringInput(tempEndpoint.zip_code, 'Post koden', 32);
    const [validPhone, phone] = parseStringInput(tempEndpoint.phone, 'Telefon nummeret', 32);

    const newError = {
      name : "",
      address : "",
      city : "",
      phone : "",
      zip_code : "",
    };

    if(!validName){
      newError.name = name;
    }
    if(!validAddress){
      newError.address = address;
    }
    if(!validCity){
      newError.city = city;
    }
    if(!validZipCode){
      newError.zip_code = zipCode;
    }
    if(!validPhone){
      newError.phone = phone;
    }
    setTempEndpointError(newError);

    if (!validName || !validAddress || !validCity || !validZipCode || !validPhone ){
      return [false,{}];
    }

    return [true, {...tempEndpoint,
      name : name,
      address : nullify(address),
      city : nullify(city),
      phone : nullify(phone),
      zip_code : nullify(zipCode),
      owner : active_customer}];
  }

  function commit_callback(response){
    if(tempEndpoint.id === -1){
      const map = ParseDjangoModelJson(response[WEBSOCKET_DATA][DATA_ENDPOINT], new Map(), DATA_ENDPOINT);
        for(const endpointID of map.keys()){
          // it's only one iteration long
          setActiveEndpoint(endpointID);
          break;
      }
    }
  }

  // Note that tempTimeSlot cannot be a state value here as it might
  // Change when the user changes endpoint.
  const timeSlotCorrect = (tempTimeSlot.id === -1) ?
    cleanTimeSlot : state.deliver_times.get(tempTimeSlot.id);
  const timeSlotDirty = !compareLoosely(timeSlotCorrect, tempTimeSlot);
  const [deliveryTimeError, setDeliveryTimeError] = useState("");
  const [overheadError, setOverheadError] = useState("");

  const tracerCatalogPage = tracerPageId !== null ?
      state.tracer_mapping.get(tracerPageId)
    : new TracerCatalogPage(-1, tempEndpoint.id, activeTracer, 1);

  function setTempTimeSlotDeliveryTime(value){
    setTempTimeSlot(obj => {
      return {...obj, delivery_time : value};
    });
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

    const production = state.production.get(tempTimeSlot.production_run);

    if(production.production_time > deliveryTime){
      setDeliveryTimeError(DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE);
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

  function productionNaming(production){
    return `${getDateName(production.production_day)} - ${production.production_time}`;
  }

  const filteredProductions = [...state.production.values()].filter(
    (prod) => prod.tracer === activeTracer
  );

  const productionOptions = toOptions(filteredProductions, productionNaming, 'id')
  const activity_tracers = [...state.tracer.values()].filter(tracerTypeFilter(TRACER_TYPE.ACTIVITY));
  const activityTracersOptions = toOptions(activity_tracers, 'shortname');

  return (
    <Modal
      show={true}
      size="xl"
      onHide={on_close}
      style={FONT.light}
    >
      <Modal.Header>
        <Modal.Title>Kunde konfigurering - {customer.short_name} </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            <Col>
            {/* This is the customer configuration */}
              <Row>
                <Col><h4>Kunde</h4></Col>
                <Optional exists={customerDirty}>
                  <Col style={{ justifyContent : "right", display: "flex"}}>
                    <CommitButton
                      label="customer-commit"
                      temp_object={tempCustomer}
                      object_type={DATA_CUSTOMER}
                      validate={validateCustomer}
                    />
                  </Col>
                </Optional>
              </Row>
              <TracershopInputGroup label="Intern navn">
                <Form.Control
                  aria-label="short-name-input"
                  value={nullParser(tempCustomer.short_name)}
                  onChange={setTempObjectToEvent(setTempCustomer, 'short_name')}
                />
              </TracershopInputGroup>
              <TracershopInputGroup label="Kunde navn">
                <Form.Control
                  aria-label="long-name-input"
                  value={nullParser(tempCustomer.long_name)}
                  onChange={setTempObjectToEvent(setTempCustomer, 'long_name')}
                />
              </TracershopInputGroup>
              <TracershopInputGroup label="Kunde addresse">
                <Form.Control
                  aria-label="address-input"
                  value={nullParser(tempCustomer.billing_address)}
                  onChange={setTempObjectToEvent(setTempCustomer,'billing_address')}
                />
              </TracershopInputGroup>
              <TracershopInputGroup label="Kunde by">
                <Form.Control
                  aria-label="city-input"
                  value={nullParser(tempCustomer.billing_city)}
                  onChange={setTempObjectToEvent(setTempCustomer,'billing_city')}
                />
              </TracershopInputGroup>
              <TracershopInputGroup label="Kunde post nummer">
                <Form.Control
                  aria-label="zip-input"
                  value={nullParser(tempCustomer.zip_code)}
                  onChange={setTempObjectToEvent(setTempCustomer,'billing_zip_code')}
                />
              </TracershopInputGroup>
              <TracershopInputGroup label="Kunde Email">
                <Form.Control
                  aria-label="email-input"
                  value={nullParser(tempCustomer.billing_email)}
                  onChange={setTempObjectToEvent(setTempCustomer,'billing_email')}
                />
              </TracershopInputGroup>
              <TracershopInputGroup label="Dispenser ID" error={dispenserError}>
                <Form.Control
                  aria-label="dispenser-input"
                  value={nullParser(tempCustomer.dispenser_id)}
                  onChange={setTempObjectToEvent(setTempCustomer,'dispenser_id')}
                />
              </TracershopInputGroup>
            </Col>
            {/* This is the endpoint configuration */}
            <Col aria-label={`active-endpoint-${tempEndpoint.id}`}>
            <Row>
              <Col><h4>Leverings sted</h4></Col>
              <Col style={{display: "flex", justifyContent: "right"}}>
                <Optional exists={endpointDirty}>
                  <CommitButton
                    temp_object={tempEndpoint}
                    validate={validateEndpoint}
                    callback={commit_callback}
                    object_type={DATA_ENDPOINT}
                    label="commit-endpoint"
                  />
                </Optional>
              </Col>
            </Row>
            <TracershopInputGroup
              label="Leveringssteder"
              error={endpointError}
            >
              <EndpointSelect
                aria-label="endpoint-select"
                delivery_endpoint={endpoints}
                onChange={(event) => setActiveEndpoint(event.target.value)}
                value={tempEndpoint.id}
              />
            </TracershopInputGroup>
            <TracershopInputGroup label="Intern Navn" error={tempEndpointError.name}>
              <Form.Control
                aria-label="endpoint-name"
                value={nullParser(tempEndpoint.name)}
                onChange={setTempObjectToEvent(setTempEndpoint, 'name')}
              />
            </TracershopInputGroup>
            <TracershopInputGroup label="Leverings addresse" error={tempEndpointError.address}>
              <Form.Control
                aria-label="endpoint-address"
                value={nullParser(tempEndpoint.address)}
                onChange={setTempObjectToEvent(setTempEndpoint, 'address')}
              />
            </TracershopInputGroup>
            <TracershopInputGroup label="Leverings by" error={tempEndpointError.city}>
              <Form.Control
                aria-label="endpoint-city"
                value={nullParser(tempEndpoint.city)}
                onChange={setTempObjectToEvent(setTempEndpoint, 'city')}
              />
            </TracershopInputGroup>
            <TracershopInputGroup label="Leverings postnummer" error={tempEndpointError.zip_code}>
              <Form.Control
                aria-label="endpoint-zip-code"
                value={nullParser(tempEndpoint.zip_code)}
                onChange={setTempObjectToEvent(setTempEndpoint,'zip_code')}
              />
            </TracershopInputGroup>
            <TracershopInputGroup label="Leverings telefon nummer" error={tempEndpointError.phone}>
              <Form.Control
                aria-label="endpoint-phone"
                value={nullParser(tempEndpoint.phone)}
                onChange={setTempObjectToEvent(setTempEndpoint,'phone')}
              />
            </TracershopInputGroup>
          </Col>
    {/* Activity Time Slot */}
    <Col aria-label={`active-time-slot-${tempTimeSlot.id}`}>
      <Row>
        <Col><h4>Leveringstidspunkt</h4></Col>
        <Col xs="4" style={{display:"flex", justifyContent : "right"}}>
          <Optional exists={timeSlotDirty}>
            <CommitButton
              temp_object={tempTimeSlot}
              object_type={DATA_DELIVER_TIME}
              label="time-slot-commit"
              validate={validateTimeSlot}
            />
          </Optional>
          <Optional exists={tempTimeSlot.id != -1}>
            <ClickableIcon
              label="time-slot-initialize"
              src={"static/images/plus.svg"}
              onClick={initializeNewTimeSlot}
            />
          </Optional>
        </Col>
      </Row>
      <TracershopInputGroup label="Aktivitets tracer">
        <Select
          aria-label="active-tracer-select"
          options={activityTracersOptions}
          value={activeTracer}
          // Note that here the set Active Tracer handles invalid values
          onChange={setStateToEvent(setActiveTracer)}
        />
      </TracershopInputGroup>
      <TracershopInputGroup label="Overhead" error={overheadError} tail={
        <Optional exists={overhead !== initialOverhead} alternative={<div>%</div>}>
          <CommitButton
            label="commit-overhead"
            temp_object={tracerCatalogPage}
            object_type={DATA_TRACER_MAPPING}
            validate={validateOverhead}
            add_image="/static/images/update.svg"
          />
        </Optional>
        }>
        <Form.Control
          aria-label="overhead-input"
          value={overhead}
          onChange={setStateToEvent(setOverhead)}
          />
      </TracershopInputGroup>
      <TracershopInputGroup label="Leveringstid" error={deliveryTimeError}>
        <TimeInput
            aria-label="time-slot-delivery-time"
            value={tempTimeSlot.delivery_time}
            stateFunction={setTempTimeSlotDeliveryTime}
        />
      </TracershopInputGroup>
      <TracershopInputGroup label="ugenlig gentagelse">
        <Select
          aria-label="weekly-select"
          options={WeeklyRepeatOptions}
          onChange={setTempObjectToEvent(setTempTimeSlot, 'weekly_repeat', Number)}
          value={tempTimeSlot.weekly_repeat}
        />
      </TracershopInputGroup>
      <Row>
        <TracershopInputGroup label="Levering fra Production">
          <Select
            options={productionOptions}
            onChange={setTempObjectToEvent(setTempTimeSlot, 'production_run', Number)}
            value={tempTimeSlot.production_run}
            aria-label="production-select"
          />
        </TracershopInputGroup>
      </Row>
    </Col>
    </Row>
    <hr/>
        <Row style={MARGIN.all.px0}>
          <DeliveryTimeTable
            tempTimeSlotID={tempTimeSlot.id}
            timeSlots={availableTimeSlots}
            setTempTimeSlot={setTempTimeSlot}
          />
        </Row>
      </Container>
      </Modal.Body>
      <Modal.Footer>
        <CloseButton onClick={on_close}/>
      </Modal.Footer>
    </Modal>
  );
}
