import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { ActivityProduction } from "../../../dataclasses/dataclasses";
import { WeeklyTimeTable } from "~/components/injectable/weekly_time_table";
import { DAYS, TRACER_TYPE, WEEKLY_TIME_TABLE_PROP_DAY_GETTER,
  WEEKLY_TIME_TABLE_PROP_ENTRIES, WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR,
  WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER,
  WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC } from "~/lib/constants";
import { DATA_PRODUCTION } from "~/lib/shared_constants";
import { tracerTypeFilter } from "~/lib/filters";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";

export function ProductionSetup(){
  const state = useTracershopState();
  const websocket = useWebsocket()
  const productions = [...state.production.values()]
  const activityTracers = [...state.tracer.values()].filter(
    tracerTypeFilter(TRACER_TYPE.ACTIVITY)
  );
  const tracerInit = (activityTracers.length === 0) ? "" : activityTracers[0].id;

  const tempProductionInit = (productions.length === 0) ?
                                  new ActivityProduction(-1, DAYS.MONDAY, tracerInit, "", "", "")
                                : {...productions[0]}

  const [tempProduction, _setTempProduction] = useState(tempProductionInit);

  function setTempProduction(newTempProduction) {
    _setTempProduction({...tempProduction, ...newTempProduction})
  }

  function setNewProduction(){
    setTempProduction(new ActivityProduction(-1, DAYS.MONDAY, tracerInit, "", "", ""));
  }

  function commitChanges(){
    if( tempProduction.id === -1){
      const newProduction = {...tempProduction, id : undefined};
      websocket.sendCreateModel(DATA_PRODUCTION, [newProduction])
    } else {
      websocket.sendEditModel(DATA_PRODUCTION, [tempProduction])
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
    if(entry.id == state.tempProduction.id){
      return 'orange';
    }

    return 'lightgreen';
  }

  /**
   * 
   * @param {ActivityProduction} activityProduction
   */
  function weeklyTimeTableEntryOnClick(activityProduction){
    setState({
      tempProduction : {...activityProduction}
    })
  }

  function weeklyTimeTableInnerText(entry){
    return (<div>
      {entry.production_time}
    </div>)
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
    <Row>
      <WeeklyTimeTable
        {...weeklyTimeTableProps}
      />
    </Row>
    <Row>
      <Col></Col>
      <Col></Col>
      <Col></Col>
      <Col></Col>
    </Row>
  </Container>)
}