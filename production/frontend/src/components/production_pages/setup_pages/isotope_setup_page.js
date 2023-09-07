import React, {useState} from 'react';
import { Col, Container, FormCheck, FormControl, InputGroup, Row, Table } from 'react-bootstrap';
import { JSON_ISOTOPE, PROP_WEBSOCKET, cssCenter } from '../../../lib/constants';
import { TracershopInputGroup } from '../../injectable/tracershop_input_group';
import { setStateToEvent } from '../../../lib/state_management';
import { ClickableIcon } from '../../injectable/icons';

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

  const [atomicLetter, setAtomicLetter] = useState(isotope.atomic_letter);
  const [atomicNumber, setAtomicNumber] = useState(isotope.atomic_number);
  const [atomicMass, setAtomicMass] = useState(isotope.atomic_mass);
  const [halflifeSeconds, setHalflifeSeconds] = useState(isotope.halflife_seconds);
  const [metastable, setMetastable] = useState(isotope.metastable);

  const changed = !(atomicLetter === isotope.atomic_letter
               && Number(atomicNumber) === isotope.atomic_number
               && Number(atomicMass) === isotope.atomic_mass
               && Number(halflifeSeconds) === isotope.halflife_seconds
               && metastable === isotope.metastable)

  console.log(atomicLetter === isotope.atomic_letter,
    Number(atomicNumber) === isotope.atomic_number,
    Number(atomicMass) === isotope.atomic_mass,
    Number(halflifeSeconds) === isotope.halflife_seconds,
    metastable === isotope.metastable)

  function updateIsotope(){

  }

  return (<tr>
    <td>
      <TracershopInputGroup label="Bogstav">
        <FormControl 
          value={atomicLetter}
          onChange={setStateToEvent(setAtomicLetter)}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <FormControl
        value={atomicNumber}
        onChange={setStateToEvent(setAtomicNumber)}
      />
    </td>
    <td>
      <FormControl
        value={atomicMass}
        onChange={setStateToEvent(setAtomicMass)}
      />
    </td>
    <td>
      <TracershopInputGroup label="Halveringstid">
        <FormControl
          value={halflifeSeconds}
          onChange={setStateToEvent(setHalflifeSeconds)}
        />
        <InputGroup.Text>
          Sekunder
        </InputGroup.Text>
      </TracershopInputGroup>
    </td>
    <td>
      <FormCheck
        onChange={() => {setMetastable(!metastable)}}
        checked={metastable}
        />
    </td>
    <td>
      {changed ? <ClickableIcon
        src="/static/images/update.svg"
        onclick={updateIsotope}
      /> : ""}
    </td>
  </tr>)
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