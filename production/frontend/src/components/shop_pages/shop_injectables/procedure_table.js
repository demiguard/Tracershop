import React, { useState, useRef, useEffect } from "react";
import { FormControl, Table } from "react-bootstrap";

import { DATA_PROCEDURE, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_STATUS } from "~/lib/shared_constants"
import { Customer, Procedure } from "~/dataclasses/dataclasses";
import { Select, toOptions, Option } from "../../injectable/select";
import { nullParser } from "~/lib/formatting";
import { EndpointsProcedures } from "~/lib/data_structures";
import { TracerCatalog } from '~/contexts/tracer_catalog';
import { DestinationSelect } from "../../injectable/derived_injectables/destination_select";
import { initialize_customer_endpoint } from "~/lib/initialization";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { setStateToEvent } from "~/lib/state_management";
import { parseDanish0OrPositiveNumberInput, parseDanishPositiveNumberInput } from "~/lib/user_input";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { PROCEDURE_SORTING, sort_procedures } from "~/lib/sorting";
import { CommitButton } from "~/components/injectable/commit_button";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { useUpdatingEffect } from "~/effects/updating_effect";

export const ERROR_MISSING_SERIES_DESCRIPTION = "Du skal vælge en Series description"

  /**
  *
  * @param {{
  *  procedureIdentifier : Procedure
  * }} props
  * @returns {Element}
   */
  function ProcedureRow({procedure, tracerOptions, activeProcedures}){
    const state = useTracershopState();
    const procedureIdentifier = state.procedure_identifier.get(nullParser(procedure.series_description));

    // State Declaration
    const [tracer, setTracer] = useState(nullParser(procedure.tracer));
    const [units, setUnits] = useState(nullParser(procedure.tracer_units));
    const [delay, setDelay] = useState(nullParser(procedure.delay_minutes));
    const [seriesDescription, setSeriesDescription] = useState(procedure.series_description);
    const [errorTracer, setErrorTracer] = useState("");
    const [errorUnits, setErrorUnits] = useState("");
    const [errorDelay, setErrorDelay] = useState("");
    const [errorSeriesDescription, setErrorSeriesDescription] = useState("");

    // Refresh
    useUpdatingEffect(() => {
      setTracer(nullParser(procedure.tracer));
      setUnits(nullParser(procedure.tracer_units));
      setDelay(nullParser(procedure.delay_minutes))
    }, [procedure]);

    // Note type corrosion is needed here
    const dirtyObject = procedure.tracer != tracer
      || procedure.delay_minutes != delay
      || procedure.tracer_units != units


    let procedureContent = undefined;
    if(procedureIdentifier){
      procedureContent = <div>{procedureIdentifier.description}</div>;
    } else {
      const procedureIdentifier = [...state.procedure_identifier.values()].filter(
        (pi) => !activeProcedures.has(pi.id)
      )
      const procedureIdentifierOptions = toOptions(procedureIdentifier, 'description')
      procedureIdentifierOptions.push(new Option("", "-----------------"))

      procedureContent = (
        <ErrorInput error={errorSeriesDescription}>
          <Select
            data-testid={`procedure-identifier-${procedure.id}`}
            options={procedureIdentifierOptions}
            value={seriesDescription}
            onChange={setStateToEvent(setSeriesDescription)}
          />
        </ErrorInput>
      );
    }

    function validate(){
      let parsedTracer = Number(tracer);
      if(tracer === ""){
        parsedTracer = null
      }
      const validTracer = parsedTracer !== null;
      const [validUnits, parsedUnits] = parseDanishPositiveNumberInput(units, "Enheder");
      const [validDelay, parsedDelay] = parseDanish0OrPositiveNumberInput(delay, "Forsinkelsen");
      const validSeriesDescription = procedure.series_description !== "" || seriesDescription;
      const parsedSeriesDescription = procedure.series_description || Number(seriesDescription);

      if(!validUnits){
        setErrorUnits(parsedUnits);
      } else {
        setErrorUnits("");
      }
      if(!validDelay){
        setErrorDelay(parsedDelay);
      } else {
        setErrorDelay("");
      }
      if(!validSeriesDescription){
        setErrorSeriesDescription(ERROR_MISSING_SERIES_DESCRIPTION);
      } else {
        setErrorSeriesDescription("");
      }
      if(!validTracer){
        setErrorTracer("Du skal vælge en tracer");
      } else {
        setErrorTracer("")
      }

      return [validDelay && validUnits && validSeriesDescription && validTracer, {
        ...procedure,
        tracer : parsedTracer,
        delay_minutes : parsedDelay,
        tracer_units : parsedUnits,
        series_description : parsedSeriesDescription,
      }];
    }

    function commit_callback(response){
      if (response[WEBSOCKET_MESSAGE_STATUS] === SUCCESS_STATUS_CRUD.SUCCESS &&
          procedure.id === -1){
        setDelay(0);
        setUnits(0);
        setTracer("");
        setSeriesDescription("");
      }
    }

    return (
      <tr>
        <td>{procedureContent}</td>
        <td>
          <TracershopInputGroup error={errorTracer}>
            <Select
              data-testid={`tracer-${procedure.id}`}
              options={tracerOptions}
              value={tracer}
              onChange={setStateToEvent(setTracer)}
            />
          </TracershopInputGroup>
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
          <ErrorInput error={errorUnits}>
            <FormControl
              value={units}
              onChange={setStateToEvent(setUnits)}
              data-testid={`units-${procedure.id}`}
            />
          </ErrorInput>
        </td>
        <td>
          <Optional exists={dirtyObject}>
            <CommitButton
              object_type={DATA_PROCEDURE}
              temp_object={procedure}
              label={`commit-${procedure.id}`}
              validate={validate}
              callback={commit_callback}
            />
          </Optional>
        </td>
      </tr>);
  }

/**
 *
 * @param {object} param0
 * @param {Map<Number, Customer>} param0.relatedCustomer
 * @returns
 */
export function ProcedureTable({relatedCustomer}){
  const state = useTracershopState();

  const init = useRef({
    customer : null,
    endpoint : null,
  });

  if(init.current.customer === null || init.current.endpoint === null){
    init.current = initialize_customer_endpoint(relatedCustomer, state.delivery_endpoint)
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
  const procedureRows = [];
  const sortedProcedures = [...activeProcedures.values()].sort(sort_procedures(state,
    sortingMethod));

  let index = 0;
  for (const procedure of sortedProcedures){
    procedureRows.push(<ProcedureRow
      key={index}
      procedure={procedure}
      activeEndpoint={activeEndpoint}
      tracerOptions={tracerOptions}
      activeProcedures={activeProcedures}
    />);
    index++;
  }

  procedureRows.push(
    <ProcedureRow
      key={-1}
      procedure={
        new Procedure(-1, "", 0, 0, "", activeEndpoint)
      }
      activeEndpoint={activeEndpoint}
      tracerOptions={tracerOptions}
      activeProcedures={activeProcedures}
    />
  )

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
          <th>Forsinkelse I Minutter</th>
          <th>MBq / Injektioner per undersøgelse</th>
          <th>I brug</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {procedureRows}
      </tbody>
    </Table>
  </div>);
}