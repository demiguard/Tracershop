import React, { useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { ClickableIcon } from "~/components/injectable/icons";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { Option, Select, toOptions } from "~/components/injectable/select";
import { DELIVERY_TIME_BEFORE_PRODUCTION_ERROR_MESSAGE } from "~/components/modals/customer_modal";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { PRODUCT_TYPES, ProductReference, productToReferenceOption } from "~/dataclasses/references/product_reference";
import { DATA_DELIVER_TIME, DATA_ISOTOPE_DELIVERY, DATA_TRACER_MAPPING } from "~/lib/shared_constants";
import { setStateToEvent, setTempObjectToEvent } from "~/lib/state_management";
import { parseTimeInput } from "~/lib/user_input";

import { WEEKLY_REPEAT_CHOICES } from '~/lib/constants';
import { TracerCatalogPage } from "~/dataclasses/dataclasses";
import { presentOptionName } from "~/lib/presentation";
import { useTracerCatalog } from "~/contexts/tracer_catalog";
import { useUpdatingEffect } from "~/effects/updating_effect";
import { ErrorMonad } from "~/lib/error_handling";
import { parseDanishPositiveNumberBind } from "~/lib/parsing";

const WeeklyRepeatOptions = toOptions([
  { id : 0, name : "Alle Uger"},
  { id : 1, name : "Lige Uger"},
  { id : 2, name : "Ulige Uger"},
]);

const OVERHEAD_HEADER_NAME = "Overhead"

function getOverheadString(page: TracerCatalogPage) {
  const percentage = Math.round((page.overhead_multiplier - 1) * 100);

  return percentage === 0 ? "" : String(percentage);
}


/**
 * In the customer modal:
 * ```
 * ----------------------------------------------
 * |              |              |              |
 * | CustomerForm | EndpointForm | TimeslotForm |
 * |              |              |              |
 * ----------------------------------------------
 * |                                            |
 * |             TimeslotsTimeTable             |
 * |                                            |
 * ----------------------------------------------
 * ```
 * This is timeslotForm. It's responiblity is to allow users to modify
 * deliveries, Meaning ActivityDeliveryTimeSlot and IsotopeDelivery
 *
 *
 */
export function TimeSlotForm({
  timeSlotDirty,
  timeSlotState,
  selectedEndpoint,
  initializeNewTimeSlot,
  initialOverhead=1,
  setEndpointReferenceError,
  activityTracersOptions,
  productState,
  products
}){
  const state = useTracershopState();
  const tracerCatalog = useTracerCatalog();
  const [product, setProduct_] = productState;
  const [tempTimeSlot, setTempTimeSlot] = timeSlotState;
  const endpointCatalog = tracerCatalog.getCatalog(selectedEndpoint.id);

  function setCatalogPage(product: ProductReference){
    if (product.is_tracer()) {
      if (endpointCatalog.pages.has(product.product_id)) {
        return endpointCatalog.pages.get(product.product_id);
      } else {
        return new TracerCatalogPage(-1, selectedEndpoint.id, product.product_id, -1, 1);
      }
    }
    return new TracerCatalogPage(-1, selectedEndpoint.id, product.product_id, -1, 1)
  }

  const tracerCatalogPage = setCatalogPage(product);

  const [deliveryTimeError, setDeliveryTimeError] = useState("");

  const [overheadDisplay, setOverheadDisplay] = useState(() => {
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
    const productReference = ProductReference.fromValue(event.target.value);

    if(productReference.equal(product)){
      return;
    }

    // Update overhead
    if(productReference.is_tracer()){
      const newProductPage = setCatalogPage(productReference);

      setOverheadDisplay(getOverheadString(newProductPage));
    }
    // Reset temp
    const new_productions = productReference.filterProduction(state);
    switch (productReference.type) {
      case PRODUCT_TYPES.ISOTOPE:
        setTempTimeSlot({
          id : -1,
          production : new_productions[0].id,
          weekly_repeat : WEEKLY_REPEAT_CHOICES.ALL,
          delivery_time : "",
          delivery_endpoint : selectedEndpoint.id
        });
        break;
        case PRODUCT_TYPES.ACTIVITY:
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
    setOverheadDisplay(overheadString);
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
      case PRODUCT_TYPES.ACTIVITY: {
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
      case PRODUCT_TYPES.ISOTOPE: {
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
    const monad = new ErrorMonad();

    monad.bind(parseDanishPositiveNumberBind(overheadDisplay, OVERHEAD_HEADER_NAME));

    if (monad.hasError()){
      setOverheadError(monad.get_error(OVERHEAD_HEADER_NAME));

      return [false, {}];
    }

    const parsedOverhead: number = monad.get_value(OVERHEAD_HEADER_NAME);

    setOverheadError("");

    return [true, { ...tracerCatalogPage, overhead_multiplier : parsedOverhead / 100 + 1 }];
  }

  function setProduction(){
    switch (product.type){
      case PRODUCT_TYPES.ISOTOPE:
        return setTempObjectToEvent(setTempTimeSlot, 'production', Number);
        case PRODUCT_TYPES.ACTIVITY:
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
            <CommitIcon
              temp_object={tempTimeSlot}
              object_type={DATA_TYPE}
              aria-label="time-slot-commit"
              validate={validateTimeSlot}
              callback={clearTime}
            />
          </Optional>
          <Optional exists={tempTimeSlot.id != -1}>
            <ClickableIcon
              aria-label="time-slot-initialize"
              src={"static/images/plus2.svg"}
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
          <Optional exists={overheadDisplay !== String(initialOverhead)} alternative={<div>%</div>}>
            <CommitIcon
              aria-label="commit-overhead"
              temp_object={tracerCatalogPage}
              object_type={DATA_TRACER_MAPPING}
              validate={validateOverhead}
              add_image="/static/images/update.svg"
              />
          </Optional>
          }>
          <Form.Control
            aria-label="overhead-input"
            value={overheadDisplay}
            onChange={setStateToEvent(setOverheadDisplay)}
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