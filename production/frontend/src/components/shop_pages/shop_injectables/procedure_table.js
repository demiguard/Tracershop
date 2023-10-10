import React, { useState } from "react";
import { Container, FormCheck, FormControl, Row, Table } from "react-bootstrap";
import { PROP_ACTIVE_ENDPOINT } from "~/lib/constants";
import { DATA_CUSTOMER, DATA_ENDPOINT, DATA_PROCEDURE, DATA_PROCEDURE_IDENTIFIER, DATA_TRACER } from "~/lib/shared_constants"
import { Procedure, ProcedureIdentifier, DeliveryEndpoint } from "~/dataclasses/dataclasses";
import { Select } from "../../injectable/select";
import { nullParser } from "~/lib/formatting";
import { getProcedure } from "~/lib/data_structures";
import { DestinationSelect } from "../../injectable/derived_injectables/destination_select";


export function ProcedureTable(props){
  const [activeCustomer, setActiveCustomer] = useState(1);
  const [activeEndpoint, setActiveEndpoint] = useState(1);

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

      websocket.sendEditModel(DATA_PROCEDURE, [newProcedure])
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

      websocket.sendEditModel(DATA_PROCEDURE, [newProcedure])
    }

    function setDelay(event) {
      _setDelay(event.target.value);
      const newDelay = Number(event.target.value);
      // Guards
      if(isNaN(newDelay)){
        return;
      }
      const newProcedure = {...procedure, delay_minutes : newDelay}

      websocket.sendEditModel(DATA_PROCEDURE, [newProcedure])
    }

    function setUsage(event) {
      const newUsage = !usage
      _setUsage(newUsage)
      const newProcedure = {...procedure, in_use : newUsage}

      //websocket.sendEditModel(DATA_PROCEDURE, [newProcedure])
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


  return (
  <div style={{
    marginTop : "15px",
    marginBottom : "15px",
  }}>
    <div>
      <DestinationSelect
        ariaLabelCustomer="select-customer"
        ariaLabelEndpoint="select-endpoint"
        activeCustomer={activeCustomer}
        activeEndpoint={activeEndpoint}
        customers={props[DATA_CUSTOMER]}
        endpoints={props[DATA_ENDPOINT]}
        setCustomer={setActiveCustomer}
        setEndpoint={setActiveEndpoint}
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