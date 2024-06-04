import React from 'react'
import { FormCheck, FormControl, Table } from 'react-bootstrap';
import { useTracershopState, useWebsocket } from '~/components/tracer_shop_context'
import { ProcedureIdentifier } from '~/dataclasses/dataclasses';
import { DATA_PROCEDURE_IDENTIFIER } from '~/lib/shared_constants';


/**
 *
 * @param {object} param0
 * @param {ProcedureIdentifier} param0.pi
 * @returns
 */
function ProcedureIdentifierRow({pi}){
  const websocket = useWebsocket();
  function togglePet(){
    websocket.sendEditModel(DATA_PROCEDURE_IDENTIFIER, {...pi, is_pet : !pi.is_pet});
  }

  return <tr>
    <td>{pi.description}</td>
    <td>{pi.code}</td>
    <td>
      <FormCheck checked={pi.is_pet} onClick={togglePet}/>
    </td>
  </tr>
}

/** This Component displays all procedure identifiers for the purpose of
 * toggling if it would make sense to order pet tracer
 */
export function ProcedureIdentifierTable() {
  const state = useTracershopState();

  const piRows = [];
  for(const pi of state.procedure_identifier.values()){
    piRows.push(<ProcedureIdentifierRow pi={pi} key={pi.id}/>);
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