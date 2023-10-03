import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { ActivityProduction } from "../../../dataclasses/dataclasses";
import { WeeklyTimeTable } from "../../injectable/weekly_time_table";
import { DAYS, JSON_PRODUCTION, JSON_TRACER, PROP_WEBSOCKET, TRACER_TYPE, WEEKLY_TIME_TABLE_PROP_DAY_GETTER, WEEKLY_TIME_TABLE_PROP_ENTRIES, WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR, WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK, WEEKLY_TIME_TABLE_PROP_HOUR_GETTER, WEEKLY_TIME_TABLE_PROP_INNER_TEXT, WEEKLY_TIME_TABLE_PROP_LABEL_FUNC } from "../../../lib/constants";
import { tracerTypeFilter } from "../../../lib/filters";
import { TracerWebSocket } from "../../../lib/tracer_websocket";

export function ProductionSetup(props){
  const /**@type {TracerWebSocket} */ websocket = props[PROP_WEBSOCKET]
  const /**@type {Array<ActivityProduction>} */ productions = [...props[JSON_PRODUCTION].values()]
  const activityTracers = [...props[JSON_TRACER].values()].filter(
    tracerTypeFilter(TRACER_TYPE.ACTIVITY)
  )
  const tracerInit = (activityTracers.length === 0) ? "" : activityTracers[0].id

  const tempProductionInit = (productions.length === 0) ?
                                  new ActivityProduction(-1, DAYS.MONDAY, tracerInit, "", "", "")
                                : {...productions[0]}

  const [state, _setState] = useState({
    tempProduction : tempProductionInit,
  });

  function setState(newState) {
    _setState({...state, ...newState})
  }

  function setNewProduction(){
    setState({
      tempProduction : new ActivityProduction(-1, DAYS.MONDAY, tracerInit, "", "", "")
    })
  }

  function commitChanges(){
    if( state.tempProduction.id === -1){
      const newProduction = {...state.tempProduction, id : undefined};
      websocket.sendCreateModel(JSON_PRODUCTION, [newProduction])
    } else {
      websocket.sendEditModel(JSON_PRODUCTION, [state.tempProduction])
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



  const weeklyTimeTableProps = {};
  weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRIES] = productions;
  weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_DAY_GETTER] = weeklyTimeTableDayGetter;
  weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_HOUR_GETTER] = weeklyTimeTableHourGetter;
  weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRY_ON_CLICK] = weeklyTimeTableEntryOnClick;
  weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_ENTRY_COLOR] = weeklyTimeTableEntryColor;
  weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_INNER_TEXT] = weeklyTimeTableInnerText;
  weeklyTimeTableProps[WEEKLY_TIME_TABLE_PROP_LABEL_FUNC] = weeklyTimeTableLabelFunction;


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