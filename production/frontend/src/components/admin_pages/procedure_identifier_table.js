import React from 'react'
import { FormCheck, FormControl, Table } from 'react-bootstrap';
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context'
import { ProcedureIdentifier } from '~/dataclasses/dataclasses';
import { DATA_PROCEDURE_IDENTIFIER } from '~/lib/shared_constants';


/**
 *
 * @param {object} param0
 * @param {ProcedureIdentifier} param0.pi
 * @returns
 */
function ProcedureIdentifierRow({procedure_identifier}){
  const websocket = useWebsocket();
  function togglePet(){
    websocket.sendEditModels(DATA_PROCEDURE_IDENTIFIER, {...procedure_identifier, is_pet : !procedure_identifier.is_pet});
  }

  return (
  <tr>
    <td>{procedure_identifier.description}</td>
    <td>{procedure_identifier.code}</td>
    <td>
      <FormCheck checked={procedure_identifier.is_pet} onChange={togglePet}/>
    </td>
  </tr>);
}

/** This Component displays all procedure identifiers for the purpose of
 * toggling if it would make sense to order pet tracer
 */
export function ProcedureIdentifierTable() {
  const state = useTracershopState();

  const piRows = [];
  for(const pi of state.procedure_identifier.values()){
    piRows.push(<ProcedureIdentifierRow procedure_identifier={pi} key={pi.id}/>);
  }

  return <Table>
    <thead>
      <tr>
        <th>Procedure navn</th>
        <th>Procedure kode</th>
        <th>Er pet</th>
      </tr>
    </thead>
    <tbody>
      {piRows}
    </tbody>
  </Table>
}