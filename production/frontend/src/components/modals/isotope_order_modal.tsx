import React, { useState } from "react";
import { Button, Col, Form, FormControl, Modal, Row, Table } from "react-bootstrap";
import { IsotopeOrderCollection } from "~/lib/data_structures/isotope_order_collection";
import { CloseButton } from "../injectable/buttons";
import { ALIGN, CENTER, cssTableCenter, FONT, JUSTIFY, MARGIN } from "~/lib/styles";
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
import { CommitIcon } from "../injectable/commit_icon";
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
import { DateDisplay } from "../injectable/data_displays/date_display";
import { CancelBox } from "../injectable/cancel_box";
import { CancelButton } from "../injectable/cancel_button";


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
    if(0 >= vial.id && editing){
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


  const editButton = (<Optional exists={!isSelected}>
    <ClickableIcon
      src={"/static/images/pen.svg"}
      onClick={() => setEditing(true)}
      />
    </Optional>
  );


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
        <CommitIcon
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
          disabled={editing}
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
          <Col style={ALIGN.CENTER} ><h4 style={MARGIN.NO}>Destination:</h4></Col>
          <Col style={ALIGN.CENTER} ><h4 style={MARGIN.NO}><EndpointDisplay endpoint={collection.endpoint}/></h4></Col>
        </Row>
        <hr style={{margin : 8}}/>
        <Row>
          <Col style={ALIGN.CENTER}><h4 style={MARGIN.NO}>Leverings tidspunkt:</h4></Col>
          <Col style={ALIGN.CENTER}><h4 style={MARGIN.NO}><TimeDisplay time={collection.delivery.delivery_time}/></h4></Col>
        </Row>
        <hr style={{ margin : 8 }}/>
        <Row>
          <Col style={ALIGN.CENTER}><h4 style={MARGIN.NO}>Samlet bestilt aktivitet:</h4></Col>
          <Col style={ALIGN.CENTER}><h4 style={MARGIN.NO}><MBqDisplay activity={collection.ordered_activity}/></h4></Col>
        </Row>
        <hr style={{ margin : 8 }}/>
        <Row>
          <Col style={ALIGN.CENTER}><h4 style={MARGIN.NO}>Ordre:</h4></Col>
          <Col style={ALIGN.CENTER}>{isotopeOrders}</Col>
        </Row>
        <hr style={{ margin : 8 }}/>
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
  collection : IsotopeOrderCollection,
  isAuthenticatingState : [boolean, React.Dispatch<React.SetStateAction<boolean>>]
}

function IsotopeModalFooter({
  onClose, selectedVials, collection, isAuthenticatingState
} : IsotopeModalFooterProps){


  return (
  <Row style={{width : "100%"}}>
    <Col>
      <CancelButton/>
    </Col>
    <Col>
      <Row style={JUSTIFY.right}>
        <Optional exists={true}>
          <Col style={{flex : "0 1"}}>
            <Button>
              Frigiv
            </Button>
          </Col>
        </Optional>
        <Col style={{flex : "0 1"}}>
          <CloseButton onClick={onClose}/>
        </Col>
      </Row>
    </Col>
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
  const state = useTracershopState();
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
      <Row style={ALIGN.CENTER}>
        <h2 style={MARGIN.NO}>Isotope ordre til: <EndpointDisplay endpoint={collection.endpoint}/> -  <DateDisplay date={state.today}/></h2>
      </Row>
    </Modal.Header>
    <Modal.Body>
      <IsotopeModalBody
        collection={collection}
        isAuthenticatingState={isAuthenticatingState}
        selectedVialsState={selectedVialsState}
      />
    </Modal.Body>
    <Modal.Footer>
      <IsotopeModalFooter isAuthenticatingState={isAuthenticatingState} collection={collection} selectedVials={selectedVials} onClose={onClose}/>
    </Modal.Footer>
  </Modal>);
}
