import React, { useEffect, useState } from "react";
import { Col, Form, FormControl, Modal, Row, Table } from "react-bootstrap";

import { Customer, DeliveryEndpoint, ActivityDeliveryTimeSlot, ActivityOrder, Vial, ActivityProduction, Tracer, Isotope } from "~/dataclasses/dataclasses.js";
import { ERROR_LEVELS, AlertBox } from "../injectable/alert_box.js";
import styles from '~/css/Site.module.css'
import { renderComment } from "~/lib/rendering.js";

import Authenticate from "../injectable/authenticate.js";
import { HoverBox } from "../injectable/hover_box";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { ClickableIcon, StatusIcon } from "../injectable/icons.js";

import { ERROR_BACKGROUND_COLOR,
  PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_ON_CLOSE, PROP_ORDER_MAPPING, PROP_TIME_SLOT_ID} from "~/lib/constants.js";

import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_ACTIVITY_ORDER,
  DATA_AUTH, DATA_CUSTOMER, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_ISOTOPE,
  DATA_PRODUCTION, DATA_TRACER, DATA_USER, DATA_VIAL, WEBSOCKET_DATA,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY } from "~/lib/shared_constants.js"
import { dateToDateString, parseDateToDanishDate } from "~/lib/formatting.js";
import { getTimeString } from "~/lib/chronomancy.js";

import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { concatErrors, parseBatchNumberInput, parseDanishPositiveNumberInput, parseTimeInput } from "../../lib/user_input.js";
import { compareDates, getPDFUrls } from "../../lib/utils.js";
import { TimeInput } from "../injectable/time_form.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { OrderMapping, TracerCatalog } from "~/lib/data_structures.js";


/**
 * 
 * @param {{
 *  tracer_catalog : TracerCatalog
 *  order_mapping : OrderMapping,
 * }} param0 
 * @returns 
 */
