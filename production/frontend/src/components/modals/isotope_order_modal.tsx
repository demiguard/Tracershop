import React, { useState } from "react";
import { Button, Col, Container, Form, FormControl, Modal, Row, Table } from "react-bootstrap";
import { IsotopeOrderCollection } from "~/lib/data_structures/isotope_order_collection";
import { CloseButton } from "../injectable/buttons";
import { ALIGN, CENTER, cssTableCenter, DISPLAY, FONT, JUSTIFY, MARGIN } from "~/lib/styles";
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
import { DATA_ISOTOPE_VIAL } from "~/lib/shared_constants";
import { useErrorState, setError, ErrorMonad, RecoverableError } from "~/lib/error_handling";
import { dateToDateString } from "~/lib/formatting";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { TimeInput } from "../injectable/inputs/time_input";
import { TimeDisplay } from "../injectable/data_displays/time_display";
import { FlexMinimizer } from "../injectable/flexMinimizer";
import { MBqDisplay } from "../injectable/data_displays/mbq_display";
import { IsotopeOrderRow } from "../production_pages/production_injectables/isotope_order_row";
import { DateDisplay } from "../injectable/data_displays/date_display";
import { CancelButton } from "../injectable/cancel_button";
import { ReleaseButton } from "../production_pages/production_injectables/release_button";
import { parseBatchNumberBind, parseDanishPositiveNumberBind, parseTimeBind } from "~/lib/parsing";
import { Authenticate } from "../injectable/authenticate";
import { ERROR_LEVELS } from "../injectable/alert_box";


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
  isFreeing : boolean,
  selectedVialsState : StateType<Set<number>>
}

const fieldHeaderBatchNr = "Batch Nr.";
const fieldHeaderFillTime = "Kalibrering Tid";
const fieldHeaderVolume = "Volumen";
const fieldHeaderActivity = "Aktivitet"

