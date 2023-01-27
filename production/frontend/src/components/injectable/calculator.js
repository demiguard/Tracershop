import React, { Component } from "react";
import { Button, Col, FormControl, Row, Table } from "react-bootstrap";

import propTypes from 'prop-types'

import { FormatDateStr, FormatTime, ParseDanishNumber } from "../../lib/formatting";
import { CalculateProduction, CountMinutes } from "../../lib/physics";
import { renderTableRow } from "../../lib/rendering";
import { autoAddCharacter, compareDates, removeIndex } from "../../lib/utils";

import styles from '../../css/Calculator.module.css'
import SiteStyles from '../../css/Site.module.css'
import { AlertBox, ERROR_LEVELS } from "./alert_box";
import { ClickableIcon } from "./icons";

export { Calculator }
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
class Calculator extends Component {
  static propTypes = {
    cancel : propTypes.func.isRequired,
    commit : propTypes.func.isRequired,
    defaultMBq : propTypes.number,
    isotopes : propTypes.instanceOf(Map).isRequired,
    productionTime : propTypes.instanceOf(Date).isRequired,
    tracer : propTypes.instanceOf(Object).isRequired,
    initial_MBq : propTypes.instanceOf(Number)
  }

  static defaultProps = {
    defaultMBq : 300,
  }

  static stateTypes

  constructor(props){
    super(props);


    const entries = [];

    if(this.props.initial_MBq !== undefined && this.props.initial_MBq > 0){
      const hour = FormatDateStr(this.props.productionTime.getHours());
      const minutes = FormatDateStr(this.props.productionTime.getMinutes());
      entries.push({
        time : `${hour}:${minutes}:00`,
        activity : this.props.initial_MBq
      });
    }

    this.state = {
      errorMessage : "",
      entries : entries,
      newEntry : {
        time : "", // Will be on the format HH:MM:SS, Note that the seconds will be ignore and not displayed.
        activity : this.props.defaultMBq,

      },
    };
  }

  _addColon(timeStr){
    if(timeStr.length == 2){
      return timeStr + ":"
    } else {
      return timeStr
    }
  }

  InputEnterPress(event){
    if (event.key == "Enter"){
      this.addEntry()
    }
  }

  changeNewEntry(key){
    const ReturnFunction = (event) => {
      const newNewEntry = { // Look it's a new newEntry, I didn't make up this naming conventions.
        // Ooh wait. I open for feedback.
        time : this.state.newEntry.time,
        activity : this.state.newEntry.activity
      };

      const value = (key == "time" && event.target.value.length > newNewEntry.time.length) ? this._addColon(event.target.value) : event.target.value

      newNewEntry[key] = value;
      const newState = {
        ...this.state,
        newEntry : newNewEntry
      };
      this.setState(newState);
    }
    return ReturnFunction.bind(this)
  }

  // Error Messages
  static ErrorInvalidTimeFormat = "Tidspunktet er ikke læseligt af systemet"
  static ErrorTimeAfterProduction = "Tidspunktet er før produktions tidspunktet"
  static ErrorActivityInvalidNumber = "Aktiviten er ikke et tal"
  static ErrorActivityZero = "Der kan ikke bestilles et nul mændge af aktivitet"
  static ErrorActivityNegative = "Der kan ikke bestilles et negativt mændge af aktivitet"

  addEntry(){
    const formattedTime = FormatTime(this.state.newEntry.time);
    if(formattedTime === null){
      this.setState({...this.state, errorMessage : Calculator.ErrorInvalidTimeFormat });
      return;
    }
    const hour = Number(formattedTime.substring(0,2));
    const min  = Number(formattedTime.substring(3,5));
    const entryDate = new Date(
      this.props.productionTime.getFullYear(),
      this.props.productionTime.getMonth(),
      this.props.productionTime.getDate(),
      hour,
      min
    )
    if (entryDate < this.props.productionTime){
      this.setState({...this.state, errorMessage : Calculator.ErrorTimeAfterProduction});
      return;
    }

    const activity = ParseDanishNumber(this.state.newEntry.activity)
    if(isNaN(activity)){
      this.setState({...this.state, errorMessage : Calculator.ErrorActivityInvalidNumber});
      return;
    }
    if(activity == 0){
      this.setState({...this.state, errorMessage : Calculator.ErrorActivityZero});
      return;
    }
    if(activity < 0){
      this.setState({...this.state, errorMessage : Calculator.ErrorActivityNegative});
      return;
    }

    const newEntries = [...this.state.entries]; // not to be confused with the newEntry
    newEntries.push({
      time : formattedTime,
      activity : activity
    });

    const newState = {
      ...this.state,
      errorMessage: "",
      entries : newEntries,
      newEntry : {
        time : "",
        activity : this.props.defaultMBq,
      }};
    this.setState(newState);
  }

