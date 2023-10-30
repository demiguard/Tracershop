import React, {useState} from 'react';
import { Container, FormCheck, FormControl, InputGroup, Table } from 'react-bootstrap';

import { DATA_ISOTOPE } from '~/lib/shared_constants';
import { TracershopInputGroup } from '../../injectable/inputs/tracershop_input_group';
import { setStateToEvent, setTempObjectToEvent } from '../../../lib/state_management';
import { ClickableIcon } from '../../injectable/icons';
import { parseDanishPositiveNumberInput } from '../../../lib/user_input';
import { Isotope } from '../../../dataclasses/dataclasses';
import { TracerWebSocket } from '../../../lib/tracer_websocket';
import { ErrorInput } from '../../injectable/inputs/error_input';
import { useTracershopState, useWebsocket } from '~/components/tracer_shop_context';
import { CommitButton } from '~/components/injectable/commit_button';


export function IsotopeSetupPage(props) {
  const state = useTracershopState();
  const websocket = useWebsocket();

   /**
  * 
  * @param {{
  *   isotope : Isotope,
   * }} param0 - input props
   * @returns 
   */
  function IsotopeRow({isotope}){
    const [tempIsotope, setTempIsotope] = useState({...isotope});

    function setMetastable(newMetaStable){
      setTempIsotope({...tempIsotope, metastable : newMetaStable});
    }

    const [atomicNumberError, setAtomicNumberError] = useState("");
    const [atomicMassError, setAtomicMassError] = useState("");
    const [halflifeError, setHalflifeError] = useState("");

    const changed = !(tempIsotope.atomic_letter === isotope.atomic_letter
                 && Number(tempIsotope.atomic_number) === isotope.atomic_number
                 && Number(tempIsotope.atomic_mass) === isotope.atomic_mass
                 && Number(tempIsotope.halflife_seconds) === isotope.halflife_seconds
                 && tempIsotope.metastable === isotope.metastable);

    function validate(){
      const [validAtomicNumber, parsedAtomicNumber] = parseDanishPositiveNumberInput(tempIsotope.atomic_number, "Atom nummeret");
      const [validAtomicMass, parsedAtomicMass] = parseDanishPositiveNumberInput(tempIsotope.atomic_mass, "Atom massen");
      const [validHalflife, parsedHalflife] = parseDanishPositiveNumberInput(tempIsotope.halflife_seconds, "Halveringstiden");

      if(!validAtomicNumber){
        setAtomicNumberError(parsedAtomicNumber)
      }

      if(!validAtomicMass) {
        setAtomicMassError(parsedAtomicMass)
      }

      if(!validHalflife){
        setHalflifeError(parsedHalflife)
      }

      return [validAtomicNumber && validAtomicMass && validHalflife, {
        ...tempIsotope,
        atomic_number : parsedAtomicNumber,
        atomic_mass : parsedAtomicMass,
        halflife_seconds : parsedHalflife,
      }]
    }

    return (<tr>
      <td>
        <TracershopInputGroup label="Bogstav">
          <FormControl
            maxLength={3}
            value={tempIsotope.atomic_letter}
            onChange={setTempObjectToEvent(setTempIsotope, tempIsotope, 'atomic_letter')}
          />
        </TracershopInputGroup>
      </td>
      <td>
        <TracershopInputGroup>
          <ErrorInput error={atomicNumberError}>
            <FormControl
              value={tempIsotope.atomic_number}
              onChange={setTempObjectToEvent(setTempIsotope, tempIsotope, 'atomic_number')}
              />
          </ErrorInput>
          <InputGroup.Text>
            antal
          </InputGroup.Text>
        </TracershopInputGroup>
      </td>
      <td>
        <TracershopInputGroup>
          <ErrorInput error={atomicMassError}>
            <FormControl
              value={tempIsotope.atomic_mass}
              onChange={setTempObjectToEvent(setTempIsotope, tempIsotope, 'atomic_mass')}
              />
          </ErrorInput>
          <InputGroup.Text>
            antal
          </InputGroup.Text>
        </TracershopInputGroup>
      </td>
      <td>
        <TracershopInputGroup>
          <ErrorInput error={halflifeError}>
            <FormControl
              value={tempIsotope.halflife_seconds}
              onChange={setTempObjectToEvent(setTempIsotope, tempIsotope, 'halflife_seconds')}
            />
          </ErrorInput>
          <InputGroup.Text>
            Sekunder
          </InputGroup.Text>
        </TracershopInputGroup>
      </td>
      <td>
        <FormCheck
          onChange={() => {setMetastable(!tempIsotope.metastable)}}
          checked={tempIsotope.metastable}
          />
      </td>
      <td>
        {changed ? <CommitButton
          temp_object={tempIsotope}
          validate={validate}
          object_type={DATA_ISOTOPE}
        />
        : ""}
      </td>
    </tr>)
  }

  const isotopeRows = [...state.isotopes.values()].map(
    (isotope) => <IsotopeRow
    key={isotope.id}
    isotope={isotope}
  />);

  isotopeRows.push(
    <IsotopeRow
      key={-1}
      isotope={new Isotope(-1, "", "", "", "", false)}
    />
  )

  return (<Container>
    <Table>
      <thead>
        <tr>
          <th>Atom</th>
          <th>AtomNummer</th>
          <th>AtomMasse</th>
          <th>Halveringstid</th>
          <th>Metastabil</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {isotopeRows}
      </tbody>
    </Table>
  </Container>)
}