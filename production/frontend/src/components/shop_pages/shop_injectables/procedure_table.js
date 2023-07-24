import React, { useState } from "react";
import { Container, FormCheck, FormControl, Row, Table } from "react-bootstrap";
import { JSON_PROCEDURE, JSON_TRACER, PROP_WEBSOCKET } from "../../../lib/constants";
import { Procedure } from "../../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { Select } from "../../injectable/select";
import { nullParser } from "../../../lib/formatting";
import { TracerWebSocket } from "../../../lib/tracer_websocket";

/**
 * 
 * @param {{
 *  procedure : Procedure
 *  tracers : Array<Object>
 *  websocket : TracerWebSocket
 * }} param0 
 * @returns 
 */
function ProcedureRow({procedure, tracers, websocket}){
  const nullTracer = nullParser(procedure.tracer)
  const [tracer, _setTracer] = useState(nullTracer);
  const [units, _setUnits] = useState(procedure.tracer_units);
  const [delay, _setDelay] = useState(procedure.delay_minutes);
  const [usage, _setUsage] = useState(Boolean(procedure.in_use));

  function setTracer(event) {
    _setTracer(event.target.value);
    let tracerID = event.target.value
    if(tracerID === ""){
      tracerID = null;
    }
    const newProcedure = {...procedure, tracer : tracerID}

    websocket.sendEditModel(JSON_PROCEDURE, [newProcedure])
  }

  function setUnits(event){
    _setUnits(event.target.value)

    const newUnits = Number(event.target.value);
    // Guards
    if(isNaN(newUnits)){
      return;
    }

    if(newUnits < 0){
      return;
    }

    const newProcedure = {...procedure, tracer_units : newUnits}

    websocket.sendEditModel(JSON_PROCEDURE, [newProcedure])
  }

  function setDelay(event) {
    _setDelay(event.target.value);
    const newDelay = Number(event.target.value);
    // Guards
    if(isNaN(newDelay)){
      return;
    }



    const newProcedure = {...procedure, delay_minutes : newDelay}

    websocket.sendEditModel(JSON_PROCEDURE, [newProcedure])
  }

  function setUsage(event) {
    const newUsage = !usage
    _setUsage(newUsage)
    const newProcedure = {...procedure, in_use : newUsage}

    websocket.sendEditModel(JSON_PROCEDURE, [newProcedure])
  }


  return (
    <tr>
      <td>{procedure.series_description}</td>
      <td>
        <Select
          options={tracers}
          valueKey="id"
          nameKey="name"
          value={tracer}
          onChange={setTracer}
        />
      </td>
      <td><FormControl value={units} onChange={setUnits}/></td>
      <td><FormControl value={delay} onChange={setDelay}/></td>
      <td style={{margin : 'auto',}}>
        <FormCheck
          style={{
            justifyContent : 'center',
            display : 'flex',
          }}
          checked={usage}
          onChange={setUsage}
        />
      </td>
    </tr>
  );
}

export function ProcedureTable(props){
  const [filter, setFilter] = useState("")
  const [filterType, setFilterType] = useState(1)

  const filterOptions = [{
    id : 1,
    name : "Serie"
  },{
    id : 2,
    name : "Tracer",
  }, {
    id : 3,
    name : "I brug"
  }]

  let filterForm = <FormControl value={filter} onChange={(event) => {
    setFilter(event.target.value)
  }}/>
  if (filterType === 3){
    filterForm = null
  }


  const tracers = [...props[JSON_TRACER].values()].filter(
    (_tracer) => {
      const /**@type {Tracer} */ tracer = _tracer;

      return true;
    }
  ).map((tracer) => {
    return {
      id : tracer.id,
      name : tracer.shortname,
    }
  });

  tracers.push({
    id : "",
    name : "",
  })

  const productionRows = [...props[JSON_PROCEDURE].values()].filter(
    (_procedure) => {
      const /**@type {Procedure} */ procedure = _procedure
      const regex = new RegExp(filter, 'i');
      if(filter === "" && filterType !== 3){
        return true;
      }

      if(filterType === 1){
        return regex.test(procedure.series_description);
      } else if (filterType === 2) {
        const tracer = props[JSON_TRACER].get(procedure.tracer);
        return regex.test(tracer.shortname);
      } else if (filterType === 3) {
        return procedure.in_use;
      }
    }).map(
    (procedure, i) => {
      return (
      <ProcedureRow
        key={i}
        procedure={procedure}
        tracers={tracers}
        websocket={props[PROP_WEBSOCKET]}
      />)
    }
  )

  return (
  <div style={{
    marginTop : "15px",
    marginBottom : "15px",
  }}>
    <div>
      <TracershopInputGroup label="Filter">
        <Select
          options={filterOptions}
          valueKey={"id"}
          nameKey={"name"}
          value={filterType}
          onChange={(event) => {
            setFilterType(event.target.value)
          }}
          />
          {filterForm}
      </TracershopInputGroup>
    </div>
    <Table>
      <thead>
        <tr>
          <th>Series Description</th>
          <th>Tracer</th>
          <th>Enheder</th>
          <th>Forsinkelse (Minutter)</th>
          <th>I brug</th>
        </tr>
      </thead>
      <tbody>
        {productionRows}
      </tbody>
    </Table>
  </div>)
}