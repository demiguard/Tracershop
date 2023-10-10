import React, {useState} from 'react';
import { Container, FormCheck, FormControl, InputGroup, Table } from 'react-bootstrap';

import { DATA_ISOTOPE } from '~/lib/shared_constants';
import { TracershopInputGroup } from '../../injectable/tracershop_input_group';
import { setStateToEvent } from '../../../lib/state_management';
import { ClickableIcon } from '../../injectable/icons';
import { parseDanishPositiveNumberInput } from '../../../lib/user_input';
import { Isotope } from '../../../dataclasses/dataclasses';
import { TracerWebSocket } from '../../../lib/tracer_websocket';
import { ErrorInput } from '../../injectable/error_input';
import { useWebsocket } from '~/components/tracer_shop_context';

function NewIsotopeRow({websocket}){
  const [atomicLetter, setAtomicLetter] = useState("");
  const [atomicNumber, setAtomicNumber] = useState("");
  const [atomicMass, setAtomicMass] = useState("");
  const [halflifeSeconds, setHalflifeSeconds] = useState("");
  const [metastable, setMetastable] = useState(false);

  const [atomicNumberError, setAtomicNumberError] = useState("");
  const [atomicMassError, setAtomicMassError] = useState("");
  const [halflifeError, setHalflifeError] = useState("");

  const createAble = atomicLetter !== ""
                      && atomicNumber !== ""
                      && atomicMass !== ""
                      && halflifeSeconds !== "";

  function createIsotope(){
    const [validAtomicNumber, parsedAtomicNumber] = parseDanishPositiveNumberInput(atomicNumber, "Atom nummeret");
    const [validAtomicMass, parsedAtomicMass] = parseDanishPositiveNumberInput(atomicMass, "Atom massen");
    const [validHalflife, parsedHalflife] = parseDanishPositiveNumberInput(halflifeSeconds, "Halveringstiden");

    if (validAtomicNumber && validAtomicMass && validHalflife){
      websocket.sendCreateModel(DATA_ISOTOPE,{
        atomic_letter : atomicLetter,
        atomic_number : parsedAtomicNumber,
        atomic_mass : parsedAtomicMass,
        halflife_seconds : parsedHalflife,
        metastable : metastable,
      });
    } else {
      if(!validAtomicNumber){
        setAtomicNumberError(parsedAtomicNumber)
      }

      if(!validAtomicMass) {
        setAtomicMassError(parsedAtomicMass)
      }

      if(!validHalflife){
        setHalflifeError(parsedHalflife)
      }
    }
  }


  return (<tr>
    <td>
      <TracershopInputGroup label="Bogstav">
        <FormControl
          maxLength={3}
          value={atomicLetter}
          onChange={setStateToEvent(setAtomicLetter)}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <ErrorInput error={atomicNumberError}>
        <FormControl
          value={atomicNumber}
          onChange={setStateToEvent(setAtomicNumber)}
        />
      </ErrorInput>
    </td>
    <td>
      <ErrorInput error={atomicMassError}>
        <FormControl
          value={atomicMass}
          onChange={setStateToEvent(setAtomicMass)}
        />
      </ErrorInput>
    </td>
    <td>
      <TracershopInputGroup label="Halveringstid">
        <ErrorInput error={halflifeError}>
          <FormControl
            value={halflifeSeconds}
            onChange={setStateToEvent(setHalflifeSeconds)}
          />
        </ErrorInput>
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
    {createAble ? <ClickableIcon
        src="/static/images/plus.svg"
        onClick={createIsotope}
      /> : ""}
    </td>
  </tr>);
}

/**
 * 
 * @param {{
 *   isotope : Isotope,
 *   websocket : TracerWebSocket
 * }} param0 - input props
 * @returns 
 */
function IsotopeRow({isotope, websocket}){
  const [atomicLetter, setAtomicLetter] = useState(isotope.atomic_letter);
  const [atomicNumber, setAtomicNumber] = useState(isotope.atomic_number);
  const [atomicMass, setAtomicMass] = useState(isotope.atomic_mass);
  const [halflifeSeconds, setHalflifeSeconds] = useState(isotope.halflife_seconds);
  const [metastable, setMetastable] = useState(isotope.metastable);

  const [atomicNumberError, setAtomicNumberError] = useState("");
  const [atomicMassError, setAtomicMassError] = useState("");
  const [halflifeError, setHalflifeError] = useState("");


  const changed = !(atomicLetter === isotope.atomic_letter
               && Number(atomicNumber) === isotope.atomic_number
               && Number(atomicMass) === isotope.atomic_mass
               && Number(halflifeSeconds) === isotope.halflife_seconds
               && metastable === isotope.metastable)


  function updateIsotope(){
    const [validAtomicNumber, parsedAtomicNumber] = parseDanishPositiveNumberInput(atomicNumber, "Atom nummeret");
    const [validAtomicMass, parsedAtomicMass] = parseDanishPositiveNumberInput(atomicMass, "Atom massen");
    const [validHalflife, parsedHalflife] = parseDanishPositiveNumberInput(halflifeSeconds, "Halveringstiden");

    if (validAtomicNumber && validAtomicMass && validHalflife){
      websocket.sendEditModel(DATA_ISOTOPE, {...isotope,
        atomic_letter : atomicLetter,
        atomic_number : parsedAtomicNumber,
        atomic_mass : parsedAtomicMass,
        halflife_seconds : parsedHalflife,
        metastable : metastable,
      });
    } else {
      if(!validAtomicNumber){
        setAtomicNumberError(parsedAtomicNumber)
      }

      if(!validAtomicMass) {
        setAtomicMassError(parsedAtomicMass)
      }

      if(!validHalflife){
        setHalflifeError(parsedHalflife)
      }
    }
  }

  return (<tr>
    <td>
      <TracershopInputGroup label="Bogstav">
        <FormControl
          maxLength={3}
          value={atomicLetter}
          onChange={setStateToEvent(setAtomicLetter)}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <ErrorInput error={atomicNumberError}>
        <FormControl
          value={atomicNumber}
          onChange={setStateToEvent(setAtomicNumber)}
        />
      </ErrorInput>
    </td>
    <td>
      <ErrorInput error={atomicMassError}>
        <FormControl
          value={atomicMass}
          onChange={setStateToEvent(setAtomicMass)}
        />
      </ErrorInput>
    </td>
    <td>
      <TracershopInputGroup label="Halveringstid">
        <ErrorInput error={halflifeError}>
          <FormControl
            value={halflifeSeconds}
            onChange={setStateToEvent(setHalflifeSeconds)}
          />
        </ErrorInput>
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
        onClick={updateIsotope}
      /> : ""}
    </td>
  </tr>)
}


export function IsotopeSetupPage(props) {
  const websocket = useWebsocket()
  const isotopeRows = [...props[DATA_ISOTOPE].values()].map(
    (isotope) => <IsotopeRow
    key={isotope.id}
    isotope={isotope}
    websocket={websocket}
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
        <NewIsotopeRow
          websocket={websocket}
        />
      </tbody>
    </Table>
  </Container>)
}