import React, { Component } from "react";
import { Button, FormControl, Row, Table } from "react-bootstrap";
import { FormatTime, ParseDanishNumber } from "../../lib/formatting";
import { CalculateProduction, CountMinutes } from "../../lib/physics";
import { renderClickableIcon, renderTableRow } from "../../lib/Rendering";
import { CompareDates, removeIndex } from "../../lib/utils";

export { Calculator, standardOrderMapping }
/** This component is a radioactive calculator aka. It calculates how much Radio active material you need at a point at production time.
 * Given a desired amount at a given time.
 *
 * Props:
 *  tracer - Object Active Tracer for the material in question
 *  isotopes - Map<Number,Object> Map of isotopes the tracers could be made from.
 *  productionTime - Date The time the radioactive material is produced.
 *  defaultMBq - float|str this is the default amount of a new entry
 *  commit - Callable[float], this function is called at when a user is satified with their calculations, and returns with the amount calculated
 *  cancel - Callable[event], this function is called when the user wish to return without any updates.
 */
class Calculator extends Component {
  constructor(props){
    super(props);

    this.state = {
      errorMessage : "",
      entries : [],
      newEntry : {
        time : "", // Will be on the format HH:MM:SS, Note that the seconds will be ignore and not displayed.
        activity : this.props.defaultMBq,

      },
    };
  }

  changeNewEntry(key){
    const retfunc = (event) => {
      const newNewEntry = { // Look it's a new newEntry, I didn't decide on the naming conventions.
        // Ooh wait.
        time : this.state.newEntry.time,
        activity : this.state.newEntry.activity
      };
      newNewEntry[key] = event.target.value;
      const newState = {
        ...this.state,
        newEntry : newNewEntry
      };
      this.setState(newState);
    }
    return retfunc.bind(this)
  }

  addEntry(){
    const retfunc = (_event) => {
      const formattedTime = FormatTime(this.state.newEntry.time);
      if(formattedTime === null){
        this.setState({...this.state, errorMessage : "Tidspunktet er ikke læseligt af systemet"});
        return;
      }
      const hour = Number(entry.time.substr(0,2));
      const min  = Number(entry.time.substr(3,2));
      const entryDate = new Date(
        this.props.productionTime.getFullYear(),
        this.props.productionTime.getMonth(),
        this.props.productionTime.getDate(),
        hour,
        min
      )
      if (entryDate > this.props.productionTime){
        this.setState({...this.state, errorMessage : "Tidspunktet er før produktions tidspunktet"});
        return;
      }

      const activity = ParseDanishNumber(this.state.newEntry.activity)
      if(isNaN(activity)){
        this.setState({...this.state, errorMessage : "Aktiviten er ikke et tal"});
        return;
      }
      if(activity == 0){
        this.setState({...this.state, errorMessage : "Der kan ikke bestilles et nul mændge af aktivitet"});
        return;
      }
      if(activity > 0){
        this.setState({...this.state, errorMessage : "Der kan ikke bestilles et negativt mændge af aktivitet"});
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
    return retfunc.bind(this);
  }

  removeEntry(index){
    const retfunc = (_event) => {
      const newEntries = removeIndex(this.state.entries, index);
      this.setState({...this.state,
        entries : newEntries
      });
    }
    return retfunc.bind(this);
  }

  commit(event) {
    var activity = 0.0;
    const isotope = this.props.isotopes.get(this.props.tracer.isotope);
    for(const entry of this.state.entries){
      const hour = Number(entry.time.substr(0,2));
      const min  = Number(entry.time.substr(3,2));
      const entryDate = new Date(
        this.props.productionTime.getFullYear(),
        this.props.productionTime.getMonth(),
        this.props.productionTime.getDate(),
        hour,
        min
      )
      const timedelta = CountMinutes(this.props.productionTime, entryDate);
      activity += CalculateProduction(isotope.halflife, timedelta, entry.activity)
    }

    this.props.commit(activity);
  }

  render(){
    const isotope = this.props.isotopes.get(this.props.tracer.isotope);

    const EntryTableRows = [];
    var totalActivity = 0.0;

    for(const entryIdx in this.state.entries){
      EntryTableRows.append(renderTableRow(entryIdx,[
        this.state.entries[entryIdx].time,
        this.state.entries[entryIdx].activity,
        renderClickableIcon("/static/images/decline.svg", this.removeElement(entryIdx).bind(this))
      ]));
    }

    for(const entry of this.state.entries){ // This list is what? 3 short, we can iterate over it twice
      // Yes as a programer that gives a big deal about effectivity, this is not a death sentense
      const hour = Number(entry.time.substr(0,2));
      const min  = Number(entry.time.substr(3,2));
      const entryDate = new Date(
        this.props.productionTime.getFullYear(),
        this.props.productionTime.getMonth(),
        this.props.productionTime.getDate(),
        hour,
        min
      )
      const timedelta = CountMinutes(this.props.productionTime, entryDate);
      totalActivity += CalculateProduction(isotope.halflife, timedelta, entry.activity)
    }

    EntryTableRows.append(
      "-1", [
        <FormControl
          value={this.state.newEntry.time}
          onChange={this.changeNewEntry("time")}
        />,
        <FormControl
          value={this.state.newEntry.activity}
          onChange={this.changeNewEntry("activity")}
        />,
        renderClickableIcon("/static/images/accept.svg", this.addEntry().bind(this))
      ]
    );

    return (
    <div className="calculator">
      <Row className="calculatorHeader">Lommeregner</Row>
      <Row className="calculatorInfo">
        <p>Tracer - {this.props.tracer.name}</p>
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
          <tbody></tbody>
        </Table>
      </Row>
      <Row className="calculatorButtons">
        <Button onClick={this.commit}></Button>
        <Button onClick={this.props.cancel}>Tilbage</Button>
      </Row>
    </div>)
  }
}


function standardOrderMapping(orders, tOrders, runs) {
  // Maybe do this calculation once instead of 30 times
  const retfunc = (DateStr) => {

    var MinimumActivityStatus = 5;
    var MinimumInjectionStatus = 5;
  const date = new Date(DateStr);
  for(const [_, ActivityOrder] of orders){
    if(CompareDates(date, new Date(ActivityOrder.deliver_datetime))){
      MinimumActivityStatus = Math.min(MinimumActivityStatus, ActivityOrder.status);
    }
  }
  for(const [_, InjectionOrder] of tOrders){
    if(CompareDates(date, new Date(InjectionOrder.deliver_datetime))){
      MinimumInjectionStatus = Math.min(MinimumInjectionStatus, InjectionOrder.status);
    }
  }
  if (MinimumActivityStatus == 5){
    var CanProduce = false;
    for(const [_PTID, Run] of runs){
      if(Run.day == date.getDay()){
        CanProduce = true;
        break;
      }
    }
    if(CanProduce){
      const now = new Date();
      if(date > now){
        MinimumActivityStatus = 0;
      }
    }
  }
  return "date-status" + String(MinimumInjectionStatus) + String(MinimumActivityStatus);
  }
  return retfunc
}