
import React, { useRef, useState, useEffect } from "react";
import { Modal, Row, Container } from "react-bootstrap";

import {  TRACER_TYPE,
  WEEKLY_REPEAT_CHOICES, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES,
  WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
   WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC} from "~/lib/constants.js";
import { DATA_ENDPOINT } from "~/lib/shared_constants.js"
import { CloseButton } from "../injectable/buttons.js";
import { toOptions } from "../injectable/select.js"
import { ClickableIcon } from "../injectable/icons.js";

import { WeeklyTimeTable } from "../injectable/weekly_time_table.js"

import { ActivityDeliveryTimeSlot, DeliveryEndpoint, TracerCatalogPage } from "~/dataclasses/dataclasses.js";
import { getDateName } from "~/lib/formatting.js";
import { useTracershopState } from "../../contexts/tracer_shop_context.js";
import { compareLoosely } from "~/lib/utils.js";
import { clone } from "~/lib/serialization.js";
import { endpointFilter, isotopeFilter, timeSlotsFilter, tracerTypeFilter } from "~/lib/filters.js";
import { FONT, MARGIN } from "~/lib/styles.js";
import { initializeProductionReference, initializeProductionRun } from "~/lib/initialization.js";
import { CustomerForm } from "~/components/production_pages/production_injectables/customer_form.js";
import { EndpointForm } from "~/components/production_pages/production_injectables/endpoint_form.js";
import { TimeSlotForm } from "~/components/production_pages/production_injectables/timeslot_form.js";
import { DataClassTimeTable } from "~/components/injectable/dataclass_time_table.js";

export const DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE = "Der kan ikke laves en levering før den valgte produktion";

function DeliveryTimeTable({tempTimeSlotID, setTempTimeSlot, timeSlots, productions}){
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

  const endpoints = endpointFilter(
    state, { owner : active_customer }
  );

  endpoints.push(clone(
    cleanEndpoint, DATA_ENDPOINT
  ));

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
      state.delivery_endpoint.get(init.current.initial_endpoint)
    : cleanEndpoint;

  const [activeTracer,   _setActiveTracer] = useState(init.current.initial_tracer);
  const initial_production = initializeProductionRun(state, activeTracer);
  const [endpointReferenceError, setEndpointReferenceError] = useState("");
  const [tempEndpoint, setTempEndpoint] = useState({...endpoint});

  const cleanTimeSlot = new ActivityDeliveryTimeSlot(
    -1, // id
    0, // weekly_repeat
    "", //delivery_time
    tempEndpoint.id,
    initial_production,
    null
  );

  const [tempTimeSlot, setTempTimeSlot] = useState({...cleanTimeSlot});
  const [tempCustomer, setTempCustomer] = useState({...customer});

  // Note that the tracerPage Id is unique on each render
  const [tracerPageId, initialOverhead] = initializeOverhead(tempEndpoint.id, activeTracer);
  const [overhead, setOverhead] = useState(initialOverhead);

  const customerDirty = !compareLoosely(customer, tempCustomer);

  // Effects
  useEffect(function updateProduction(){
    const initial_production = initializeProductionRun(state, activeTracer);
    setTempTimeSlot(oldTimeSlot => {
      return {
        ...oldTimeSlot,
        production_run : initial_production
      };
    });
  }, [activeTracer]);

  useEffect(function refreshCustomer(){
    setTempCustomer({...customer});
  }, [customer]);

  useEffect(function refreshEndpoint(){
    if(0 < endpoint.id){
      setTempEndpoint({...endpoint});
    }
  }, [endpoint])

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


  const endpointDirty = !compareLoosely(endpoint, tempEndpoint);

  // Note that tempTimeSlot cannot be a state value here as it might
  // Change when the user changes endpoint.
  const timeSlotCorrect = (tempTimeSlot.id === -1) ?
    cleanTimeSlot : state.deliver_times.get(tempTimeSlot.id);
  const timeSlotDirty = !compareLoosely(timeSlotCorrect, tempTimeSlot);

  const tracerCatalogPage = tracerPageId !== null ?
      state.tracer_mapping.get(tracerPageId)
    : new TracerCatalogPage(-1, tempEndpoint.id, activeTracer, 1);


  function productionNaming(production){
    return `${getDateName(production.production_day)} - ${production.production_time}`;
  }

  const filteredProductions = [...state.production.values()].filter(
    (prod) => prod.tracer === activeTracer
  );

  const productionOptions = toOptions(filteredProductions, productionNaming, 'id')
  const activity_tracers = [...state.tracer.values()].filter(tracerTypeFilter(TRACER_TYPE.ACTIVITY));
  const activityTracersOptions = toOptions(activity_tracers, 'shortname');

  // New product
  const producibleIsotopes = isotopeFilter(state.isotopes, {producible : true , state});
  const products = [...activity_tracers, ...producibleIsotopes];

  const productState = useState(() => initializeProductionReference(products));
  const [product, _] = productState;

  const productions = product.filterDeliveries(state, tempEndpoint.id);


  return (
    <Modal
      show={true}
      size="xl"
      onHide={on_close}
      style={FONT.light}
    >
      <Modal.Header>
        <Modal.Title>Kunde konfigurering - {customer.short_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            <CustomerForm
              customerDirty={customerDirty}
              tempCustomerState={[tempCustomer, setTempCustomer]}
            />
            <EndpointForm
              active_customer={active_customer}
              endpoints={endpoints}
              endpointReferenceError={endpointReferenceError}
              endpointDirty={endpointDirty}
              tempEndpointState={[tempEndpoint, setTempEndpoint]}
              setActiveEndpoint={setActiveEndpoint}
            />
            <TimeSlotForm
              timeSlotDirty={timeSlotDirty}
              timeSlotState={[tempTimeSlot, setTempTimeSlot]}
              selectedEndpoint={tempEndpoint}
              setEndpointReferenceError={setEndpointReferenceError}
              activityTracersOptions={activityTracersOptions}
              initializeNewTimeSlot={initializeNewTimeSlot}
              productionOptions={productionOptions}
              tracerCatalogPage={tracerCatalogPage}
              overheadState={[overhead, setOverhead]} initialOverhead={initialOverhead}
              products={products}
              productState={productState}
            />
          </Row>
          <hr/>
          <Row style={MARGIN.all.px0}>
            <DataClassTimeTable
              items={productions}
              onClick={(entry) => {console.log("Clicked on - ", entry)}}
              JSXprops={{
                active_object : tempTimeSlot.id
              }}
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
