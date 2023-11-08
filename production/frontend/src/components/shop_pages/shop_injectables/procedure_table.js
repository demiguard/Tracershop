import React, { useState, useRef } from "react";
import { FormControl, Table } from "react-bootstrap";

import { DATA_PROCEDURE } from "~/lib/shared_constants"
import { Procedure } from "~/dataclasses/dataclasses";
import { Select, toOptions, Option } from "../../injectable/select";
import { nullParser } from "~/lib/formatting";
import { EndpointsProcedures, TracerCatalog } from "~/lib/data_structures";
import { DestinationSelect } from "../../injectable/derived_injectables/destination_select";
import { initialize_customer_endpoint } from "~/lib/initialization";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { setStateToEvent } from "~/lib/state_management";
import { ClickableIcon } from "~/components/injectable/icons";
import { parseDanishNumberInput, parseWholePositiveNumber } from "~/lib/user_input";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { PROCEDURE_SORTING, sort_procedures } from "~/lib/sorting";

export const ERROR_MISSING_SERIES_DESCRIPTION = "Du skal vælge en Series description"


export function ProcedureTable(){
  const state = useTracershopState();
  const websocket = useWebsocket();

  const init = useRef({
    customer : null,
    endpoint : null,
  });

  if(init.current.customer === null || init.current.endpoint === null){
    init.current = initialize_customer_endpoint(state.customer, state.delivery_endpoint)
  }

  const [activeCustomer, setActiveCustomer] = useState(init.current.customer);
  const [activeEndpoint, setActiveEndpoint] = useState(init.current.endpoint);
  const [sortingMethod, setSortingMethod] = useState(PROCEDURE_SORTING.PROCEDURE_CODE);

  const endpointProcedures = new EndpointsProcedures(state.procedure);
  const activeProcedures = endpointProcedures.getProcedures(activeEndpoint);

  const tracerCatalog = new TracerCatalog(state.tracer_mapping, state.tracer);
  const availableTracers = tracerCatalog.getActivityCatalog(activeEndpoint).concat(tracerCatalog.getInjectionCatalog(activeEndpoint));

  const tracerOptions = toOptions(availableTracers, 'shortname');
  tracerOptions.push(new Option("", "---------"));
  /**
  *
  * @param {{
  *  procedureIdentifier : Procedure
  * }} props
  * @returns {Element}
   */
  function ProcedureRow({procedure}){
    const procedureIdentifier = state.procedure_identifier.get(nullParser(procedure.series_description));
    // State Declaration
    const [tracer, setTracer] = useState(nullParser(procedure.tracer));
    const [units, setUnits] = useState(nullParser(procedure.tracer_units));
    const [delay, setDelay] = useState(nullParser(procedure.delay_minutes));
    const [errorUnits, setErrorUnits] = useState("");
    const [errorDelay, setErrorDelay] = useState("");

    function commit(){
      let parsedTracer = Number(tracer)
      if(tracer === ""){
        parsedTracer = null
      }
      const [validUnits, parsedUnits] = parseWholePositiveNumber(units);
      const [validDelay, parsedDelay] = parseDanishNumberInput(delay);

      if(validDelay && validUnits){
        websocket.sendEditModel(DATA_PROCEDURE, [
          {...procedure,
            tracer : parsedTracer,
            delay_minutes : parsedDelay,
            tracer_units : parsedUnits,
          }]);
        return;
      }

      if(!validUnits){
        setErrorUnits(parsedUnits);
      }
      if(!validDelay){
        setErrorDelay(parsedDelay);
      }
    }

    return (
      <tr>
        <td>{procedureIdentifier.description}</td>
        <td>
          <Select
            data-testid={`tracer-${procedure.id}`}
            options={tracerOptions}
            value={tracer}
            onChange={setStateToEvent(setTracer)}
          />
        </td>
        <td>
          <ErrorInput error={errorUnits}>
            <FormControl
              value={units}
              onChange={setStateToEvent(setUnits)}
              data-testid={`units-${procedure.id}`}
            />
          </ErrorInput>
        </td>
        <td>
          <ErrorInput error={errorDelay}>
            <FormControl
              data-testid={`delay-${procedure.id}`}
              value={delay}
              onChange={setStateToEvent(setDelay)}
            />
          </ErrorInput>
          </td>
        <td>
          <ClickableIcon
            src="/static/images/update.svg"
            label={`update-${procedure.id}`}
            onClick={commit}
          />
        </td>
      </tr>);
  }


  /**
  *
  * @returns {Element}
   */
  function NewProcedureRow(){
    const procedure = new Procedure(undefined, "", "", "", "", activeEndpoint);
    const procedureIdentifier = [...state.procedure_identifier.values()].filter(
      (pi) => !activeProcedures.has(pi.id)
    )
    const procedureIdentifierOptions = toOptions(procedureIdentifier, 'description')

    procedureIdentifierOptions.push(new Option("", "-----------------"))
    // State Declaration
    const [seriesDescription, setSeriesDescription] = useState(nullParser(procedure.series_description));
    const [tracer, setTracer] = useState(nullParser(procedure.tracer));
    const [units, setUnits] = useState(procedure.tracer_units);
    const [delay, setDelay] = useState(procedure.delay_minutes);
    const [errorSeriesDescription, setErrorSeriesDescription] = useState("");
    const [errorUnits, setErrorUnits] = useState("");
    const [errorDelay, setErrorDelay] = useState("");

    function commit(){
      let parsedSeriesDescription = Number(seriesDescription)
      if(seriesDescription === ""){
        setErrorSeriesDescription(ERROR_MISSING_SERIES_DESCRIPTION);
        return;
      }
      setErrorSeriesDescription("");
      let parsedTracer = Number(tracer)
      if(tracer === ""){
        parsedTracer = null
      }
      console.log(tracer)
      const [validUnits, parsedUnits] = parseWholePositiveNumber(units, "Enheder");
      const [validDelay, parsedDelay] = parseDanishNumberInput(delay, "Forsinkelsen");

      if(validDelay && validUnits){
        websocket.sendCreateModel(DATA_PROCEDURE, [
          {...procedure,
            series_description : parsedSeriesDescription,
            tracer : parsedTracer,
            delay_minutes : parsedDelay,
            tracer_units : parsedUnits,
          }]);
        return;
      }
      // Error handling
      if(!validUnits){
        setErrorUnits(parsedUnits);
      }
      if(!validDelay){
        setErrorDelay(parsedDelay);
      }
    }

    return (
      <tr>
        <td>
          <ErrorInput error={errorSeriesDescription}>
            <Select
              data-testid="new-procedure-identifier"
              options={procedureIdentifierOptions}
              value={seriesDescription}
              onChange={setStateToEvent(setSeriesDescription)}
            />
          </ErrorInput>
        </td>
        <td>
          <Select
            data-testid="new-tracer"
            options={tracerOptions}
            value={tracer}
            onChange={setStateToEvent(setTracer)}
          />
        </td>
        <td>
          <ErrorInput error={errorUnits}>
            <FormControl
              data-testid="new-units"
              value={units}
              onChange={setStateToEvent(setUnits)}/>
          </ErrorInput>
        </td>
        <td>
          <ErrorInput error={errorDelay}>
            <FormControl
              data-testid="new-delay"
              value={delay}
              onChange={setStateToEvent(setDelay)}
            />
          </ErrorInput>
          </td>
        <td>
          <ClickableIcon
            label="new-create"
            src="/static/images/plus.svg"
            onClick={commit}
          />
        </td>
      </tr>
    );
  }

  const procedureRows = [];
  let index = 0;
  const sortedProcedures = [...activeProcedures.values()].sort(sort_procedures(state, sortingMethod))

  for (const procedure of sortedProcedures){
    procedureRows.push(<ProcedureRow
      key={index}
      procedure={procedure}
    />);
    index++;
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
        customers={state.customer}
        endpoints={state.delivery_endpoint}
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
          <th></th>
        </tr>
      </thead>
      <tbody>
        {procedureRows}
        <NewProcedureRow/>
      </tbody>
    </Table>
  </div>)
}