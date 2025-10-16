import React, { useEffect, useState } from "react";
import { Col, Container, Form, FormControl, Modal, Row, Table } from "react-bootstrap";

import { Vial } from "~/dataclasses/dataclasses";
import { ERROR_LEVELS, AlertBox } from "../injectable/alert_box";

import { Authenticate } from "../injectable/authenticate";
import { HoverBox } from "../injectable/hover_box";
import { CloseButton, MarginButton } from "../injectable/buttons";
import { ClickableIcon, StatusIcon } from "~/components/injectable/icons";
import { Comment } from "../injectable/data_displays/comment";
import { NEW_LOCAL_ID, ORDER_STATUS, StateType } from "~/lib/constants";
import { cssCenter, cssTableCenter, marginLess } from "~/lib/styles";

import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USER, AUTH_USERNAME, DATA_ACTIVITY_ORDER,
  DATA_AUTH, DATA_DELIVER_TIME, DATA_VIAL, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPE,
  WEBSOCKET_MESSAGE_CORRECT_ORDER,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY
} from "~/lib/shared_constants"
import { dateToDateString, formatUsername, parseDateToDanishDate } from "~/lib/formatting";
import { parseBatchNumberInput, parseDanishPositiveNumberInput, parseTimeInput } from "../../lib/user_input";
import { compareDates, getId, openActivityReleasePDF } from "~/lib/utils";
import { TimeInput } from "../injectable/inputs/time_input";
import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { OrderMapping } from "~/lib/data_structures/order_mapping";
import { CommitIcon } from "../injectable/commit_icon";
import { Optional, Options } from "../injectable/optional";
import { setTempObjectToEvent, TOGGLE_ACTIONS, toggleSetState } from "~/lib/state_management";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { CancelBox } from "~/components/injectable/cancel_box";
import { vialFilter } from "~/lib/filters";
import { FONT } from "~/lib/styles";
import { DateTime } from "~/components/injectable/datetime";
import { toLotDateString } from "~/lib/chronomancy";
import { RecoverableError, useErrorState } from "~/lib/error_handling";
import { useUserReleaseRights } from "~/contexts/user_release_right";

const vialErrorDefault = {
  lot_number : "",
  fill_time : "",
  volume : "",
  activity : "",
}

const orderErrorDefault = {
  ordered_activity : ""
}

const vialRowStates = {
  DEFAULT : 0,
  DEFAULT_CANNOT_EDIT : 1,
  EDITING : 2,
  SELECTED : 3,
  UNSELECTABLE : 4
};

const orderRowStates = {
  DEFAULT : 0,
  DEFAULT_CANNOT_EDIT : 1,
  EDITING : 2,
}

export const WRONG_DATE_WARNING_MESSAGE = "Ordren som er i gang med at blive frigivet er ikke til i dag!";

function OrderRow({order, setDirtyOrders}){
  const creating = order.id === NEW_LOCAL_ID;

  // State
  const [etherealOrder, setEtherealOrder] = useState(order);
  const [editing, setEditing] = useState(creating);
  const [error, setError] = useState(orderErrorDefault);

  // Derived State
  const canEdit = order.status == ORDER_STATUS.ACCEPTED
          || order.status == ORDER_STATUS.ORDERED;
  const orderRowState = (() => {
      if(editing){return orderRowStates.EDITING;}
      if(!canEdit){return orderRowStates.DEFAULT_CANNOT_EDIT;}
      return orderRowStates.DEFAULT;
  })();

  function validate(){
    const [valid, activityNumber] = parseDanishPositiveNumberInput(etherealOrder.ordered_activity, "Aktiviteten");
    const newError = {ordered_activity : !valid ?  activityNumber : ""};
    setError(newError);
    if(!valid){ return [false, {}]; }

    return [true, {...order,
      ordered_activity : activityNumber,
    }]
  }

  function commitCallback(){
    setEditing(false);
    toggleSetState(setDirtyOrders, order.id, TOGGLE_ACTIONS.REMOVE)()
  }

  return (
    <Row key={order.id}>
      <Col xs={3} style={{display : "block", margin: 'auto', alignItems: 'center'}}>ID:{order.id}</Col>
      <Col>
        <Options index={orderRowState}>
          <div> {/** DEFAULT  */}
            <HoverBox
              Base={<div style={marginRows}>{`${order.ordered_activity} MBq`}</div>}
              Hover={<div>Tryg på status Ikonet for at ændre dosis</div>}
            />
          </div>
          <div style={cssCenter}> {/** DEFAULT_CANNOT_EDIT */}
            {`${order.ordered_activity} MBq`}
          </div>
          <div> {/** EDITING  */}
            <TracershopInputGroup
              error={error.ordered_activity}
              tail={"MBq"}
            >
              <FormControl
                aria-label={`edit-form-order-activity-${order.id}`}
                value={etherealOrder.ordered_activity}
                onChange={setTempObjectToEvent(setEtherealOrder, 'ordered_activity')}
              />
            </TracershopInputGroup>
          </div>

        </Options>
      </Col>
      <Col xs={2} style={cssCenter}>
        <Comment comment={order.comment}/>
      </Col>
      <Col xs={2} style={{
        justifyContent : "right", display : "flex"
      }}><Optional exists={editing} alternative={
        <StatusIcon
              label={`edit-order-activity-${order.id}`}
              order={order}
              onClick={() => {
                if(canEdit){
                  setEditing(true);
                  toggleSetState(setDirtyOrders, order.id, TOGGLE_ACTIONS.ADD)()
                }
              }}
        />
      }>
        <CommitIcon
          label={`edit-accept-order-activity-${order.id}`}
          object_type={DATA_ACTIVITY_ORDER}
          temp_object={order}
          validate={validate}
          callback={commitCallback}
        />
      </Optional>
        </Col>
    </Row>
  );
}


