import React, {useState} from 'react';
import { Col, Container, Row, Table } from 'react-bootstrap';
import { JSON_ISOTOPE, PROP_WEBSOCKET } from '../../../lib/constants';

function NewIsotopeRow({websocket}){
  return (<tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>);
}

function IsotopeRow({isotope ,websocket}){
  return <tr>
    <td>{isotope.atomic_number}</td>
    <td>{isotope.atomic_mass}</td>
    <td>{isotope.halflife_seconds}</td>
    <td>{isotope.atomic_letter}</td>
    <td>{isotope.metastable}</td>
    <td></td>
  </tr>
}


export function IsotopeSetupPage(props) {
  const isotopeRows = [...props[JSON_ISOTOPE].values()].map(
    (isotope) => <IsotopeRow
    key={isotope.id}
    isotope={isotope}
    websocket={props[PROP_WEBSOCKET]}
  />);

  return (<Container>
    <Table>
      <thead>
        <tr>
          <th>Atom</th>
          <th>Atom Nummer</th>
          <th>Atom Masse</th>
          <th>Halveringstid</th>
          <th>Metastabil</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {isotopeRows}
        <NewIsotopeRow/>
      </tbody>
    </Table>
  </Container>)
}