import React, { useEffect, useState } from "react";
import { Container, Row, Col, FormControl } from "react-bootstrap";

import { ActivityProduction, IsotopeProduction, TracershopState, Isotope, Tracer } from "../../../dataclasses/dataclasses";
import { WeeklyTimeTable } from "~/components/injectable/weekly_time_table";
import { DAYS, DAYS_OBJECTS, TRACER_TYPE, WEEKLY_TIME_TABLE_PROP_DAY_GETTER,
  WEEKLY_TIME_TABLE_PROP_ENTRIES, WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR,
  WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
  WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC } from "~/lib/constants";
import { DATA_ISOTOPE_PRODUCTION, DATA_PRODUCTION, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_STATUS } from "~/lib/shared_constants";
import { tracerTypeFilter } from "~/lib/filters";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { Option, Select, toOptions } from "~/components/injectable/select";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { setStateToEvent, setTempObjectToEvent } from "~/lib/state_management";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { parseTimeInput } from "~/lib/user_input";
import { CommitButton } from "~/components/injectable/commit_button";
import { numberfy } from "~/lib/utils";
import { Options } from "~/components/injectable/optional";
import { MESSAGE_ERROR } from "~/lib/incoming_messages";
import { useErrorState } from "~/lib/error_handling";
import { AlertBox } from "~/components/injectable/alert_box";
import { initializeProductionReference } from "~/lib/initialization";
import { productToReferenceOption, ProductionReference, PRODUCTION_TYPES } from "~/dataclasses/product_reference";
import { useOnEnter } from "~/effects/on_enter";
import { useCommitObject } from "~/effects/commit_object";


/**weekly time table functions */
/**
 * Called when the weekly time table needs to determine the hour of the entry
  * @param {ActivityProduction} production
  * @returns {Number}
  */
function weeklyTimeTableDayGetter(production){
  return production.production_day;
}

/**
 * Called when the weekly time table determine the color of an entry
  * @param {ActivityDeliveryTimeSlot} entry -
  * @returns {string}
  */

function weeklyTimeTableEntryColor(tempObject){
  return (entry) => {
    if(entry.id == tempObject.id){
    return 'orange';
  }

  return 'lightgreen';
  }
}

/**
   * Called when the weekly time table needs to determine the hour of the entry
   * @param {ActivityProduction} production
   * @returns {Number}
*/
function weeklyTimeTableHourGetter(production) {
  const hour = Number(production.production_time.substring(0,2));
  const minutes = Number(production.production_time.substring(3,5));
  return hour + minutes / 60;
}


  /**
   *
   * @param {ActivityProduction} activityProduction
   * @returns
   */
  function weeklyTimeTableLabelFunction(activityProduction){
    return `activity-production-${activityProduction.id}`;
  }


function weeklyTimeTableInnerText(entry){
  return (
    <div style={{textAlign : "center"}} aria-label={`production-${entry.id}`}>
      {entry.production_time}
    </div>);
}

function ActivityTracerProductionView({
  tempProduction,
  productions,
  setTempProduction
}){
  /**
  *
  * @param {ActivityProduction} activityProduction
  */
  function weeklyTimeTableEntryOnClick(activityProduction){
    setTempProduction({...activityProduction});
  }


  const weeklyTimeTableProps = {
    [WEEKLY_TIME_TABLE_PROP_ENTRIES] : productions,
    [WEEKLY_TIME_TABLE_PROP_DAY_GETTER] : weeklyTimeTableDayGetter,
    [WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] : weeklyTimeTableHourGetter,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] : weeklyTimeTableEntryOnClick,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] : weeklyTimeTableEntryColor(tempProduction),
    [WEEKLY_TIME_TABLE_PROP_INNER_TEXT] : weeklyTimeTableInnerText,
    [WEEKLY_TIME_TABLE_PROP_LABEL_FUNC] : weeklyTimeTableLabelFunction,
  };

  return (<WeeklyTimeTable
        {...weeklyTimeTableProps}
      />);
}

