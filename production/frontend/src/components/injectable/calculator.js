import React, { useState, useEffect } from "react";
import { Button, Col, FormControl, Row, Table } from "react-bootstrap";

import propTypes from 'prop-types'

import { FormatDateStr, FormatTime, ParseDanishNumber } from "../../lib/formatting";
import { CalculateProduction, CountMinutes } from "../../lib/physics";
import { removeIndex } from "../../lib/utils";

import styles from '../../css/Calculator.module.css'

import { AlertBox, ERROR_LEVELS } from "./alert_box";
import { ClickableIcon } from "./icons";
import { Isotope } from "../../dataclasses/dataclasses";


export const CALCULATOR_NEW_ACTIVITY_LABEL = "calculator-activity-new"
export const CALCULATOR_NEW_TIME_LABEL = "calculator-time-new"

// Error Messages
export const ErrorInvalidTimeFormat = "Tidspunktet er ikke læseligt af systemet"
export const ErrorTimeAfterProduction = "Tidspunktet er før produktions tidspunktet"
export const ErrorActivityInvalidNumber = "Aktiviten er ikke et tal"
export const ErrorActivityZero = "Der kan ikke bestilles et nul mændge af aktivitet"
export const ErrorActivityNegative = "Der kan ikke bestilles et negativt mændge af aktivitet"

/** This component is a radioactive calculator aka. It calculates how much Radio active material you need at a point at production time.
 * Given a desired amount at a given time.
 *
 * Props:
 *  cancel - Callable[event], this function is called when the user wish to return without any updates.
 *  commit - Callable[float], this function is called at when a user is satified with their calculations, and returns with the amount calculated
 *  defaultMBq - float|str this is the default amount of a new entry
 *  isotopes - Map<Number,Object> Map of isotopes the tracers could be made from.
 *  productionTime - Date The time the radioactive material is produced.
 *  tracer - Object Active Tracer for the material in question
 */