  removeEntry(index){
    const retFunc = (_event) => {
      const newEntries = removeIndex(this.state.entries, index);
      this.setState({...this.state,
        entries : newEntries
      });
    }
    return retFunc.bind(this);
  }

  commit(event) {
    var activity = 0.0;
    const isotope = this.props.isotopes.get(this.props.tracer.isotope);
    for(const entry of this.state.entries){
      const hour = Number(entry.time.substring(0,2));
      const min  = Number(entry.time.substring(3,5));
      const entryDate = new Date(
        this.props.productionTime.getFullYear(),
        this.props.productionTime.getMonth(),
        this.props.productionTime.getDate(),
        hour,
        min
      )
      const timeDelta = CountMinutes(this.props.productionTime, entryDate);
      activity += CalculateProduction(isotope.halflife, timeDelta, entry.activity)
    }

    activity = (activity < 0) ? 0 : activity;

    this.props.commit(activity);
  }

  render(){
    const isotope = this.props.isotopes.get(this.props.tracer.isotope);
    const ProductionTimeString = `${FormatDateStr(this.props.productionTime.getHours())}:${FormatDateStr(this.props.productionTime.getMinutes())}`;

    const EntryTableRows = [];
    var totalActivity = 0.0;

    for(const entryIdx in this.state.entries){
      const entry = this.state.entries[entryIdx]
      EntryTableRows.push(renderTableRow(entryIdx,[

        this.state.entries[entryIdx].time.substring(0,5),
        this.state.entries[entryIdx].activity,
        <ClickableIcon
          src={"/static/images/decline.svg"}
          onClick={this.removeEntry(entryIdx).bind(this)}
          label={"delete-"+entryIdx.toString()}
        />
      ]));
    }

    for(const entry of this.state.entries){ // This list is what? 3 short, we can iterate over it twice
      // Yes as a programer that gives a big deal about effectivity, this is not a death sentense
      const hour = Number(entry.time.substring(0,2));
      const min  = Number(entry.time.substring(3,5));
      const entryDate = new Date(
        this.props.productionTime.getFullYear(),
        this.props.productionTime.getMonth(),
        this.props.productionTime.getDate(),
        hour,
        min
      )
      const timeDelta = CountMinutes(this.props.productionTime, entryDate);
      totalActivity += CalculateProduction(isotope.halflife, timeDelta, entry.activity)
    }

    totalActivity = Math.floor(totalActivity);

    EntryTableRows.push(renderTableRow(
      "-1", [
        <FormControl
          aria-label="time-new"
          value={this.state.newEntry.time}
          onChange={this.changeNewEntry("time")}
          onKeyDown={this.InputEnterPress.bind(this)}
        />,
        <FormControl
          aria-label="activity-new"
          value={this.state.newEntry.activity}
          onChange={this.changeNewEntry("activity")}
          onKeyDown={this.InputEnterPress.bind(this)}
        />,
        <ClickableIcon
          src={"/static/images/plus.svg"}
          onClick={this.addEntry.bind(this)}
          altText={"Tilføj"}
        />
      ]
    ));

    return (
    <div className={styles.Calculator}>
      <Row className={styles.CalculatorHeader}>
        <h3>Dosislommeregner</h3>
      </Row>
      <hr/>
      <Row className={styles.CalculatorInfo}>
        <p>Tracer - {this.props.tracer.name}</p>
        <p>Produktions tidpunkt - {ProductionTimeString}</p>
        <p>Halvering tid - {isotope.halflife} s</p>
        <p>Aktivitet som bliver Tilføjet: {totalActivity}</p>
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
      {this.state.errorMessage ? <AlertBox
          message={this.state.errorMessage}
          level={ERROR_LEVELS.error}
      /> : null}
      <Row>
        <Col>
          <Button className={styles.CalculatorButton} onClick={this.commit.bind(this)}>Udregn</Button>
        </Col>
        <Col>
          <Button className={styles.CalculatorButton} onClick={this.props.cancel}>Tilbage</Button>
        </Col>
      </Row>
    </div>)
  }
}

