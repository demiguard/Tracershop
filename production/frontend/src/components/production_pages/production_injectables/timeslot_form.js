import React, { useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { CommitButton } from "~/components/injectable/commit_button";
import { ClickableIcon } from "~/components/injectable/icons";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { Option, Select, toOptions } from "~/components/injectable/select";
import { DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE } from "~/components/modals/customer_modal";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { PRODUCTION_TYPES, ProductionReference, productToReferenceOption } from "~/dataclasses/product_reference";
import { DATA_DELIVER_TIME, DATA_ISOTOPE_DELIVERY, DATA_TRACER_MAPPING } from "~/lib/shared_constants";
import { setStateToEvent, setTempObjectToEvent } from "~/lib/state_management";
import { parseDanishPositiveNumberInput, parseTimeInput } from "~/lib/user_input";

import {StateType, WEEKLY_REPEAT_CHOICES} from '~/lib/constants.js';
import { ActivityProduction, DeliveryEndpoint, IsotopeProduction, TracerCatalogPage, TracershopState } from "~/dataclasses/dataclasses";
import { presentName, presentOptionName } from "~/lib/presentation";
import { TracerCatalog, useTracerCatalog } from "~/contexts/tracer_catalog";
import { useUpdatingEffect } from "~/effects/updating_effect";

const WeeklyRepeatOptions = toOptions([
  { id : 0, name : "Alle Uger"},
  { id : 1, name : "Lige Uger"},
  { id : 2, name : "Ulige Uger"},
]);


/**
 *
 * @param {TracerCatalogPage} page
 */
function getOverheadString(page) {
  const percentage = Math.round((page.overhead_multiplier - 1) * 100);

  return String(percentage)
}

/**
 *
 * @param {Object} props
 * @param {StateType<ProductionReference>} props.productState
 * @param {DeliveryEndpoint} props.selectedEndpoint - The endpoint that is currently being operated on
 */
export function TimeSlotForm({
  timeSlotDirty,
  timeSlotState,
  selectedEndpoint,
  initializeNewTimeSlot,
  initialOverhead,
  setEndpointReferenceError,
  productState,
  products
}){
  const state = useTracershopState();
  const tracerCatalog = useTracerCatalog();
  const [product, setProduct_] = productState;
  const [tempTimeSlot, setTempTimeSlot] = timeSlotState;
  const endpointCatalog = tracerCatalog.getCatalog(selectedEndpoint.id);

  function setCatalogPage(product){
    if (product.is_tracer()) {
      if (endpointCatalog.pages.has(product.product_id)) {
        return endpointCatalog.pages.get(product.product_id);
      } else {
        return new TracerCatalogPage(-1, selectedEndpoint.id, product.product_id, -1, 1);
      }
    }
    return {
      overhead_multiplier : ""
    };
  }

  const tracerCatalogPage = setCatalogPage(product);

  const [deliveryTimeError, setDeliveryTimeError] = useState("");

  const [overhead, setOverhead] = useState(() => {
    if(tracerCatalogPage instanceof TracerCatalogPage){
      return getOverheadString(tracerCatalogPage);
    }
    return "";
  });
  const [overheadError, setOverheadError] = useState("");

  const DATA_TYPE = product.is_tracer() ? DATA_DELIVER_TIME : DATA_ISOTOPE_DELIVERY;

  function setTempTimeSlotDeliveryTime(value){
    setTempTimeSlot(obj => {
      return {...obj, delivery_time : value};
    });
  }

  function setProduct(event){
    const productReference = ProductionReference.fromValue(event.target.value);

    if(productReference.equal(product)){
      return;
    }

    // Update overhead
    if(productReference.is_tracer()){
      const newProductPage = setCatalogPage(productReference);

      setOverhead(getOverheadString(newProductPage));
    }
    // Reset temp
    const new_productions = productReference.filterProduction(state);
    switch (productReference.type) {
      case PRODUCTION_TYPES.ISOTOPE_PRODUCTION:
        setTempTimeSlot({
          id : -1,
          production : new_productions[0].id,
          weekly_repeat : WEEKLY_REPEAT_CHOICES.ALL,
          delivery_time : "",
          delivery_endpoint : selectedEndpoint.id
        });
        break;
        case PRODUCTION_TYPES.PRODUCTION:
          setTempTimeSlot({
            id : -1,
            production_run : new_productions[0].id,
            weekly_repeat : WEEKLY_REPEAT_CHOICES.ALL,
            delivery_time : "",
            destination : selectedEndpoint.id
          });
          break;
        }

    setProduct_(productReference);
  }

  useUpdatingEffect(function updateOverheadToNewEndpoint() {
    let overheadString = "";

    if (product.is_tracer()) {
      if (endpointCatalog.pages.has(product.product_id)) {
        const tcp = endpointCatalog.pages.get(product.product_id);
        overheadString = (String((tcp.overhead_multiplier - 1) * 100));
      }
    }
    setOverhead(overheadString);
    return () => {};
  },[selectedEndpoint]);

  /**
   * Function called in response to the user clicking accept key on timeslots
  *
  * Should update the TimeSlot or create a new time slot if activeTimeSlot is undefined
  */
 function validateTimeSlot(){
   const endpointID = selectedEndpoint.id;
   if(endpointID === -1){ // database indexes are 1 index therefore always return true on valid endpoint
      setEndpointReferenceError("Man skal oprette et leveringstedet før man kan lave leverings tidspunnkter");
      return [false, {}];
    }
    setEndpointReferenceError("");


    const [validDeliveryTime, deliveryTime] = parseTimeInput(tempTimeSlot.delivery_time, 'Leverings tiden');

    if(!validDeliveryTime){
      setDeliveryTimeError(deliveryTime);
      return [false, {}];
    }

    switch(product.type){
      case PRODUCTION_TYPES.PRODUCTION: {
        const production = state.production.get(tempTimeSlot.production_run);

        if(production.production_time > deliveryTime){
          setDeliveryTimeError(DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE);
          return [false, {}];
        }
        setDeliveryTimeError("");
        return [true, {
          id : tempTimeSlot.id,
          destination : endpointID,
          weekly_repeat : tempTimeSlot.weekly_repeat,
          delivery_time : deliveryTime,
          production_run : tempTimeSlot.production_run,
          expiration_date : null,
        }];
      }
      case PRODUCTION_TYPES.ISOTOPE_PRODUCTION: {
        const isotope_production = state.isotope_production.get(tempTimeSlot.production);

        if(isotope_production.production_time > deliveryTime){
          setDeliveryTimeError(DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE);
          return [false, {}];
        }
        setDeliveryTimeError("");

        return [true, {
          id : tempTimeSlot.id,
          weekly_repeat : tempTimeSlot.weekly_repeat,
          production : isotope_production.id,
          delivery_endpoint : endpointID,
          delivery_time : deliveryTime,
        }];
      }
      default:
        return [false, {}];
      }
  }

  function validateOverhead(){
    const [validOverhead, parsedOverhead] = parseDanishPositiveNumberInput(overhead, "Overhead");

    if(!validOverhead){
      setOverheadError(parsedOverhead);
      return [false, {}];
    }

    setOverheadError("");

    return [true, { ...tracerCatalogPage, overhead_multiplier : parsedOverhead / 100 + 1 }];
  }

  function setProduction(){
    switch (product.type){
      case PRODUCTION_TYPES.ISOTOPE_PRODUCTION:
        return setTempObjectToEvent(setTempTimeSlot, 'production', Number);
        case PRODUCTION_TYPES.PRODUCTION:
          return setTempObjectToEvent(setTempTimeSlot, 'production_run', Number)
      default:
        return () => {}
      }
    }

    function clearTime(){
      setTempTimeSlot(old => ({...old, delivery_time : ""}));
    }

  // These are the options of products
  const productReferenceOptions = products.map(productToReferenceOption);
  // These are the productions of said products
  const productionOptions = product.filterProduction(state).map(
    (prod) => {
      return new Option(prod.id, presentOptionName(prod));
    }
  );

  return (
    <Col aria-label={`active-time-slot-${tempTimeSlot.id}`}>
      <Row>
        <Col><h4>Leveringstidspunkt</h4></Col>
        <Col xs="4" style={{display:"flex", justifyContent : "right"}}>
          <Optional exists={timeSlotDirty}>
            <CommitButton
              temp_object={tempTimeSlot}
              object_type={DATA_TYPE}
              label="time-slot-commit"
              validate={validateTimeSlot}
              callback={clearTime}
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
          aria-label="active-product"
          value={product.to_value()}
          options={productReferenceOptions}
          onChange={setProduct}
        />
      </TracershopInputGroup>
      <Optional exists={product.is_tracer()}>
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
      </Optional>
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

        <TracershopInputGroup label="Levering fra Production">
          <Select
            options={productionOptions}
            onChange={setProduction()}
            value={tempTimeSlot.production_run}
            aria-label="production-select"
          />
        </TracershopInputGroup>
    </Col>
  );
}