function VialRow({
  vial, selected, orderCollection, freeing, setSelectedVials, setDirtyVials, stopAllocatingNewVial
}){
  const creating = vial.id === NEW_LOCAL_ID;
  // State
  const [editing, setEditing] = useState(creating);
  const [etherealVial, setEtherealVial] = useState({...vial});
  const [error, setError] = useState({...vialErrorDefault});

  //Derived State
  const assignable = !Boolean(vial.assigned_to);
  const canEdit = (orderCollection.minimum_status === ORDER_STATUS.ACCEPTED
    || orderCollection.minimum_status === ORDER_STATUS.ORDERED)
    && !freeing;

  //Effects
  useEffect(() => { if(vial.id != -1){ setEtherealVial({...vial}); } },[vial]);

  const vialRowState = (() => {
    if(editing) {return vialRowStates.EDITING;}
    if(selected){return vialRowStates.SELECTED;}
    if(orderCollection.minimum_status === ORDER_STATUS.ORDERED){
      return vialRowStates.UNSELECTABLE;
    }
    if(canEdit) {return vialRowStates.DEFAULT;}
    return vialRowStates.DEFAULT_CANNOT_EDIT;
  })();

  // Vial Row functions
  function startEditing() {
    setEditing(true);
    toggleSetState(setDirtyVials, vial.id, TOGGLE_ACTIONS.ADD)()
  }

  function cancelEditing() {
    setEditing(false);
    toggleSetState(setDirtyVials, vial.id, TOGGLE_ACTIONS.REMOVE)()
    setEtherealVial({...vial});
  }

  function validate() {
    const [batchValid, formattedLotNumber] = parseBatchNumberInput(etherealVial.lot_number, "lot nr.");
    const [timeValid, formattedFillTime] = parseTimeInput(etherealVial.fill_time, "Produktions tidspunk");
    const [volumeValid, formattedVolume] = parseDanishPositiveNumberInput(etherealVial.volume, "Volume");
    const [activityValid, formattedActivity] = parseDanishPositiveNumberInput(etherealVial.activity, "Aktiviten");

    const newVialError = {
      lot_number : !batchValid ? formattedLotNumber : "",
      fill_time  : !timeValid ? formattedFillTime : "",
      volume     : !volumeValid ? formattedVolume : "",
      activity   : !activityValid ? formattedActivity : "",
    }

    setError(newVialError);

    const success = batchValid && timeValid && volumeValid && activityValid;
    return [success,
      { ...vial,
        lot_number : formattedLotNumber,
        fill_time : formattedFillTime,
        volume : formattedVolume,
        activity : formattedActivity
      }];
  }

  function commitCallback(){
    setEditing(false);
    if(creating){
      stopAllocatingNewVial(true)
    }
  }

  return (
    <tr key={vial.id}>
      <td style={cssTableCenter}>
        <Optional exists={!creating} alternative={<div>Ny</div>}>
          <div data-testid={`vial-id-${vial.id}`}>{vial.id}</div>
        </Optional>
      </td>
      <td>
        <Optional exists={editing} alternative={<div>{vial.lot_number}</div>}>
          <TracershopInputGroup error={error.lot_number}>
            <FormControl
              value={etherealVial.lot_number}
              aria-label={`lot_number-${vial.id}`}
              onChange={setTempObjectToEvent(setEtherealVial, 'lot_number')}
            />
          </TracershopInputGroup>
        </Optional>
      </td>
      <td>
        <Optional exists={editing} alternative={<div>{vial.fill_time}</div>}>
          <TracershopInputGroup error={error.fill_time}>
              <TimeInput
                value={etherealVial.fill_time}
                aria-label={`fill_time-${vial.id}`}
                stateFunction={function setFillTime(newFillTime){
                  setEtherealVial(old => {return {
                    ...old, fill_time : newFillTime
                  }})
                }}
              />
          </TracershopInputGroup>
        </Optional>
      </td>
      <td>
        <Optional exists={editing} alternative={<div>{vial.volume} ml</div>}>
          <TracershopInputGroup error={error.volume} tail={"ml"}>
              <FormControl
                aria-label={`volume-${vial.id}`}
                value={etherealVial.volume}
                onChange={setTempObjectToEvent(setEtherealVial, 'volume')}
              />
          </TracershopInputGroup>
        </Optional>
      </td>
      <td>
        <Optional exists={editing} alternative={<div>{vial.activity} MBq</div>}>
        <TracershopInputGroup error={error.activity} tail={"MBq"}>
              <FormControl
                value={etherealVial.activity}
                aria-label={`activity-${vial.id}`}
                onChange={setTempObjectToEvent(setEtherealVial, 'activity')}
              />
          </TracershopInputGroup>
        </Optional>
      </td>
      <td style={cssTableCenter}>
      <Optional exists={!Boolean(vial.assigned_to)}>
        <Options index={vialRowState}>
          <div> {/* DEFAULT */}
            <ClickableIcon
              src="/static/images/pen.svg"
              label={`edit-vial-${vial.id}`}
              onClick={startEditing}
            />
          </div>
          <div> {/* DEFAULT_CANNOT_EDIT */}
          </div>
          <div> {/* EDITING */}
            <CommitIcon
              temp_object={vial}
              object_type={DATA_VIAL}
              validate={validate}
              callback={commitCallback}
              label={`vial-commit-${vial.id}`}
            />
          </div>
          <div> {/* SELECTED */}
          </div>
        </Options>
      </Optional>
      </td>
      <td style={cssTableCenter}>
        <Optional exists={assignable}>
          <Options index={vialRowState}>
            <div> {/* DEFAULT */}
              <Form.Check
                aria-label={`vial-usage-${vial.id}`}
                onChange={toggleSetState(setSelectedVials, vial.id)}
                checked={selected}
              />
            </div>
            <div> {/* DEFAULT_CANNOT_EDIT */}
            <Form.Check
              aria-label={`vial-usage-${vial.id}`}
              readOnly
              checked={selected}/>
            </div>
            <div> {/* EDITING */}
            <ClickableIcon
              label={`vial-edit-decline-${vial.id}`}
              src="/static/images/decline.svg"
              onClick={cancelEditing}
            />
            </div>
            <div> {/* SELECTED */}
            <Form.Check
              aria-label={`vial-usage-${vial.id}`}
              onChange={toggleSetState(setSelectedVials, vial.id)}
              checked={selected}/>
            </div>
            <div> {/* UNSELECTABLE */}
            </div>
          </Options>
        </Optional>
      </td>
    </tr>
  );
}

