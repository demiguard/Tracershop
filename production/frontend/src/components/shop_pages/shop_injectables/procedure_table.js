import React, { useState } from "react";
import { Container, FormCheck, FormControl, Row, Table } from "react-bootstrap";
import { JSON_ENDPOINT, JSON_PROCEDURE, JSON_PROCEDURE_IDENTIFIER, JSON_TRACER, PROP_ACTIVE_ENDPOINT, PROP_WEBSOCKET } from "../../../lib/constants";
import { Procedure, ProcedureIdentifier, DeliveryEndpoint } from "../../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { Select } from "../../injectable/select";
import { nullParser } from "../../../lib/formatting";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { getProcedure } from "../../../lib/data_structures";
import { DestinationSelect } from "../../injectable/derived_injectables/destination_select";

/**
 *
 * @param {{
 *  endpoint : DeliveryEndpoint
 *  procedures : Map<Number, Procedure>
 *  procedureIdentifier : ProcedureIdentifier
 *  tracers : Array<Object> - Mapped Tracer objects into display objects with name / id
 *  websocket : TracerWebSocket
 * }} props
 * @returns {Element}
 */
function ProcedureRow({endpoint, procedures, procedureIdentifier, tracers, websocket}){
  // Prop extractions
  const procedure = getProcedure(procedures, procedureIdentifier, endpoint)

  // State Declaration
  const nullTracer = nullParser(procedure.tracer)
  const [tracer, _setTracer] = useState(nullTracer);
  const [units, _setUnits] = useState(procedure.tracer_units);
  const [delay, _setDelay] = useState(procedure.delay_minutes);
  const [usage, _setUsage] = useState(procedure.id !== undefined);

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

    //websocket.sendEditModel(JSON_PROCEDURE, [newProcedure])
  }


  return (
    <tr>
      <td>{procedureIdentifier.string}</td>
      <td>
        <Select
          options={tracers}
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
  return (
  <div style={{
    marginTop : "15px",
    marginBottom : "15px",
  }}>
    <div>
      <DestinationSelect
        ariaLabelCustomer
        ariaLabelEndpoint
        activeCustomer
        activeEndpoint
        customer
        endpoints
        setCustomer
        setEndpoint
      />
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
        <tr></tr>
      </tbody>
    </Table>
  </div>)
}