import React, { useState } from "react";
import { Container, Row, Col, FormControl } from "react-bootstrap";

import { ActivityProduction } from "../../../dataclasses/dataclasses";
import { WeeklyTimeTable } from "~/components/injectable/weekly_time_table";
import { DAYS, DAYS_OBJECTS, TRACER_TYPE, WEEKLY_TIME_TABLE_PROP_DAY_GETTER,
  WEEKLY_TIME_TABLE_PROP_ENTRIES, WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR,
  WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
  WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC } from "~/lib/constants";
import { DATA_PRODUCTION } from "~/lib/shared_constants";
import { tracerTypeFilter } from "~/lib/filters";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { Select, toOptions } from "~/components/injectable/select";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { setTempObjectToEvent } from "~/lib/state_management";
import { TimeInput } from "~/components/injectable/inputs/time_input";
import { parseTimeInput } from "~/lib/user_input";
import { CommitButton } from "~/components/injectable/commit_button";
import { ClickableIcon } from "~/components/injectable/icons";

export function ProductionSetup(){
  const state = useTracershopState();
  const websocket = useWebsocket()
  const productions = [...state.production.values()]
  const activityTracers = [...state.tracer.values()].filter(
    tracerTypeFilter(TRACER_TYPE.ACTIVITY)
  );
  const tracerInit = (activityTracers.length === 0) ? "" : activityTracers[0].id;

  const tempProductionInit = new ActivityProduction(null, DAYS.MONDAY, tracerInit, "", "", "")
  const [tempProduction, setTempProduction] = useState(tempProductionInit);

  function setNewProduction(){
    setTempProduction(new ActivityProduction(null, DAYS.MONDAY, tracerInit, "", "", ""));
  }


  function setProductionTime(event){
    setTempProduction(tempProduction => setTempProduction({...tempProduction, production_time : event.target.value}))
  }

  function validate(){
    const [validTime, formattedTime] = parseTimeInput(tempProduction.production_time, 'Produktions tidpunktet');

    return [validTime, {...tempProduction, production_time : formattedTime}];
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
   * Called when the weekly time table determine the color of an entry
   * @param {ActivityDeliveryTimeSlot} entry - 
   * @returns {string}
   */
  function weeklyTimeTableEntryColor(entry){
    if(entry.id == tempProduction.id){
      return 'orange';
    }

    return 'lightgreen';
  }

  /**
   * 
   * @param {ActivityProduction} activityProduction
   */
  function weeklyTimeTableEntryOnClick(activityProduction){
    setTempProduction({...activityProduction});
  }

  function weeklyTimeTableInnerText(entry){
    return (<div>{entry.production_time}</div>)
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

  console.log(tempProduction.id)


  return (<Container>
    <Row
      style={{
        margin : "15px"
      }}>
      <Col>
        <Select
          options={toOptions(activityTracers, 'shortname')}
          value={tempProduction.tracer}
          onChange={setTempObjectToEvent(setTempProduction, 'tracer')}
        />
      </Col>
      <Col>
        <Select
          options={toOptions(DAYS_OBJECTS,'name', 'day')}
          value={tempProduction.production_day}
          onChange={setTempObjectToEvent(setTempProduction, 'production_day')}
        />
      </Col>
      <Col>
        <ErrorInput error="">
          <TimeInput
            aria-label="production-time"
            value={tempProduction.production_time}
            onChange={setTempObjectToEvent(setTempProduction, 'production_time')}
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
          />
        </Col>
        { tempProduction.id !== null ? <Col>
                                          <ClickableIcon
                                            src="static/images/plus.svg"
                                            onClick={setNewProduction}
                                          />
                                        </Col> : ""}
       </Row>
      </Col>
    </Row>

    <Row>
      <WeeklyTimeTable
        {...weeklyTimeTableProps}
      />
    </Row>
  </Container>)
}