function VialRow({vial, selectedVialsState, isFreeing} : VialRowProps){
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

  const [batchError,    setBatchError] = useErrorState();
  const [fillTimeError, setFillTimeError] = useErrorState();
  const [volumeError,   setVolumeError] = useErrorState();
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

  function clearError(){
    setBatchError(new RecoverableError());
    setFillTimeError(new RecoverableError());
    setVolumeError(new RecoverableError());
    setActivityError(new RecoverableError());
  }

  function validateVial(){
    const errorMonad = new ErrorMonad();
    errorMonad
      .bind(parseBatchNumberBind(etherealBatchNumber, fieldHeaderBatchNr))
      .bind(parseTimeBind(etherealFillTime, fieldHeaderFillTime))
      .bind(parseDanishPositiveNumberBind(etherealVolume, fieldHeaderVolume))
      .bind(parseDanishPositiveNumberBind(etherealActivity, fieldHeaderActivity));

    if(errorMonad.hasError()){
      for(const [id, error] of errorMonad.error){
        switch (id) {
          case fieldHeaderActivity:
            return setBatchError(error);
          case fieldHeaderFillTime:
            return setFillTimeError(error);
          case fieldHeaderVolume:
            return setVolumeError(error);
          case fieldHeaderBatchNr:
            return setBatchError(error);
        }
      }
      return false
    }

    clearError();

    const fillTime = errorMonad.get_value(fieldHeaderFillTime);

    const calibration_datetime = `${dateToDateString(state.today)} ${fillTime}`;
    const batchNumber = errorMonad.get_value(fieldHeaderBatchNr);
    const volume = errorMonad.get_value(fieldHeaderVolume);
    const activity = errorMonad.get_value(fieldHeaderActivity);

    // No time zone indicator and then the backend will parse this as Europe/Copenhagen

    if(fillTime === startingTime
      && batchNumber === vial.batch_nr
      && volume === vial.volume
      && activity === vial.vial_activity
    ){
      // There's no changes so lets save an update
      setEditing(false);
      return false;
    }

    return [true, {
      ...vial,
      calibration_datetime : calibration_datetime,
      batch_nr : batchNumber,
      volume : volume,
      vial_activity : activity
    }];
  }

  function handleServerResponse(response){
    console.log(response);
  }

  const editButton = (
    <Optional exists={!isSelected && !isFreeing}>
      <ClickableIcon
        src={"/static/images/pen.svg"}
        onClick={() => setEditing(true)}
        />
    </Optional>
  );

  return (
  <tr>
    <td>
      <TracershopInputGroup readonly={!editing} error={batchError}>
        <EditableInput
          canEdit={editing}
          value={etherealBatchNumber}
          onChange={setStateToEvent(setEtherealBatchNumber)}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <TracershopInputGroup readonly={!editing} error={fillTimeError}>
        <TimeInput
          canEdit={editing}
          value={etherealFillTime}
          stateFunction={setEtherealFillTime}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <TracershopInputGroup readonly={!editing} error={volumeError} tail={"mL"}>
        <EditableInput
          canEdit={editing}
          value={etherealVolume}
          onChange={setStateToEvent(setEtherealVolume)}
        />
      </TracershopInputGroup>
    </td>
    <td>
      <TracershopInputGroup readonly={!editing} error={activityError} tail={"MBq"}>
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
          disabled={editing || isFreeing}
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
  isFreeing : boolean
}

function VialTable({
  isFreeing,
  collection,
  showingEtherealVial,
  selectedVialsState} : VialTableProps
){
  const state = useTracershopState();
  const vials = getModalVials(collection, state);
  const vialRows = vials.map((vial) => <VialRow isFreeing={isFreeing} key={vial.id} vial={vial} selectedVialsState={selectedVialsState}/>)

  if(showingEtherealVial){
    const etherealVial = new IsotopeVial(-1, "", null, "", "", "", collection.isotope.id);
    // No point in making this a stateful object, because the row, create ethereal fields.
    vialRows.push(
      <VialRow
        key={-1}
        vial={etherealVial}
        selectedVialsState={selectedVialsState}
        isFreeing={isFreeing}
      />
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
  const [isFreeing, setFreeing] = isAuthenticatingState;
  const [showingEtherealVial, setShowingEtherealVial] = useState(false);
  const [authenticateError, setAuthenticateError] = useErrorState();

  const showShowEtherealVialButton =[ORDER_STATUS.ACCEPTED, ORDER_STATUS.ORDERED].includes(collection.minimum_status);

  const isotopeOrders = collection.orders.map(
    (io) => <IsotopeOrderRow key={io.id} order={io} isFreeing={isFreeing}/>
  );

  function authenticate(username, password){
    if(username==="" || password === ""){
      setAuthenticateError(new RecoverableError("Der er oplysninger som ikke er tastet ind.", ERROR_LEVELS.warning))
    }
  }

  const width = isFreeing ? "75%" : "100%";

  return (
    <Container>
      <div style={DISPLAY.FLEX}>
        <Col style={{ width : width}}>
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
            isFreeing={isFreeing}
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
        </Col>
        <Optional exists={isFreeing}>
          <div style={{width : "25%", flex : "0 0 auto"}}>
            <Authenticate
              authenticate={authenticate}
              setError={setAuthenticateError}
              error={authenticateError}
              buttonMessage="Frigiv"
              headerMessage="Frigiv"
              />
          </div>
        </Optional>
      </div>
    </Container>
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

  const canFree = selectedVials.size != 0;

  return (
  <Row style={{width : "100%"}}>
    <Col>
      <CancelButton/>
    </Col>
    <Col>
      <Row style={JUSTIFY.right}>
        <Optional exists={collection.minimum_status === ORDER_STATUS.ACCEPTED}>
          <Col style={{flex : "0 1"}}>
            <ReleaseButton authenticationState={isAuthenticatingState} canFree={canFree} data-testid="release-button"/>
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
      <IsotopeModalFooter
        isAuthenticatingState={isAuthenticatingState}
        collection={collection}
        selectedVials={selectedVials}
        onClose={onClose}
      />
    </Modal.Footer>
  </Modal>);
}
