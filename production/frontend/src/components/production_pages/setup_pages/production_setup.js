import React, { useEffect, useState } from "react";
import { Container, Row, Col, FormControl } from "react-bootstrap";

import { ActivityProduction, IsotopeProduction, TracershopState } from "../../../dataclasses/dataclasses";
import { WeeklyTimeTable } from "~/components/injectable/weekly_time_table";
import { DAYS, DAYS_OBJECTS, TRACER_TYPE, WEEKLY_TIME_TABLE_PROP_DAY_GETTER,
  WEEKLY_TIME_TABLE_PROP_ENTRIES, WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR,
  WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
  WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC } from "~/lib/constants";
import { DATA_ISOTOPE, DATA_ISOTOPE_PRODUCTION, DATA_PRODUCTION, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_STATUS } from "~/lib/shared_constants";
import { tracerTypeFilter } from "~/lib/filters";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { Select, toOptions } from "~/components/injectable/select";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { setStateToEvent, setTempObjectToEvent } from "~/lib/state_management";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { parseTimeInput } from "~/lib/user_input";
import { CommitButton } from "~/components/injectable/commit_button";
import { ClickableIcon } from "~/components/injectable/icons";
import { numberfy } from "~/lib/utils";
import { Optional } from "~/components/injectable/optional";
import { MESSAGE_ERROR } from "~/lib/incoming_messages";
import { useErrorState } from "~/lib/error_handling";
import { AlertBox } from "~/components/injectable/alert_box";

/**
 * @enum
 */
const PRODUCTION_TYPES = {
  ISOTOPE_PRODUCTION : DATA_ISOTOPE_PRODUCTION,
  PRODUCTION : DATA_PRODUCTION,
  EMPTY : "EMPTY"
};

/**
 * Class that unionizes the types of tracer and
 */
class ProductionReference {
  constructor(id, type){
    this.product_id = id;
    if(Object.values(PRODUCTION_TYPES).includes(type)){
      this.type = type
    } else {
      throw {error : "Unknown production type"}
    }
  }
}

/** Gets a reference to the production that is active from a blank state
 *
 * @param {Array<Tracer | Isotope>} options
 * @returns {ProductionReference}
 */
function initializeProductionReference(options){
  const initial_production = options.at(0);

  if(initial_production === undefined){
    return new ProductionReference(-1, PRODUCTION_TYPES.EMPTY);
  }

  if (initial_production instanceof Isotope){
    return new ProductionReference(initial_production.id, PRODUCTION_TYPES.ISOTOPE_PRODUCTION);
  } else if (initial_production instanceof Tracer) {
    return new ProductionReference(initial_production.id, PRODUCTION_TYPES.PRODUCTION);
  }

  throw TypeError("Initialization array is not type safe!")
}

/** From a production,
 *
 * @param {ProductionReference} productionReference
 * @param {TracershopState} state
 * @returns
 */
function filterProduction(productionReference, state){
  switch (productionReference.type) {
    case PRODUCTION_TYPES.ISOTOPE_PRODUCTION:
      return [...state.isotope_production.values()].filter(
        (ip) => ip.isotope === productionReference.product_id
      );
    case PRODUCTION_TYPES.PRODUCTION:
      return [...state.production.values()].filter(
        (ap) => ap.tracer === productionReference.product_id
      );
    default:
      return [];
  }
}

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
  */
function weeklyTimeTableEntryOnClick(activityProduction){
  setTempProduction({...activityProduction});
}

function weeklyTimeTableInnerText(entry){
  return (<div aria-label={`production-${entry.id}`}>{entry.production_time}</div>)
}

function ActivityTracerProductionView(){

}

function IsotopeProductionView(){

}


export function ProductionSetup(){
  const state = useTracershopState();

  const activityTracers = [...state.tracer.values()].filter(
    tracerTypeFilter(TRACER_TYPE.ACTIVITY)
  );

  const isotopes = [...state.isotopes.values()];

  const productionOptions = [...activityTracers, ...isotopes];
  const initialProductReference = initializeProductionReference(productionOptions);
  const [productionReference, setProductionReference] = useState(initialProductReference);

  const tracerInit = (activityTracers.length === 0) ? "" : activityTracers[0].id;
  const [tracerID, setTracer] = useState(tracerInit);
  const NumberTracerID = numberfy(tracerID);
  const tempProductionInit = new ActivityProduction(null, DAYS.MONDAY, NumberTracerID, "", "", "")
  const [tempProduction, setTempProduction] = useState(tempProductionInit);
  const [errorTime, setTimeError] = useState("");
  const [creationError, setCreationError] = useErrorState();

  const productions = [...state.production.values()].filter((production) =>
    production.tracer === NumberTracerID);

  const displayProductions = filterProduction(productionReference, state);


  function setNewProduction(){
    const default_production = new ActivityProduction(null, DAYS.MONDAY, NumberTracerID, "", null);
    setTempProduction(default_production);
  }

  useEffect(() => {
    if(NumberTracerID !== tempProduction.tracer){
      setNewProduction();
    }
  },[tracerID])

  function setProductionTime(newValue){
    setTempProduction(tempProduction =>  {return {...tempProduction, production_time : newValue}})
  }

  function validate(){
    const [validTime, formattedTime] = parseTimeInput(tempProduction.production_time, 'Produktions tidpunktet');

    if(!validTime){
      setTimeError(formattedTime);
      return [false, {}];
    }

    return [validTime, {...tempProduction,
                        production_time : formattedTime,
                        tracer : NumberTracerID,
                        production_day : numberfy(tempProduction.production_day),
                      }];
  }

  function validateCallback(response){
    if(response instanceof MESSAGE_ERROR){
      setCreationError(response.error);
    }
  }


  /**
   *
   * @param {ActivityProduction} activityProduction
   * @returns
   */
  function weeklyTimeTableLabelFunction(activityProduction){
    return `activity-production-${activityProduction.id}`;
  }

  const weeklyTimeTableProps = {
    [WEEKLY_TIME_TABLE_PROP_ENTRIES] : productions,
    [WEEKLY_TIME_TABLE_PROP_DAY_GETTER] : weeklyTimeTableDayGetter,
    [WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] : weeklyTimeTableHourGetter,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] : weeklyTimeTableEntryOnClick,
    [WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] : weeklyTimeTableEntryColor,
    [WEEKLY_TIME_TABLE_PROP_INNER_TEXT] : weeklyTimeTableInnerText,
    [WEEKLY_TIME_TABLE_PROP_LABEL_FUNC] : weeklyTimeTableLabelFunction,
  };

  return (<Container>
    <Row
      style={{ margin : "15px" }}>
      <Col>
        <Select
          aria-label="tracer-selector"
          options={toOptions(activityTracers, 'shortname')}
          value={tracerID}
          onChange={setStateToEvent(setTracer)}
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
              object_type={DATA_PRODUCTION}
              label="commit-active-production"
              callback={validateCallback}
            />
          </Col>
        </Row>
      </Col>
    </Row>
    <AlertBox error={creationError}/>
    <Row>
      <WeeklyTimeTable
        {...weeklyTimeTableProps}
      />
    </Row>
  </Container>)
}