function IsotopeProductionView({
  tempProduction,
  productions,
  setTempProduction
}){

  /**
  *
  * @param {ActivityProduction} activityProduction
  */
  function weeklyTimeTableEntryOnClick(activityProduction){
    setTempProduction({...activityProduction});
  }

  const weeklyTimeTableProps = {
    [WEEKLY_TIME_TABLE_PROP_ENTRIES] : productions,
    [WEEKLY_TIME_TABLE_PROP_DAY_GETTER] : weeklyTimeTableDayGetter,
    [WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] : weeklyTimeTableHourGetter,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] : weeklyTimeTableEntryOnClick,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] : weeklyTimeTableEntryColor(tempProduction),
    [WEEKLY_TIME_TABLE_PROP_INNER_TEXT] : weeklyTimeTableInnerText,
    [WEEKLY_TIME_TABLE_PROP_LABEL_FUNC] : weeklyTimeTableLabelFunction,
  };

  return (
    <WeeklyTimeTable
      {...weeklyTimeTableProps}
    />
  );

}


export function ProductionSetup(){
  const state = useTracershopState();


  const activityTracers = [...state.tracer.values()].filter(
    tracerTypeFilter(TRACER_TYPE.ACTIVITY)
  );
  const isotopes = [...state.isotopes.values()];

  const valid_products = [...activityTracers, ...isotopes];

  const initialProductReference = initializeProductionReference(valid_products);
  const [product, setProductionReference] = useState(initialProductReference);
  const [tempProduction, setTempProduction] = useState({
    id : -1,
    production_day : DAYS.MONDAY,
    production_time : "",
  });
  const [errorTime, setTimeError] = useState("");
  const [creationError, setCreationError] = useErrorState();

  const productionOptions = valid_products.map(productToReferenceOption);

  const displayProductions = product.filterProduction(state);

  function selectNewProduct(event){
    const newProductionReference = ProductionReference.fromValue(event.target.value);

    if(product.not_equal(newProductionReference)){
      setProductionReference(newProductionReference);
      setTempProduction((old) => ({
        id : -1,
        production_time : old.production_time,
        production_day : old.production_day
      }));
    }
  }

  function setProductionTime(newValue){
    setTimeError("");

    setTempProduction(tempProduction =>  {return {...tempProduction, production_time : newValue}})
  }

  function validate(){
    const [validTime, formattedTime] = parseTimeInput(tempProduction.production_time, 'Produktions tidpunktet');

    if(!validTime){
      setTimeError(formattedTime);
      return [false, {}];
    }

    const production = (product.type == PRODUCTION_TYPES.PRODUCTION) ?
      {
        id : tempProduction.id,
        tracer : product.product_id,
        production_time : formattedTime,
        production_day : numberfy(tempProduction.production_day),
      } : {
        id : tempProduction.id,
        isotope : product.product_id,
        production_time : formattedTime,
        production_day : numberfy(tempProduction.production_day),
      };

    return [validTime, production];
  }

  function validateCallback(response){
    if(response instanceof MESSAGE_ERROR){
      setCreationError(response.error);
    }
  }

  const optionIndex = (() => {
    switch (product.type){
      case PRODUCTION_TYPES.PRODUCTION:
        return 0;
      case PRODUCTION_TYPES.ISOTOPE_PRODUCTION:
        return 1;
      default:
        return 2
    }
  })();

  useCommitObject({
    validate : validate,
    temp_object : tempProduction,
    object_type : product.type,
    callback : validateCallback
  });


  return (<Container>
    <Row
      style={{ margin : "15px" }}>
      <Col>
        <Select
          aria-label="product-selector"
          options={productionOptions}
          value={product.to_value()}
          onChange={selectNewProduct}
        />
      </Col>
      <Col>
        <Select
          aria-label="day-selector"
          options={toOptions(DAYS_OBJECTS,'name', 'day')}
          value={tempProduction.production_day}
          onChange={setTempObjectToEvent(setTempProduction, 'production_day')}
        />
      </Col>
      <Col>
        <ErrorInput error={errorTime}>
          <TimeInput
            aria-label="production-time"
            value={tempProduction.production_time}
            stateFunction={setProductionTime}
          />
        </ErrorInput>
      </Col>
      <Col>
        <Row>
          <Col>
            <CommitButton
              temp_object={tempProduction}
              validate={validate}
              object_type={product.type}
              label="commit-active-production"
              callback={validateCallback}
            />
          </Col>
        </Row>
      </Col>
    </Row>
    <AlertBox error={creationError}/>
    <Row>
      <Options index={optionIndex}>
        <ActivityTracerProductionView
          tempProduction={tempProduction}
          productions={displayProductions}
          setTempProduction={setTempProduction}
        />
        <IsotopeProductionView
          tempProduction={tempProduction}
          productions={displayProductions}
          setTempProduction={setTempProduction}
        />
        <div></div>
      </Options>
    </Row>
  </Container>)
}