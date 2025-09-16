import React, { useState } from "react";
import { Col, Form, FormControl, Modal, Row, Table } from "react-bootstrap";
import { IsotopeOrderCollection } from "~/lib/data_structures/isotope_order_collection";
import { CloseButton } from "../injectable/buttons";
import { FONT } from "~/lib/styles";
import { EndpointDisplay } from "../injectable/data_displays/endpoint";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { IsotopeVial, TracershopState } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";
import { isotopeVialFilter } from "~/lib/filters";
import { getId } from "~/lib/utils";
import { DateRange, datify } from "~/lib/chronomancy";
import { ClickableIcon } from "../injectable/icons";
import { Optional } from "../injectable/optional";
import { setStateToEvent } from "~/lib/state_management";
import { EditableInput } from "../injectable/inputs/editable_input";
import { CommitButton } from "../injectable/commit_button";
import { parseBatchNumberInput, parseDanishPositiveNumberInput } from "~/lib/user_input";
import { DATA_ISOTOPE_VIAL } from "~/lib/shared_constants";


function getModalVials(collection: IsotopeOrderCollection, state: TracershopState){
  switch (collection.minimum_status){
    case ORDER_STATUS.RELEASED:
      return isotopeVialFilter(state, { deliveredTo : collection.orders.map(getId) });
    case ORDER_STATUS.ACCEPTED:
    case ORDER_STATUS.ORDERED:
          return isotopeVialFilter(state, {
            isEmpty : true,
        date : datify(state.today)
      })
    default:
      return [];
  }
}

type VialRowProps = {
  vial : IsotopeVial
}

function VialRow({vial} : VialRowProps){
  const state = useTracershopState();
  const [editing, setEditing] = useState(vial.id === -1);

  const [etherealBatchNumber, setEtherealBatchNumber] = useState(vial.batch_nr);
  const [etherealFillTime, setEtherealFillTime] = useState("");
  const [etherealVolume, setEtherealVolume]  = useState(vial.volume);
  const [etherealActivity, setEtherealActivity]  = useState(vial.vial_activity);

  function validateVial(){
    const [validBatchNumber, batchNumber] = parseBatchNumberInput(etherealBatchNumber, 'Batch Nr.');
    const [validFillTime, fillTime] = parseBatchNumberInput(etherealBatchNumber, 'Kalibrering Tid');
    const [validVolume, volume] = parseDanishPositiveNumberInput(etherealVolume, 'Volumen');
    const [validActivity, activity] = parseDanishPositiveNumberInput(etherealActivity, 'Aktivitet');

    return [true, {
      ...vial,
      batch_nr : batchNumber,
      volume : volume,
      vial_activity : activity

    }]
  }

  return (
  <tr>
    <td>
      <EditableInput
        canEdit={editing}
        value={etherealBatchNumber}
        onChange={setStateToEvent(setEtherealBatchNumber)}
      />;
    </td>
    <td>
      <EditableInput
        canEdit={editing}
        value={etherealFillTime}
        onChange={setStateToEvent(setEtherealFillTime)}
      />;
    </td>
    <td>
      <EditableInput
        canEdit={editing}
        value={etherealVolume}
        onChange={setStateToEvent(setEtherealVolume)}
      />;
    </td>
    <td>
      <EditableInput
        canEdit={editing}
        value={etherealActivity}
        onChange={setStateToEvent(setEtherealActivity)}
      />;
    </td>
    <td></td>
    <td>
      <CommitButton
        temp_object={vial}
        validate={validateVial}
        object_type={DATA_ISOTOPE_VIAL}
      />

    </td>
  </tr>);
}

type VialTableProps = {
  collection : IsotopeOrderCollection,
  showingEtherealVial : boolean
}

function VialTable({collection, showingEtherealVial} : VialTableProps){
  const [etherealVial, setEtherealVial] = useState(new IsotopeVial(-1, "", null, "", "", "", ""));


  const state = useTracershopState();
  const vials = getModalVials(collection, state);
  const vialRows = vials.map((vial) => <VialRow key={vial.id} vial={vial}/>)

  if(showingEtherealVial){
    vialRows.push(
      <VialRow key={-1} vial={etherealVial}/>
    );
  }


  return (<Table>
    <thead>
      <tr>
        <th>Batch nr</th>
        <th>Dispenseret</th>
        <th>volume</th>
        <th>aktivitet</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {vialRows}
    </tbody>
  </Table>);
}

function IsotopeModalBody({
  collection
}){
  const [showingEtherealVial, setShowingEtherealVial] = useState(false);
  const showEtherealVial = () => {setShowingEtherealVial(true);}
  const hideEtherealVial = () => {setShowingEtherealVial(false);}

  const showShowEtherealVialButton = !showingEtherealVial &&
    [ORDER_STATUS.ACCEPTED, ORDER_STATUS.ORDERED].includes(collection.minimum_status);
  console.log(showShowEtherealVialButton);

  return (
    <div>
      <VialTable collection={collection} showingEtherealVial={showingEtherealVial}/>
      <Row>
        <Optional exists={showShowEtherealVialButton}>
          <ClickableIcon src="/static/images/plus.svg" onClick={showEtherealVial}/>
        </Optional>
      </Row>
    </div>
  );
}



function IsotopeModalFooter({
  onClose
}){
  return <Row>
    <Col><CloseButton onClick={onClose}/></Col>
  </Row>
}

type IsotopeOrderModalProps = {
  collection : IsotopeOrderCollection,
  onClose : () => void
}

export function IsotopeOrderModal({
  collection, onClose,
}: IsotopeOrderModalProps){


  return (
  <Modal
    size="lg"
    show={true /** Use Optional instead, this will prevent funny stuff from happening */}
    style={FONT.light}
    onHide={onClose}
  >
    <Modal.Header>
      <h2>Isotope Ordre til <EndpointDisplay endpoint={collection.endpoint}/></h2>
    </Modal.Header>
    <Modal.Body>
      <IsotopeModalBody
        collection={collection}
      />
    </Modal.Body>
    <Modal.Footer>
      <IsotopeModalFooter onClose={onClose}/>
    </Modal.Footer>
  </Modal>);
}