const marginRows = {
  marginTop : "7px",
  marginBottom : "7px",
}

/**
 *
 * @param {{
 *  order_mapping : OrderMapping,
 * }} param0
 * @returns
 */
export function ActivityModal({
  active_tracer, order_mapping, on_close, timeSlotID
}){

  // State extraction
  const state = useTracershopState();
  const websocket = useWebsocket();
  const active_date = state.today;
  const dateString = dateToDateString(active_date);
  const timeSlot = state.deliver_times.get(timeSlotID);
  const orderCollection = order_mapping.getOrders(timeSlot.id);

  const endpoint = state.delivery_endpoint.get(timeSlot.destination);
  const customer = state.customer.get(endpoint.owner);
  const tracer = state.tracer.get(active_tracer);
  const releaseRightHolder = useUserReleaseRights()
  const RightsToFree = releaseRightHolder.permissionForTracer(tracer);

  // Order State
  const /** @type {StateType<Set<Number>>} */ [selectedVials, setSelectedVials] = useState(new Set());
  const [dirtyOrders, setDirtyOrders] = useState(new Set());
  const [dirtyVials, setDirtyVials] = useState(new Set());
  const [addingVial, setAddingVial] = useState(false);
  const [freeing, setFreeing] = useState(false);
  const [loginError, setLoginError] = useErrorState();
  const [dateError, setDateError]  = useErrorState();
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [correctingOrder, setCorrectingOrder] = useState(false);

  // Derived State
  const canCancel = orderCollection.minimum_status === ORDER_STATUS.ACCEPTED
  || orderCollection.minimum_status === ORDER_STATUS.ORDERED;

  const modal_vials = orderCollection.minimum_status === ORDER_STATUS.RELEASED ?
    vialFilter(state, { orderIDs : orderCollection.orderIDs }) :
    vialFilter(state, { active_tracer : active_tracer,
      active_customer : orderCollection.owner.id,
      active_date : active_date
    });

  //#region ActivityModal functions
  function allocateNewVial(){
    setAddingVial(true);
  }

  function stopAllocatingNewVial(){
    setAddingVial(false);
  }

  function startFreeing(){
    if(compareDates(active_date, new Date())){
      setFreeing(true);
    } else {
      setFreeing(true);
      setDateError(
        WRONG_DATE_WARNING_MESSAGE,
        ERROR_LEVELS.hint
      )
    }
  }

  function stopFreeing(){
    setFreeing(false)
    setDateError();
  }

  function startCorrectingOrder(){
    setCorrectingOrder(true);
  }

  function stopCorrectingOrder(){
    setCorrectingOrder(true);
  }

  function onClickAccept(){
    const orders = [...order_mapping.getOrders(timeSlotID)];
    for(const order of orders){
      if (order.status === ORDER_STATUS.ORDERED){
        order.status = ORDER_STATUS.ACCEPTED;
      }
    }
    return websocket.sendEditModel(DATA_ACTIVITY_ORDER, orders);
  }

  function onClickToPDF() {
    openActivityReleasePDF(timeSlotID, active_date)();
  }

  function onFree(username, password){
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_FREE_ACTIVITY);
    const data = {
      [DATA_DELIVER_TIME] : timeSlotID,
      [DATA_ACTIVITY_ORDER] : orderCollection.orderIDs,
      [DATA_VIAL] : [...selectedVials]
    };
    message[WEBSOCKET_DATA] = data;
    const auth = {
      [AUTH_USERNAME] : username,
      [AUTH_PASSWORD] : password,
    };
    message[DATA_AUTH] = auth;
    return websocket.send(message).then((data) =>{
      if (data[AUTH_IS_AUTHENTICATED]){
        stopFreeing();
        setLoginError(new RecoverableError());
      } else {
        setLoginError(new RecoverableError("Forkert login"));
      }
    });
  }

  function onCorrect(username, password){
    const message = {
      [DATA_AUTH] : {
        [AUTH_USERNAME] : username,
        [AUTH_PASSWORD] : password
      },
      [WEBSOCKET_DATA] : {
        [DATA_VIAL] : orderCollection.vials.map(getId),
        [DATA_ACTIVITY_ORDER] : orderCollection.orderIDs,
      },
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CORRECT_ORDER,
    };

    return websocket.send(message).then(
      (message) => {
        if (message[AUTH_IS_AUTHENTICATED]){
          stopCorrectingOrder();
          setLoginError();
        } else {
          setLoginError(new RecoverableError("Forkert login"));
        }
      }
    )
  }

  function startCancelOrders(){
    setShowCancelBox(true);
  }
  function stopCancelOrders(){
    setShowCancelBox(false);
  }

  function confirmCancel(){
    const ordersToBeSend = []
    const cancellationTime = new Date();

    for(const order of orderCollection.orders){
      ordersToBeSend.push({...order,
        status : ORDER_STATUS.CANCELLED,
        freed_by : state.logged_in_user.id,
        freed_datetime : cancellationTime,
      });
    }
    if(ordersToBeSend.length){
      websocket.sendEditModel(DATA_ACTIVITY_ORDER, ordersToBeSend);
    }
    setShowCancelBox(false);
  }

  //#region ActivityModal Subcomponents
  const orderRows = orderCollection.orders.map((order) => <OrderRow
    key={order.id}
    order={order}
    setDirtyOrders={setDirtyOrders}
  />);

  const vialRows = [...modal_vials.values()].map( // Vial rows
    (vial) => <VialRow
      key={vial.id}
      freeing={freeing}
      orderCollection={orderCollection}
      selected={selectedVials.has(vial.id)}
      setSelectedVials={setSelectedVials}
      setDirtyVials={setDirtyVials}
      stopAllocatingNewVial={stopAllocatingNewVial}
      vial={vial}
    />
  );

  if(addingVial){
    const defaultLotNumber = orderCollection.tracer.vial_tag
      ? `${tracer.vial_tag}-${toLotDateString(orderCollection.ordered_date)}-1` : "";
    vialRows.push(
      <VialRow
      key={-1}
      freeing={freeing}
      orderCollection={orderCollection}
      selected={false}
      setSelectedVials={setSelectedVials}
      setDirtyVials={setDirtyVials}
      stopAllocatingNewVial={stopAllocatingNewVial}
      vial={new Vial(-1, active_tracer, "", "", defaultLotNumber, "", dateString, null, orderCollection.owner.id)}
    />);
  }

  // Sub elements
  // Buttons
  const canAccept = dirtyOrders.size === 0 && dirtyVials.size === 0;
  const AcceptButton = canAccept ?
      <MarginButton onClick={onClickAccept}>Accepter</MarginButton>
    : <HoverBox
        Base={<MarginButton disabled>Accepter</MarginButton>}
        Hover={<div>Du kan ikke accepter ordre imens du redigerer dem.</div>}
      />;

  const canFree = selectedVials.size > 0 && !(addingVial) && RightsToFree;
  const ConfirmButton = canFree ?
                          <MarginButton onClick={startFreeing}>Godkend</MarginButton>
                        : <MarginButton disabled>Godkend</MarginButton>;
  const CancelFreeButton = <MarginButton onClick={stopFreeing}>Rediger</MarginButton>
  const PDFButton = <MarginButton onClick={onClickToPDF}>Frigivelsecertifikat</MarginButton>;

  /**
   * This is the element that might be displayed if
   */
  const sideElement = (() => {
    if(freeing){
      return (
        <Col md={6}>
          <Authenticate
            authenticate={onFree}
            error={loginError}
            setError={setLoginError}
            fit_in={false}
            headerMessage={`Frigiv ordre - ${orderCollection.orderIDs.join(', ')}`}
            buttonMessage={"Frigiv ordre"}
          />
        </Col>
      );
    }

    if(correctingOrder){
      return (
        <Col md={6}>
          <Authenticate
            authenticate={onCorrect}
            error={loginError}
            setError={setLoginError}
            fit_in={false}
            headerMessage={`Ret ordre - ${orderCollection.orderIDs.join(', ')}`}
            buttonMessage={"Ret ordre"}
          />
        </Col>
      );
    }
    return <div></div>;

  })()


  const destinationHover = <HoverBox
    Base={<div>Destination:</div>}
    Hover={<div>Kundens brugernavn, rigtige navn og <br/>
      bestillerens profil, hvis tilgændelig.</div>}
  />;
  const destinationMessage = `${customer.long_name} - ${endpoint.name}`

  const totalActivityHover = <HoverBox
    Base={<div>Total Aktivitet</div>}
    Hover={<div>Mængde af aktivitet der skal produceres til ordren.</div>}
  />;

  let allocationTotal = 0;
  for(const vid of selectedVials.values()){
    const vial = state.vial.get(vid);
    allocationTotal += vial.activity;
  }

  return (
    <div>
    <Modal
    data-testid="activity_modal"
      show={true}
      size="lg"
      onHide={on_close}
      style={FONT.light}
      >
    <Modal.Header>
      <h3>
        Ordre - {parseDateToDanishDate(dateString)} - {timeSlot.delivery_time}
      </h3>
    </Modal.Header>
    <Modal.Body>
        <Row>
          <Col md={(freeing || correctingOrder) ? 6 : 12}>
          <Row>
            <Row style={marginRows}>
              <Col xs={3}>{destinationHover}</Col>
              <Col>{destinationMessage}</Col>
            </Row>
            <hr style={marginLess}/>
            <Row style={marginRows}>
              <Col xs={3}>Levering tidspunkt:</Col>
              <Col>{timeSlot.delivery_time}</Col>
            </Row>
            <hr style={marginLess}/>
            <Row style={marginRows}>
              <Col xs={3} style={{}}>{orderRows.length == 1 ? "Order" : "Ordre" }</Col>
              <Col>{orderRows}</Col>
            </Row>
            <hr style={marginLess}/>
            <Row style={marginRows}>
              <Col xs={3}>{totalActivityHover}</Col>
              <Col>{Math.floor(orderCollection.deliver_activity)} MBq</Col>
            </Row>
            <hr style={marginLess}/>
            <Optional exists={orderCollection.minimum_status == ORDER_STATUS.ACCEPTED}>
              <Row style={marginRows}>
                <Col xs={3}>Allokeret aktivitet:</Col>
                <Col data-testid="allocation-col">{Math.floor(allocationTotal)} MBq</Col>
              </Row>
              <hr style={marginLess}/>
            </Optional>
            <Optional exists={orderCollection.minimum_status == ORDER_STATUS.RELEASED}>
              <Row style={marginRows}>
                <Col xs={3}>Frigivet aktivitet</Col>
                <Col>{Math.floor(orderCollection.delivered_activity)} MBq</Col>
              </Row>
              <hr style={marginLess}/>
              <Row style={marginRows}>
                <Col xs={3}>Frigivet tidpunktet</Col>
                <Col><DateTime dateLike={orderCollection.freed_time}/></Col>
              </Row>
              <hr style={marginLess}/>
              <Row style={marginRows}>
                <Col xs={3}>Frigivet af</Col>
                <Col>{formatUsername(orderCollection.freed_by)}</Col>
              </Row>
              <hr style={marginLess}/>
            </Optional>
          </Row>
        </Col>
          {sideElement}
        </Row>
        <AlertBox error={dateError}/>
        <Row>
          <div>
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Batch</th>
                  <th>Kalibrerings Tidspunkt</th>
                  <th>Volumen</th>
                  <th>Aktivitet</th>
                  <th></th>
                  <Optional exists={orderCollection.minimum_status!==ORDER_STATUS.RELEASED}>
                    <th>Brug</th>
                  </Optional>

                </tr>
              </thead>
              <tbody>
                {vialRows}
              </tbody>
            </Table>
            <div className="flex-row-reverse d-flex">
              <Optional exists={!(addingVial || freeing)}>
                <div>
                  <ClickableIcon
                    label="add-new-vial"
                    src="/static/images/plus2.svg"
                    onClick={allocateNewVial}/>
                </div>
              </Optional>
            </div>
          </div>
        </Row>
      </Modal.Body>
    <Modal.Footer>
      <Container>
      <Row className="justify-content-around">
        <Col>
          <Optional exists={canCancel}>
            <Col md="auto">
              <MarginButton onClick={startCancelOrders}>Afvis</MarginButton>
            </Col>
          </Optional>
          <Optional exists={orderCollection.minimum_status === ORDER_STATUS.RELEASED && !correctingOrder}>
            <Col md="auto">
              <MarginButton onClick={startCorrectingOrder}>Ret ordre</MarginButton>
            </Col>
          </Optional>
        </Col>
        <Col>
          <Row className="justify-content-end">
            <Optional exists={orderCollection.minimum_status === ORDER_STATUS.ORDERED}>
              <Col md="auto">{AcceptButton}</Col>
            </Optional>
            <Optional exists={orderCollection.minimum_status === ORDER_STATUS.ACCEPTED && !freeing}>
              <Col md="auto">{ConfirmButton}</Col>
            </Optional>
            <Optional exists={orderCollection.minimum_status === ORDER_STATUS.ACCEPTED && freeing}>
              <Col md="auto">{CancelFreeButton}</Col>
            </Optional>
            <Optional exists={orderCollection.minimum_status === ORDER_STATUS.RELEASED}>
              <Col md="auto">{PDFButton}</Col>
            </Optional>
            <Col md="auto">
              <CloseButton onClick={on_close}/>
            </Col>
          </Row>
        </Col>
      </Row>
      </Container>
    </Modal.Footer>
    </Modal>
    <Optional exists={showCancelBox}>
      <CancelBox
        confirm={confirmCancel}
        show={showCancelBox}
        onClose={stopCancelOrders}
      />
    </Optional>
    </div>
  );
}