export function ActivityModal({
  active_date, active_tracer, order_mapping, on_close, timeSlotID, tracer_catalog
}){
  // State extraction
  const state = useTracershopState();
  const websocket = useWebsocket()
  const timeSlot = state.deliver_times.get(timeSlotID)
  const /**@type {Array<ActivityOrder> | undefined}*/ orders = order_mapping.getOrders(timeSlot.id)
  const /**@type {DeliveryEndpoint} */ endpoint = state.delivery_endpoint.get(timeSlot.destination)
  const /**@type {Customer} */ customer = state.customer.get(endpoint.owner)
  const /**@type {Number} */ overhead = tracer_catalog.getOverheadForTracer(customer.id, active_tracer)
  const /**@type {Tracer} */ tracer = state.tracer.get(active_tracer)

  const [errorMessage, setErrorMessage] = useState("");
  const [errorLevel, setErrorLevel] = useState("");
  const [freeing, setFreeing] = useState(false);
  const [addingVial, setAddingVial] = useState(false);
  const [selectedVials, setSelectedVials] = useState(new Set());
  const [loginMessage, setLoginMessage] = useState("");
  const [loginSpinner, setLoginSpinner] = useState(false);

   /**
  * A time slot may multiple orders and each of these objects refers to an order
  * connected by a common time slot.
  * @param {{
  *  order : ActivityOrder,
  *  websocket : TracerWebSocket,
  *  timeSlots : Map<Number, ActivityDeliveryTimeSlot>
  *  timeSlotId : Number
  * }} props
  * @returns {Element}
  */
  function OrderRow({order}){
    const [activity, setActivity] = useState(order.ordered_activity);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState(false);

    const canEdit = order.status == 1 || order.status == 2;
    const displayStyle = error ? {backgroundColor : ERROR_BACKGROUND_COLOR} : {}

    function acceptEdit (){
      const [valid, activityNumber] = parseDanishPositiveNumberInput(activity);
      if(!valid){
        setError(true);
        return;
      }
      order.ordered_activity = activityNumber;

      websocket.sendEditModel(DATA_ACTIVITY_ORDER, [order]);
      setEditing(false);
      setError(false);
    }

    let activityDisplay = canEdit ?
                            <HoverBox
                              Base={<p>{`${activity} MBq`}</p>}
                              Hover={<p>Tryg på status Ikonet for at ændre dosis</p>}
                              />
                            : `${activity} MBq`;

      if(editing){
        activityDisplay = <FormControl
                            aria-label={`edit-form-order-activity-${order.id}`}
                            style={displayStyle}
                            value={activity}
                            onChange={(event) => {
                              setActivity(event.target.value)
                            }}
                          />
    }

    let iconFunction= canEdit ? () => {setEditing(true)} : () => {}
    let icon = <StatusIcon
                label={`edit-order-activity-${order.id}`}
                status={order.status}
                onClick={iconFunction}
              />

    if (order.moved_to_time_slot){
      icon = <ClickableIcon
                label={`edit-order-activity-${order.id}`}
                src="/static/images/move_top.svg"
                onClick={iconFunction}
              />
    }
    if(editing){
      icon = <ClickableIcon
                label={`edit-accept-order-activity-${order.id}`}
                src="static/images/accept.svg"
                onClick={acceptEdit}/>
    }

    return (
      <Row>
        <Col>Order ID:{order.id}</Col>
        <Col>{activityDisplay}</Col>
        <Col xs={2}>{renderComment(order.comment)}</Col>
        <Col xs={2} style={{
          justifyContent : "right", display : "flex"
        }}>{icon}</Col>
      </Row>
    )
  }

  /**
   * A row in the vial table
   * @param {{
   * vial : Vial,
   * onSelect : CallableFunction,
   * selected : Boolean,
   * websocket : TracerWebSocket,
   * }} props for component
   * @returns
   */
  function VialRow({vial, onSelect, selected, setError}){
    const [editing, setEditing] = useState(false);
    const [editingVial, _setDisplayVial] = useState({...vial});

    function setDisplayVial(newVial){
      _setDisplayVial({
        ...editingVial,
        ...newVial,
      })
    }

    function setFillTime(newFillTime){
      setDisplayVial({
        fill_time : newFillTime
      })
    }

    function updateVial() {
      const [batchValid, formattedLotNumber] = parseBatchNumberInput(editingVial.lot_number, "Batch nr.");
      const [timeValid, formattedFillTime] = parseTimeInput(editingVial.fill_time, "Produktions tidspunk");
      const [volumeValid, formattedVolume] = parseDanishPositiveNumberInput(editingVial.volume, "Volume");
      const [activityValid, formattedActivity] = parseDanishPositiveNumberInput(editingVial.activity, "Aktiviten");

      const errors = []
      // You need this other wise you have short circuiting
      const valid_batch = concatErrors(errors, batchValid, formattedLotNumber)
      const valid_time  = concatErrors(errors, timeValid, formattedFillTime)
      const valid_volume = concatErrors(errors, volumeValid, formattedVolume)
      const valid_activity = concatErrors(errors, activityValid, formattedActivity);

      if(valid_batch && valid_time && valid_volume && valid_activity){
        websocket.sendEditModel(DATA_VIAL, [{
          ...vial,
          lot_number : formattedLotNumber,
          fill_time : formattedFillTime,
          volume : formattedVolume,
          activity : formattedActivity
        }])
        setEditing(false)
      } else {
        setError(ERROR_LEVELS.error, errors.map((err, i) => <p key={i}>{err}</p>))
      }
    }

    // Refresh the vial
    useEffect(() => {
      setDisplayVial(vial)
      return () => {}
    }, [vial])

    const lotNumberContent = editing ?
                              <FormControl value={editingVial.lot_number}
                                aria-label={`lot_number-${vial.id}`}
                                onChange={(event) => {setDisplayVial({lot_number : event.target.value})}}
                              />
                            : vial.lot_number;

    const productionTimeContent = editing ?
                                    <TimeInput
                                      value={editingVial.fill_time}
                                      aria-label={`fill_time-${vial.id}`}
                                      stateFunction={setFillTime}
                                    />
                                  : vial.fill_time;
    const volumeContent = editing ? <FormControl
      aria-label={`volume-${vial.id}`}
      value={editingVial.volume}
      onChange={(event) => {setDisplayVial({volume : event.target.value})}}/> : vial.volume;
    const activityContent = editing ? <FormControl value={editingVial.activity}
      aria-label={`activity-${vial.id}`}
      onChange={(event) => {setDisplayVial({activity : event.target.value})}}/> : vial.activity;

    const canEditIcon = selected ? <div></div> : <ClickableIcon
      src="/static/images/pen.svg"
      label={`edit-vial-${vial.id}`}
      onClick={() => {
      setEditing(true);
    }}/>

    const editingContent = editing ? <ClickableIcon src="/static/images/accept.svg"
      label={`vial-edit-accept-${vial.id}`}
      onClick={updateVial}
    /> : canEditIcon;

    let commitContent = editing ? <ClickableIcon
                                    label={`vial-edit-decline-${vial.id}`}
                                    src="/static/images/decline.svg"
                                    onClick={() => {setEditing(false)}}
                                  /> : <Form.Check
            aria-label={`vial-usage-${vial.id}`}
            onChange={onSelect}
            checked={selected}/>;
  
    if (vial.assigned_to){
      commitContent = ""
    }

    return (
      <tr>
        <td>{vial.id}</td>
        <td>{lotNumberContent}</td>
        <td>{productionTimeContent}</td>
        <td>{volumeContent}</td>
        <td>{activityContent}</td>
        <td>{editingContent}</td>
        <td>{commitContent}</td>
      </tr>
    );
  }

  function NewVialRow({stopAddingVial, setError}){
    const [lot_number, setLotNumber] = useState("");
    const [fill_time, setFillTime] = useState("");
    const [volume, setVolume] = useState("");
    const [activity, setActivity] = useState("");

    function addNewVial(){
      const errors = []
      const [batchValid, formattedLotNumber] = parseBatchNumberInput(lot_number, 'Batch nr.');
      const [timeValid, formattedFillTime] = parseTimeInput(fill_time, "Produktions tidspunk");
      const [volumeValid, formattedVolume] = parseDanishPositiveNumberInput(volume, "Volume");
      const [activityValid, formattedActivity] = parseDanishPositiveNumberInput(activity, "Activitet");

      const valid = concatErrors(errors, batchValid, formattedLotNumber)
                  && concatErrors(errors, timeValid, formattedFillTime)
                  && concatErrors(errors, volumeValid, formattedVolume)
                  && concatErrors(errors, activityValid, formattedActivity);

      if(valid){
        websocket.sendCreateModel(DATA_VIAL, [{
          owner : customer.id,
          fill_date : active_date,
          lot_number : formattedLotNumber,
          fill_time : formattedFillTime,
          volume : formattedVolume,
          activity : formattedActivity
        }])
        stopAddingVial()
      } else {
        setError(ERROR_LEVELS.error, errors.map((err, i) => <p key={i}>{err}</p> ));
      }
    }

    return (
      <tr>
        <td>Ny</td>
        <td>
          <FormControl
            aria-label="lot_number-new"
            value={lot_number}
            onChange={(event) => {
              setLotNumber(event.target.value)
            }}/>
        </td>
        <td>
          <TimeInput
            aria-label="fill_time-new"
            stateFunction={setFillTime}
            value={fill_time}
            />
        </td>
        <td>
          <FormControl
            aria-label="volume-new"
            value={volume}
            onChange={(event) => {
              setVolume(event.target.value)
            }}/>
        </td>
        <td>
          <FormControl
            aria-label="activity-new"
            value={activity}
            onChange={(event) => {
              setActivity(event.target.value)
            }}/>
        </td>
        <td>
          <ClickableIcon
            src="static/images/accept.svg"
            label="accept-new"
            onClick={addNewVial}
          />
        </td>
        <td>
          <ClickableIcon
            label="decline-new"
            src="static/images/decline.svg"
            onClick={stopAddingVial}
          />
        </td>
      </tr>
    );
  }


  // Value extraction
  const dateString = dateToDateString(active_date)
  let minimum_status = 5;
  let activity = 0;
  let freed_activity = 0;
  let freedTime = null;
  let freed_by = null;
  let commentString = "";
  const orderRows = []
  const orderIDs = []

  for(const order of orders){
    minimum_status = Math.min(minimum_status, order.status)

    orderIDs.push(order.id);

    if (order.comment){
      commentString += `Orderer ${order.id} - ${order.comment}\n`;
    }

    activity += Math.floor(order.ordered_activity) * overhead;

    if (freedTime === null && order.freed_datetime){
      const timestamp = getTimeString(order.freed_datetime)
      const dateString = parseDateToDanishDate(dateToDateString(new Date(order.freed_datetime)))

      freedTime = `${timestamp} - ${dateString}`
    }

    if (freed_by === null && order.freed_by){
      const freeingUser = state.user.get(order.freed_by);
      freed_by = freeingUser.username.toUpperCase();
    }

    let rowIcon = <StatusIcon status={order.status}/>
    if (order.moved_to_time_slot){
      rowIcon = <ClickableIcon src="/static/images/move_top.svg"/>
    }
    orderRows.push(
      <OrderRow key={order.id} order={order}/>);
  }

  const vials = [...state.vial.values()].filter(
    (_vial) => {
      const /**@type {Vial} */ vial = _vial
      if(vial.fill_date !== dateString){
        return false;
      }
      if(minimum_status === 3){
        freed_activity += vial.activity;
        return orderIDs.includes(vial.assigned_to)
      } else {
        return vial.owner === customer.id;
      }
    }
  )


  function startFreeing(){
    if(compareDates(active_date, new Date())){
      setFreeing(true);
    } else {
      setFreeing(true);
      setError(ERROR_LEVELS.hint,
              "Ordren som er i gang med at blive frigivet er ikke til i dag!");
    }
  }

  // Functions
  function onClickAccept(){
    const orders = order_mapping.getOrders(timeSlotID);

    if(orders.length == 0){
      return;
    }

    for(const order of orders){
      if (order.status == 1){
        order.status = 2
      }
    }
    websocket.sendEditModel(DATA_ACTIVITY_ORDER, orders)
  }

  function onClickToPDF() {
    window.location = getPDFUrls(endpoint, tracer, active_date)
  }

  function onFree(username, password){
    setLoginSpinner(true);
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_FREE_ACTIVITY);
    const data = {};
    data[DATA_DELIVER_TIME] = timeSlotID
    data[DATA_ACTIVITY_ORDER] = orderIDs
    data[DATA_VIAL] = [...selectedVials];
    message[WEBSOCKET_DATA] = data;
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[DATA_AUTH] = auth;
    websocket.send(message).then((data) =>{
      setLoginSpinner(false);
      if (data[AUTH_IS_AUTHENTICATED]){
        setFreeing(false);
        setError(null, "")

      } else {
        setError(ERROR_LEVELS.error,  "Forkert login");
      }
    });
  }

  function stopAddingVial(){
    setAddingVial(false);
  }

  function setError(level, error){
    setErrorLevel(level)
    setErrorMessage(<div>{error}</div>);
  }

  /**
   * @param {Vial} vial */
  function selectVial(vial){
    if(freeing || minimum_status === 3){
      return;
    }

    return () => {
      if(selectedVials.has(vial.id)){
        const newSelectedVials = new Set(selectedVials);
        newSelectedVials.delete(vial.id)
        setSelectedVials(newSelectedVials);
      } else {
        const newSelectedVials = new Set(selectedVials);
        newSelectedVials.add(vial.id)
        setSelectedVials(newSelectedVials);
      }
    }
  }

  // Sub elements
  // Buttons
  const AcceptButton =  <MarginButton onClick={onClickAccept}>Accepter Ordre</MarginButton>;

  const canFree = selectedVials.size > 0 && !(addingVial);
  const ConfirmButton = canFree ?
                          <MarginButton onClick={startFreeing}> Godkend Ordre </MarginButton>
                        : <MarginButton disabled>Godkend Ordre</MarginButton>;
  const CancelFreeButton = <MarginButton onClick={() => {setFreeing(false)}}>Rediger Ordre</MarginButton>
  const PDFButton = <MarginButton onClick={onClickToPDF}>Se føgleseddel</MarginButton>;

  let sideElement = <div></div>;

  if (freeing){
    sideElement = (<Col md={6}>
      <Authenticate
        authenticate={onFree}
        errorMessage={loginMessage}
        fit_in={false}
        headerMessage={`Frigiv Ordre - ${orderIDs.join(', ')}`}
        spinner={loginSpinner}
        buttonMessage={"Frigiv Ordre"}
      />
    </Col>)
  }

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

  const vialRows = vials.map((_vial, i) => {
    const /**@type {Vial} */ vial = _vial;
    const selected = minimum_status === 3 ? true : selectedVials.has(vial.id);
    return <VialRow
      key={vial.id}
      vial={vial}
      selected={selected}
      onSelect={selectVial(vial)}
      setError={setError}
    />
  })

  if(addingVial){
    vialRows.push(
      <NewVialRow
        key={-1}
        stopAddingVial={stopAddingVial}
        setError={setError}
      />
    )
  }

  return (
    <Modal
    data-testid="activity_modal"
      show={true}
      size="lg"
      onHide={on_close}
      className={styles.mariLight}>
    <Modal.Header>
      <h3>
        Ordre - {parseDateToDanishDate(dateToDateString(active_date))} - {timeSlot.delivery_time}
      </h3>
    </Modal.Header>
    <Modal.Body>
        <Row>
          <Col md={(freeing) ? 6 : 12}>
          <Row>
            <Row>
              <Col>{destinationHover}</Col>
              <Col>{destinationMessage}</Col>
            </Row>
            <hr/>
            <Row>
              <Col>Levering tidspunkt:</Col>
              <Col>{timeSlot.delivery_time}</Col>
            </Row>
            <hr/>
            <Row>
              <Col>{orderRows.length == 1 ? "Order" : "Ordre" }</Col>
              <Col>{orderRows}</Col>
            </Row>
            <hr/>
            <Row>
              <Col>{totalActivityHover}</Col>
              <Col>{Math.floor(activity)} MBq</Col>
            </Row>
            <hr/>
            { minimum_status == 2 ?
              <div>
                <Row>
                  <Col>Allokeret aktivitet:</Col>
                  <Col data-testid="allocation-col" >{Math.floor(allocationTotal)} MBq</Col>
                </Row>
                <hr/>
              </div> : null
            }
            { minimum_status == 3 ?
              <div>
                <Row>
                  <Col>Frigivet aktivitet</Col>
                  <Col>{Math.floor(freed_activity)} MBq</Col>
                </Row>
                <hr/>
              </div> : null
            }
            { minimum_status == 3 ?
              <div>
                <Row>
                  <Col>Frigivet tidpunktet</Col>
                  <Col>{freedTime}</Col>
                </Row>
                <hr/>
              </div> : null
            }
            { minimum_status == 3 ?
              <div>
                <Row>
                  <Col>Frigivet af</Col>
                  <Col>{freed_by}</Col>
                </Row>
                <hr/>
              </div> : null
            }

          </Row>
        </Col>
          {sideElement}
        </Row>
        {errorLevel != "" ? <AlertBox
          level={errorLevel}
          message={errorMessage}
        /> : ""}
        <Row>
          <div>
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Batch</th>
                  <th>Produktions Tidpunkt</th>
                  <th>Volume</th>
                  <th>Aktivitet</th>
                  <th></th>
                  <th>Brug</th>
                </tr>
              </thead>
            <tbody>
              {vialRows}
            </tbody>
          </Table>
          <div className="flex-row-reverse d-flex">
            {(addingVial || freeing) ? "" :
              <div>
                <ClickableIcon
                  label="add-new-vial"
                  src="/static/images/plus.svg"
                  onClick={() => {setAddingVial(true)}}/>
              </div>}
            </div>
          </div>
        </Row>
      </Modal.Body>
    <Modal.Footer>
      <div>
        {minimum_status == 1 ? AcceptButton : "" }
        {minimum_status == 2 && !freeing ? ConfirmButton : ""}
        {minimum_status == 2 && freeing ? CancelFreeButton : ""}
        {minimum_status == 3 ? PDFButton : ""}
        <CloseButton onClick={on_close}/>
      </div>
    </Modal.Footer>
    </Modal>
  )
}