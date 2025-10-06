import React, { useState } from "react";
import { Col, Form, FormControl, Modal, Row, Table } from "react-bootstrap";
import { IsotopeOrderCollection } from "~/lib/data_structures/isotope_order_collection";
import { CloseButton } from "../injectable/buttons";
import { CENTER, cssTableCenter, FONT, JUSTIFY } from "~/lib/styles";
import { EndpointDisplay } from "../injectable/data_displays/endpoint";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { IsotopeVial, TracershopState } from "~/dataclasses/dataclasses";
import { ORDER_STATUS, StateType } from "~/lib/constants";
import { isotopeVialFilter } from "~/lib/filters";
import { dataClassExists, getId } from "~/lib/utils";
import { DateRange, datify, getTimeString } from "~/lib/chronomancy";
import { ClickableIcon, EtherealIcon } from "../injectable/icons";
import { Optional } from "../injectable/optional";
import { setStateToEvent } from "~/lib/state_management";
import { EditableInput } from "../injectable/inputs/editable_input";
import { CommitButton } from "../injectable/commit_button";
import { parseBatchNumberInput, parseDanishPositiveNumberInput, parseTimeInput } from "~/lib/user_input";
import { DATA_ISOTOPE_VIAL } from "~/lib/shared_constants";
import { useErrorState, setError } from "~/lib/error_handling";
import { dateToDateString } from "~/lib/formatting";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { TimeInput } from "../injectable/inputs/time_input";
import { TimeDisplay } from "../injectable/data_displays/time_display";
import { FlexMinimizer } from "../injectable/flexMinimizer";
import { MBqDisplay } from "../injectable/data_displays/mbq_display";
import { IsotopeOrderRow } from "../production_pages/production_injectables/isotope_order_row";


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
  vial : IsotopeVial,
  selectedVialsState : StateType<Set<number>>
}

function VialRow({vial, selectedVialsState} : VialRowProps){
  const state = useTracershopState();
  const [selectedVials, setSelectedVials] = selectedVialsState;
  const [editing, setEditing] = useState(vial.id === -1);

  const startingTime = vial.calibration_datetime ?
      getTimeString(new Date(vial.calibration_datetime))
    : "";

  const [etherealBatchNumber, setEtherealBatchNumber] = useState(vial.batch_nr);
  const [etherealFillTime, setEtherealFillTime] = useState(startingTime);
  const [etherealVolume, setEtherealVolume]  = useState(vial.volume);
  const [etherealActivity, setEtherealActivity]  = useState(vial.vial_activity);

  const [batchError, setBatchError] = useErrorState();
  const [fillTimeError, setFillTimeError] = useErrorState();
  const [volumeError, setVolumeError] = useErrorState();
  const [activityError, setActivityError] = useErrorState();

  const isSelected = selectedVials.has(vial.id);

  function toggleSelect(){
    if(0 >= vial.id){
      return;
    }
    setSelectedVials((old: Set<number>) => { // @ts-ignore
      const newSelectedVials = new Set<number>(old);
      if(newSelectedVials.has(vial.id)){
        newSelectedVials.delete(vial.id);
      } else {
        newSelectedVials.add(vial.id);
      }

      return newSelectedVials
    })

  }

  function validateVial(){
    const [validBatchNumber, batchNumber] = parseBatchNumberInput(etherealBatchNumber, 'Batch Nr.');
    const [validFillTime, fillTime] = parseTimeInput(etherealFillTime, 'Kalibrering Tid');
    const [validVolume, volume] = parseDanishPositiveNumberInput(etherealVolume, 'Volumen');
    const [validActivity, activity] = parseDanishPositiveNumberInput(etherealActivity, 'Aktivitet');

    // Glorified if statements, The CLEANEST of freaking code...
    // I just got annoyed at the repeated pattern
    setError(validBatchNumber, setBatchError, batchNumber)
    setError(validFillTime, setFillTimeError, fillTime)
    setError(validVolume, setVolumeError, volume)
    setError(validActivity, setActivityError, activity)

    // Note that this value becomes nonsense if time isn't valid, but it's ok
    // because this object will be discarded if so.
    const calibration_datetime = `${dateToDateString(state.today)} ${fillTime}`;
    // No time zone indicator and then the backend will parse this as Europe/Copenhagen

    if(  fillTime === startingTime
      && batchNumber === vial.batch_nr
      && volume === vial.volume
      && activity === vial.vial_activity
    ){
      // We do not have to update
      setEditing(false);
      return false;
    }


    return [validBatchNumber && validFillTime && validVolume && validActivity, {
      ...vial,
      calibration_datetime : calibration_datetime,
      batch_nr : batchNumber,
      volume : volume,
      vial_activity : activity
    }]
  }

  function handleServerResponse(response){
    console.log(response);
  }


  const editButton = <ClickableIcon
    src={"/static/images/pen.svg"}
    onClick={() => setEditing(true)}
  />


  return (
  <tr>
    <td>
      <TracershopInputGroup error={batchError}>
        <EditableInput
          canEdit={editing}
          value={etherealBatchNumber}
          onChange={setStateToEvent(setEtherealBatchNumber)}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <TracershopInputGroup error={fillTimeError}>
        <TimeInput
          canEdit={editing}
          value={etherealFillTime}
          stateFunction={setEtherealFillTime}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <TracershopInputGroup error={volumeError} tail={"mL"}>
        <EditableInput
          canEdit={editing}
          value={etherealVolume}
          onChange={setStateToEvent(setEtherealVolume)}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <TracershopInputGroup error={activityError} tail={"MBq"}>
        <EditableInput
          canEdit={editing}
          value={etherealActivity}
          onChange={setStateToEvent(setEtherealActivity)}
        />
      </TracershopInputGroup>
    </td>
    <td style={cssTableCenter}>
      <Optional exists={editing} alternative={editButton}>
        <CommitButton
          temp_object={vial}
          validate={validateVial}
          object_type={DATA_ISOTOPE_VIAL}
          callback={handleServerResponse}
        />
      </Optional>
    </td>
    <td style={cssTableCenter}>
      <Optional exists={dataClassExists(vial)}>

        <Form.Check
          onChange={toggleSelect}
          checked={isSelected}
        />
      </Optional>
    </td>
  </tr>);
}



