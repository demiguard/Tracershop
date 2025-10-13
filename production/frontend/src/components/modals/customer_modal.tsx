import React, { useState } from "react";
import { Modal, Row, Container } from "react-bootstrap";

import {  TRACER_TYPE,
  WEEKLY_REPEAT_CHOICES, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES,
  WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
   WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC} from "~/lib/constants";
import { DATA_ENDPOINT } from "~/lib/shared_constants.js"
import { CloseButton } from "../injectable/buttons.js";
import { toOptions } from "../injectable/select.js"
import { ActivityDeliveryTimeSlot, DeliveryEndpoint, TracerCatalogPage } from "~/dataclasses/dataclasses";
import { useTracershopState } from "../../contexts/tracer_shop_context.js";
import { compareLoosely } from "~/lib/utils";
import { clone } from "~/lib/serialization";
import { endpointFilter, isotopeFilter, tracerTypeFilter } from "~/lib/filters";
import { FONT, MARGIN } from "~/lib/styles";
import { initializeProductReference } from "~/lib/initialization";
import { CustomerForm } from "~/components/production_pages/production_injectables/customer_form";
import { EndpointForm } from "~/components/production_pages/production_injectables/endpoint_form";
import { TimeSlotForm } from "~/components/production_pages/production_injectables/timeslot_form";
import { DataClassTimeTable } from "~/components/injectable/dataclass_time_table";
import { useUpdatingEffect } from "~/effects/updating_effect";

export const DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE = "Der kan ikke laves en levering før den valgte produktion";

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

  const [tempEndpoint, setTempEndpoint] = useState({...endpoints[0]});
  const endpoint = state.delivery_endpoint.has(tempEndpoint.id) ?
      state.delivery_endpoint.get(tempEndpoint.id)
    : cleanEndpoint

  const activity_tracers = [...state.tracer.values()].filter(tracerTypeFilter(TRACER_TYPE.ACTIVITY));
  const activityTracersOptions = toOptions(activity_tracers, 'shortname');

  // New product
  const producibleIsotopes = isotopeFilter(state.isotopes, {producible : true , state});
  const products = [...activity_tracers, ...producibleIsotopes];

  const productState = useState(() => initializeProductReference(products));
  const [product, _] = productState;

  const deliveries = product.filterDeliveries(state, {endpoint_id : tempEndpoint.id});
  const productions = product.filterProduction(state, {});

  const [endpointReferenceError, setEndpointReferenceError] = useState("");

  const cleanTimeSlot = product.get_empty_delivery(tempEndpoint.id, productions);

  const [tempTimeSlot, setTempTimeSlot] = useState({...cleanTimeSlot});
  const [tempCustomer, setTempCustomer] = useState({...customer});

  // Note that the tracerPage Id is unique on each render

  const customerDirty = !compareLoosely(customer, tempCustomer);

  useUpdatingEffect(function refreshCustomer(){
    setTempCustomer({...customer});
  }, [customer]);

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
       : {...cleanEndpoint, id : newEndpointIDNumber};
    setTempEndpoint(newEndpoint);
    setTempTimeSlot(product.get_empty_delivery(newEndpointIDNumber, productions));
  }

  const endpointDirty = tempEndpoint.id !== -1 ? !compareLoosely(endpoint, tempEndpoint) : true;

  // Note that tempTimeSlot cannot be a state value here as it might
  // Change when the user changes endpoint.
  const timeSlotCorrect = (tempTimeSlot.id === -1) ?
    cleanTimeSlot : state.deliver_times.get(tempTimeSlot.id);
  const timeSlotDirty = !compareLoosely(timeSlotCorrect, tempTimeSlot);

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
              selectedEndpoint={endpoint}
              setEndpointReferenceError={setEndpointReferenceError}
              activityTracersOptions={activityTracersOptions}
              initializeNewTimeSlot={initializeNewTimeSlot}
              products={products}
              productState={productState}
            />
          </Row>
          <hr/>
          <Row style={MARGIN.all.px0}>
            <DataClassTimeTable
              items={deliveries}
              onClick={(entry) => {setTempTimeSlot({...entry})}}
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
