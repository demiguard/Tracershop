/** This component create a time table over
 *
 */

/** This module tried to create an easy to use interface, where I can just throw
 *  Whatever i want in then get a time table, One of my problems is that
 *  time_table is kinda difficult to use because you need to define a class,
 *  which I find "unnatural" in the current code base.
 *
 *  Okay Weekly time table and "time table" have some major differences
 *  namely in where they place each entry where time table groups them inside an
 *  hour block and the weekly time table groups all ent
 */

import { end } from '@popperjs/core';
import React from 'react';
import { Col } from 'react-bootstrap';
import { RowMajorTimeTable } from '~/components/injectable/time_table';
import { useTracershopState } from '~/contexts/tracer_shop_context';
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, InjectionOrder, IsotopeDelivery, IsotopeProduction } from '~/dataclasses/dataclasses';
import { ArrayMap } from '~/lib/array_map';
import { datify, getHour } from '~/lib/chronomancy';
import { DAYS_OBJECTS, DAYS_PER_WEEK, WEEKLY_REPEAT_CHOICES } from '~/lib/constants';
import { ITimeTableDataContainer } from '~/lib/data_structures';
import { presentName } from '~/lib/presentation';
import { JUSTIFY, PADDING } from '~/lib/styles';

/** @typedef { IsotopeDelivery | IsotopeProduction | ActivityProduction | ActivityOrder | ActivityDeliveryTimeSlot | InjectionOrder } TimeTableIndexable */

/** Finds the day that this entry should be displayed under
 *
 * @param {TimeTableIndexable} entry
 * @returns {Number}
 */
function DayFunction(entry) {
  const state = useTracershopState();

  switch (true) {
    case entry instanceof IsotopeProduction:
      return entry.production_day;
    case entry instanceof IsotopeDelivery: {
      const production = state.isotope_production.get(entry.production);
      return production.production_day;
    }
    case entry instanceof ActivityProduction:
      return entry.production_day;
    case entry instanceof ActivityDeliveryTimeSlot: {
      const production = state.production.get(entry.production_run);
      return production.production_day;
    }
    case entry instanceof InjectionOrder: {
      const delivery_date = datify(entry.delivery_date);
      return getDay(delivery_date);
    }
    case entry instanceof ActivityOrder: {
      const delivery_time = state.deliver_times.get(getActiveTimeSlotID(entry))
      const production = state.production.get(delivery_time.production_run);
      return production.production_day;
    }
  }

  throw {
    error : "Unsupported entry type"
  }
}

/** Finds the hour that this entry should be displayed under
 *
 * @param {TimeTableIndexable} entry
 * @returns {Number}
 */
function HourFunction(entry){
  const state = useTracershopState();

  switch (true) {
    case entry instanceof IsotopeProduction:
      return getHour(entry.production_time);
    case entry instanceof IsotopeDelivery: {
      return getHour(entry.delivery_time);
    }
    case entry instanceof ActivityProduction:
      return getHour(entry.production_time);
    case entry instanceof ActivityDeliveryTimeSlot: {
      return getHour(entry.delivery_time);
    }
    case entry instanceof InjectionOrder: {
      return getHour(entry.delivery_time);
    }
    case entry instanceof ActivityOrder: {
      const delivery_time = state.deliver_times.get(getActiveTimeSlotID(entry));
      return getHour(delivery_time.delivery_time);
    }
  }

  throw {
    error : "Unsupported entry type"
  }
}

function columnNameFunction(name){
  return <div style={JUSTIFY.center}>{name}</div>
}

function entryJsxDecorator(onClick, JSXprops={}){
  /**
   *
   * @param {TimeTableIndexable} entry
   * @param {Number} i
   * @returns
   */
  function entryJsx(entry, i){
    const state = useTracershopState();
    switch (true) {
      case entry instanceof ActivityDeliveryTimeSlot: {
        const production = state.production.get(entry.production_run);
        const tracer = state.tracer.get(production.tracer)

        const backgroundColor = (() => {
          if ("active_object" in JSXprops && JSXprops.active_object === entry.id){
            return "orange";
          }
          switch (entry.weekly_repeat) {
            case WEEKLY_REPEAT_CHOICES.ALL:
              return "lightblue";
            case WEEKLY_REPEAT_CHOICES.EVEN:
              return "lightgreen";
            case WEEKLY_REPEAT_CHOICES.ODD:
              return "#FFEE99";
            default:
              return "black"
          }
        })()

        return <div
                  data-testid={`time-slot-${entry.id}`}
                  aria-label={`time-slot-${entry.id}`}
                  key={i}
                  style={{
                    ...JUSTIFY.center,
                    backgroundColor : backgroundColor,
                    flex : "1 0 0",
                  }}
                  onClick={() => onClick(entry)}>
                    {presentName(entry)}
               </div>
      }
    }

    return (
      <div
        aria-label={`time-slot-${entry.id}`}
        style={{
          ...JUSTIFY.center,
          flex : "1 0 0"
        }}
        key={i}
        onClick={() => onClick(entry)}
      >
        {presentName(entry)}
      </div>
    );
  }
  return entryJsx
}


function cellFunctionDecorator(onClick, JSXprops){
  /**
   *
   * @param {Array<TimeTableIndexable>} entries
   * @param {*} i
   * @returns
   */
  function cellFunction(entries, i){
    const jsxEntries = entries.map(entryJsxDecorator(onClick, JSXprops));

    return <Col style={{
      ...PADDING.all.px0,
      ...JUSTIFY.center,
      border : "1px",
      borderStyle : "solid",
    }} key={i}>{jsxEntries}</Col>
  }
  return cellFunction
}

class DataClassTimeTableDataContainer extends ITimeTableDataContainer {
  /**
   *
   * @param {Object} args
   * @param {Number} args.table_days
   * @param {Array<TimeTableIndexable>} args.entries
   */
  constructor({onClick=()=>{}, entries, table_days = 127, JSXprops}){
    super(columnNameFunction, cellFunctionDecorator(onClick, JSXprops));
    this.table_days = table_days


    for(let day = 0; day < DAYS_PER_WEEK; day++){
      // Should we add the day?
      if(this.#useDay(day)){
        this.columns.set(day, DAYS_OBJECTS[day].name);
        this.entryMapping.set(day, new ArrayMap())
      }
    }

    for(const entry of entries){
      const day = DayFunction(entry);
      if(this.#useDay(day)){
        const day_mapping = this.entryMapping.get(day);
        const hour = HourFunction(entry);
        day_mapping.set(hour, entry);
      }
    }
  }

  #useDay(day) {
    return (1 << day) & this.table_days;
  }
}

export function DataClassTimeTable({
  min_hour=0,
  max_hour=23,
  onClick=(entry)=>{},
  items = [],
  weekly_days=127,
  JSXprops = {},
}){

  const TTDC = new DataClassTimeTableDataContainer({
    entries : items,
    table_days : weekly_days,
    onClick : onClick,
    JSXprops : JSXprops
  })


  return <RowMajorTimeTable timeTableDataContainer={TTDC} />;
}