export function Calculator ({
  initial_MBq = 0, productionTime, defaultMBq = 300, isotopes, cancel, tracer, commit
}) {
  const entries = [];

    if(initial_MBq !== undefined && initial_MBq > 0){
      const hour = FormatDateStr(productionTime.getHours());
      const minutes = FormatDateStr(productionTime.getMinutes());
      entries.push({
        time : `${hour}:${minutes}:00`,
        activity : initial_MBq
      });
    }

    const [state, setState] = useState({
      errorMessage : "",
      entries : entries,
      newEntry : {
        time : "", // Will be on the format HH:MM:SS, Note that the seconds will be ignore and not displayed.
        activity : defaultMBq,
      },
    });


  function _addColon(timeStr){
    if(timeStr.length == 2){
      return timeStr + ":";
    } else {
      return timeStr;
    }
  }

  function InputEnterPress(event){
    if (event.key == "Enter"){
      if (state.newEntry.time === ""){
        commit_activity();
      } else {
        addEntry();
      }
      event.preventDefault();
    }
  }

  useEffect(function addEnterListener() {
    window.addEventListener('keydown', InputEnterPress);
    return () => { window.removeEventListener('keydown', InputEnterPress); };
  }, [state]);

  function changeNewEntry(key){
    const ReturnFunction = (event) => {
      const newNewEntry = { // Look it's a new newEntry, I didn't make up this naming conventions.
        // Ooh wait. I am open for feedback.
        time : state.newEntry.time,
        activity : state.newEntry.activity
      };

      const value = (key == "time" && event.target.value.length > newNewEntry.time.length) ? _addColon(event.target.value) : event.target.value

      newNewEntry[key] = value;
      const newState = {
        ...state,
        newEntry : newNewEntry
      };
      setState(newState);
    }
    return ReturnFunction
  }

  function addEntry(){
    const formattedTime = FormatTime(state.newEntry.time);
    if(formattedTime === null){
      setState({...state, errorMessage : ErrorInvalidTimeFormat });
      return;
    }
    const hour = Number(formattedTime.substring(0,2));
    const min  = Number(formattedTime.substring(3,5));
    const entryDate = new Date(
      productionTime.getFullYear(),
      productionTime.getMonth(),
      productionTime.getDate(),
      hour,
      min
    )
    if (entryDate < productionTime){
      setState({...state, errorMessage : ErrorTimeAfterProduction});
      return;
    }

    const activity = ParseDanishNumber(state.newEntry.activity)
    if(isNaN(activity)){
      setState({...state, errorMessage : ErrorActivityInvalidNumber});
      return;
    }
    if(activity == 0){
      setState({...state, errorMessage : ErrorActivityZero});
      return;
    }
    if(activity < 0){
      setState({...state, errorMessage : ErrorActivityNegative});
      return;
    }

    const newEntries = [...state.entries]; // not to be confused with the newEntry
    newEntries.push({
      time : formattedTime,
      activity : activity
    });

    const newState = {
      ...state,
      errorMessage: "",
      entries : newEntries,
      newEntry : {
        time : "",
        activity : defaultMBq,
      }};
    setState(newState);
  }

  function removeEntry(index){
    const retFunc = (_event) => {
      const newEntries = removeIndex(state.entries, index);
      setState({...state,
        entries : newEntries
      });
    }
    return retFunc;
  }

  function commit_activity() {
    let activity = 0.0;
    const /**@type {Isotope} */ isotope = isotopes.get(tracer.isotope);
    for(const entry of state.entries){
      const hour = Number(entry.time.substring(0,2));
      const min  = Number(entry.time.substring(3,5));
      const entryDate = new Date(
        productionTime.getFullYear(),
        productionTime.getMonth(),
        productionTime.getDate(),
        hour,
        min
      );
      const timeDelta = CountMinutes(productionTime, entryDate);
      activity += CalculateProduction(isotope.halflife_seconds, timeDelta, entry.activity)
    }

    activity = (activity < 0) ? 0 : activity;

    // External function, expected to close the calculator
    commit(activity);
  }
  const isotope = isotopes.get(tracer.isotope);
  const ProductionTimeString = `${FormatDateStr(productionTime.getHours())}:${FormatDateStr(productionTime.getMinutes())}`;

  function EntryRow({entryIdx}){
    return <tr>
      <td>{state.entries[entryIdx].time.substring(0,5)}</td>
      <td>{state.entries[entryIdx].activity}</td>
      <td><ClickableIcon
          src={"/static/images/decline.svg"}
          onClick={removeEntry(entryIdx)}
          label={"delete-"+entryIdx.toString()}
        /></td>
    </tr>
  }


    const EntryTableRows = [];
    var totalActivity = 0.0;

    for(const entryIdx in state.entries){
      EntryTableRows.push(<EntryRow key={entryIdx} entryIdx={entryIdx}/>);
    }

    for(const entry of state.entries){ // This list is what? 3 short, we can iterate over it twice
      // Yes as a programer that gives a big deal about effectivity, this is not a death sentense
      const hour = Number(entry.time.substring(0,2));
      const min  = Number(entry.time.substring(3,5));
      const entryDate = new Date(
        productionTime.getFullYear(),
        productionTime.getMonth(),
        productionTime.getDate(),
        hour,
        min
      )
      const timeDelta = CountMinutes(productionTime, entryDate);
      totalActivity += CalculateProduction(isotope.halflife_seconds, timeDelta, entry.activity)
    }

    totalActivity = Math.floor(totalActivity);

    EntryTableRows.push(
      <tr key={-1}>
        <td><FormControl
          aria-label={CALCULATOR_NEW_TIME_LABEL}
          value={state.newEntry.time}
          onChange={changeNewEntry("time")}
        /></td>
        <td><FormControl
          aria-label={CALCULATOR_NEW_ACTIVITY_LABEL}
          value={state.newEntry.activity}
          onChange={changeNewEntry("activity")}
        /></td>
        <td><ClickableIcon
          src={"/static/images/plus.svg"}
          onClick={addEntry}
          altText={"Tilføj"}
        /></td>
      </tr>
    );

    return (
    <div className={styles.Calculator}>
      <Row className={styles.CalculatorHeader}>
        <h3>Dosislommeregner</h3>
      </Row>
      <hr/>
      <Row className={styles.CalculatorInfo}>
        <p>Tracer - {tracer.shortname}</p>
        <p>Produktions tidpunkt - {ProductionTimeString}</p>
        <p>Halvering tid - {isotope.halflife_seconds} s</p>
        <p>Aktivitet som bliver Tilføjet: {totalActivity} MBq</p>
      </Row>
      <Row className="calculatorTables">
        <Table>
          <thead>
            <tr>
              <th>Tidspunkt</th>
              <th>Aktivitet</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {EntryTableRows}
          </tbody>
        </Table>
      </Row>
      {state.errorMessage ? <AlertBox
          message={state.errorMessage}
          level={ERROR_LEVELS.error}
      /> : null}
      <Row>
        <Col>
          <Button className={styles.CalculatorButton} onClick={commit_activity}>Udregn</Button>
        </Col>
        <Col>
          <Button className={styles.CalculatorButton} onClick={cancel}>Tilbage</Button>
        </Col>
      </Row>
    </div>);
}


Calculator.propTypes = {
  cancel : propTypes.func.isRequired,
  commit : propTypes.func.isRequired,
  defaultMBq : propTypes.number,
  isotopes : propTypes.instanceOf(Map).isRequired,
  productionTime : propTypes.instanceOf(Date).isRequired,
  tracer : propTypes.instanceOf(Object).isRequired,
  initial_MBq : propTypes.number,
}