type VialTableProps = {
  collection : IsotopeOrderCollection,
  selectedVialsState : StateType<Set<number>>,
  showingEtherealVial : boolean,
}

function VialTable({
  collection,
  showingEtherealVial,
  selectedVialsState} : VialTableProps
){
  const state = useTracershopState();
  const vials = getModalVials(collection, state);
  const vialRows = vials.map((vial) => <VialRow key={vial.id} vial={vial} selectedVialsState={selectedVialsState}/>)

  if(showingEtherealVial){
    const etherealVial = new IsotopeVial(-1, "", null, "", "", "", collection.isotope.id);
    // No point in making this a stateful object, because the row, create ethereal fields.
    vialRows.push(
      <VialRow key={-1} vial={etherealVial} selectedVialsState={selectedVialsState}/>
    );
  }

  return (<Table>
    <thead>
      <tr>
        <th>Batch nr</th>
        <th>Dispenseret kl:</th>
        <th>Volume</th>
        <th>Aktivitet</th>
        <th></th>
        <th>Valgt</th>
      </tr>
    </thead>
    <tbody>
      {vialRows}
    </tbody>
  </Table>);
}

type IsotopeModalBodyProps = {
  collection : IsotopeOrderCollection,
  isAuthenticatingState : StateType<boolean>,
  selectedVialsState : StateType<Set<number>>,
}

function IsotopeModalBody({
  collection, isAuthenticatingState, selectedVialsState
} : IsotopeModalBodyProps){
  const [showingEtherealVial, setShowingEtherealVial] = useState(false);

  const showShowEtherealVialButton =[ORDER_STATUS.ACCEPTED, ORDER_STATUS.ORDERED].includes(collection.minimum_status);

  const isotopeOrders = collection.orders.map(
    (io) => <IsotopeOrderRow key={io.id} order={io}/>
  )

  return (
    <div>
      <Row>
        <Row>
          <Col><h4>Destination:</h4></Col>
          <Col><h4><EndpointDisplay endpoint={collection.endpoint}/></h4></Col>
        </Row>
        <hr/>
        <Row>
          <Col><h4>Leverings tidspunk:</h4></Col>
          <Col><h4><TimeDisplay time={collection.delivery.delivery_time}/></h4></Col>
        </Row>
        <hr/>
        <Row>
          <Col><h4>Samlet bestilt aktivitet:</h4></Col>
          <Col><h4><MBqDisplay activity={collection.ordered_activity}/></h4></Col>
        </Row>
        <hr/>
        <Row>
          <Col><h4>Ordre:</h4></Col>
          <Col>{isotopeOrders}</Col>
        </Row>
        <hr/>
        <VialTable
          collection={collection}
          showingEtherealVial={showingEtherealVial}
          selectedVialsState={selectedVialsState}
        />
        <Optional exists={showShowEtherealVialButton}>
          <Row style={JUSTIFY.right}>
            <FlexMinimizer>
              <EtherealIcon showState={[showingEtherealVial, setShowingEtherealVial]}/>
            </FlexMinimizer>
          </Row>
        </Optional>
      </Row>
    </div>
  );
}

type IsotopeModalFooterProps = {
  onClose : () => void,
  selectedVials : Set<number>,
  collection : IsotopeOrderCollection
}

function IsotopeModalFooter({
  onClose, selectedVials, collection
} : IsotopeModalFooterProps){
  return (
  <Row>
    <Col><CloseButton onClick={onClose}/></Col>
  </Row>)
}

type IsotopeOrderModalProps = {
  collection : IsotopeOrderCollection,
  onClose : () => void
}

export function IsotopeOrderModal({
  collection, onClose,
}: IsotopeOrderModalProps){
  // Select vials have too be up here, because it's passed down to
  const isAuthenticatingState = useState(false);
  const selectedVialsState = useState(new Set<number>());

  const [selectedVials, setSelectedVials] = selectedVialsState;

  return (
  <Modal
    size="lg"
    show={true /** Use Optional instead, this will prevent funny stuff from happening */}
    style={FONT.light}
    onHide={onClose}
  >
    <Modal.Header>
      <h2>Isotope ordre til: <EndpointDisplay endpoint={collection.endpoint}/></h2>
    </Modal.Header>
    <Modal.Body>
      <IsotopeModalBody
        collection={collection}
        isAuthenticatingState={isAuthenticatingState}
        selectedVialsState={selectedVialsState}
      />
    </Modal.Body>
    <Modal.Footer>
      <IsotopeModalFooter collection={collection} selectedVials={selectedVials} onClose={onClose}/>
    </Modal.Footer>
  </Modal>);
}
