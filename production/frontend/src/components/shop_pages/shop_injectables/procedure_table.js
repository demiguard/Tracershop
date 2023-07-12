import React, { useState } from "react";
import { Container, FormCheck, FormControl, Row, Table } from "react-bootstrap";
import { JSON_PROCEDURE, JSON_TRACER } from "../../../lib/constants";
import { Procedure } from "../../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { Select } from "../../injectable/select";
import { nullParser } from "../../../lib/formatting";

/**
 * 
 * @param {{
 *  procedure : Procedure
 *  tracers : Array<Object>
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
    

  }

  function setUnits(event){

  }

  function setDelay(event) {

  }

  function setUsage(event) {

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
      />)
    }
  )

  return (
  <div>
    <Row>
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
    </Row>
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