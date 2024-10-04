import React, { useState, useEffect } from "react";
import { Button, Col, FormControl, Row, Table } from "react-bootstrap";

import propTypes from 'prop-types'

import { FormatDateStr, FormatTime, ParseDanishNumber } from "~/lib/formatting";
import { calculateProduction, CountMinutes } from "~/lib/physics";
import { removeIndex } from "~/lib/utils";

import { AlertBox, ERROR_LEVELS } from "./alert_box";
import { ClickableIcon } from "./icons";
import { Isotope } from "~/dataclasses/dataclasses";
import { FONT } from "~/lib/styles";
import { setStateToEvent } from "~/lib/state_management";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { cssTableCenter } from "~/lib/constants";
import { parseDanishPositiveNumberInput, parseTimeInput } from "~/lib/user_input";
import { TimeInput } from "~/components/injectable/inputs/time_input";


export const CALCULATOR_NEW_ACTIVITY_LABEL = "calculator-activity-new"
export const CALCULATOR_NEW_TIME_LABEL = "calculator-time-new"

const CalculatorStyle = {
  ButtonStyle : {
    ...FONT.light,
    width : "150px",
  },
  HeaderStyle : {
    ...FONT.heavy
  },
  Calculator : {
    ...FONT.light
  }
};


function CalculatorEntryRow({entry, removeEntry, index}){
  return <tr>
    <td>{entry.time.substring(0,5)}</td>
    <td>{entry.activity}</td>
    <td><ClickableIcon
        src={"/static/images/decline.svg"}
        onClick={removeEntry(index)}
        label={"delete-"+index.toString()}
      /></td>
  </tr>
}

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
  initial_MBq = 0, productionTime, defaultMBq : defaultMBq_ = 300, isotopes, cancel, tracer, commit
}) {
  const initial_entries = [];

  if(initial_MBq !== undefined && initial_MBq > 0){
    const hour = FormatDateStr(productionTime.getHours());
    const minutes = FormatDateStr(productionTime.getMinutes());
    initial_entries.push({
      time : `${hour}:${minutes}:00`,
      activity : initial_MBq
    });
  }

  const [defaultMBq, setDefaultMbq] = useState(defaultMBq_);
  const [errorActivity, setErrorActivity] = useState("");
  const [errorTime, setErrorTime] = useState("");
  const [entries, setEntries] = useState(initial_entries)
  const [newEntryTime, setNewEntryTime] = useState("")
  const [newEntryActivity, setNewEntryActivity] = useState(defaultMBq)

  function InputEnterPress(event){
    if (event.key == "Enter"){
      console.log(newEntryTime)
      if (newEntryTime === ""){
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
  }, [newEntryTime]);

  function changeDefaultMBq(event){
    if(newEntryTime === ""){
      setNewEntryActivity(event.target.value);
    }
    setDefaultMbq(event.target.value);
  }

  function addEntry(){
    let [validTime, formattedTime] = parseTimeInput(newEntryTime);

    if(!validTime){
      setErrorTime(ErrorInvalidTimeFormat)
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
    if (validTime && entryDate < productionTime){
      validTime = false;
      setErrorTime(ErrorTimeAfterProduction);
    }

    const [validActivity, activity] = parseDanishPositiveNumberInput(newEntryActivity, "Aktiviten")
    if(!validActivity){
      setErrorActivity(activity)
    }

    if(!validActivity || !validTime){
      return;
    }

    setErrorActivity("")
    setErrorTime("")
    setNewEntryActivity(defaultMBq)
    setNewEntryTime("")


    setEntries(oldEntries => [...oldEntries, {time : formattedTime, activity : activity}]);
  }

  function removeEntry(index){
    const retFunc = () => {
      setEntries(oldEntries => removeIndex(oldEntries, index));
    }
    return retFunc;
  }

  function commit_activity() {
    let activity = 0.0;
    const /**@type {Isotope} */ isotope = isotopes.get(tracer.isotope);
    for(const entry of entries){
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
      activity += calculateProduction(isotope.halflife_seconds, timeDelta, entry.activity);
    }

    activity = (activity < 0) ? 0 : activity;

    // External function, expected to close the calculator
    commit(activity);
  }
  const isotope = isotopes.get(tracer.isotope);
  const ProductionTimeString = `${FormatDateStr(productionTime.getHours())}:${FormatDateStr(productionTime.getMinutes())}`;
  const EntryTableRows = [];
  let totalActivity = 0.0;

  for(const entryIdx in entries){
    EntryTableRows.push(<CalculatorEntryRow
      key={entryIdx}
      index={entryIdx}
      removeEntry={removeEntry}
      entry={entries[entryIdx]}
    />);
  }

    for(const entry of entries){ // This list is what? 3 short, we can iterate over it twice
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
      totalActivity += calculateProduction(isotope.halflife_seconds, timeDelta, entry.activity)
    }

    totalActivity = Math.floor(totalActivity);

    EntryTableRows.push(
      <tr key={-1}>
        <td>
          <TracershopInputGroup error={errorTime}>
            <TimeInput
              aria-label={CALCULATOR_NEW_TIME_LABEL}
              value={newEntryTime}
              stateFunction={setNewEntryTime}
            />
          </TracershopInputGroup>
        </td>
        <td>
          <TracershopInputGroup tail={"MBq"} error={errorActivity}>
            <FormControl
              aria-label={CALCULATOR_NEW_ACTIVITY_LABEL}
              value={newEntryActivity}
              onChange={setStateToEvent(setNewEntryActivity)}
            />
          </TracershopInputGroup>
        </td>
        <td style={cssTableCenter}>
          <ClickableIcon
            src={"/static/images/plus.svg"}
            onClick={addEntry}
            altText={"Tilføj"}
          />
        </td>
      </tr>
    );

    return (
    <div style={CalculatorStyle.Calculator}>
      <Row className={CalculatorStyle.Header}>
        <h3>Dosislommeregner</h3>
      </Row>
      <hr/>
      <Row>
        <Row><p>Tracer - {tracer.shortname}</p></Row>
        <Row><p>Produktions tidpunkt - {ProductionTimeString}</p></Row>
        <Row><p>Halvering tid - {isotope.halflife_seconds} s</p></Row>
        <Row><p>Aktivitet som bliver Tilføjet: {totalActivity} MBq</p></Row>
        <Row>
          <Col>Standard MBq</Col>
          <Col>
            <TracershopInputGroup tail={"MBq"}>
              <FormControl
                value={defaultMBq}
                onChange={changeDefaultMBq}
              />
            </TracershopInputGroup>
          </Col>
        </Row>
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
      <Row>
        <Col>
          <Button className={CalculatorStyle.Button} onClick={commit_activity}>Udregn</Button>
        </Col>
        <Col>
          <Button className={CalculatorStyle.Button} onClick={cancel}>Tilbage</Button>
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
