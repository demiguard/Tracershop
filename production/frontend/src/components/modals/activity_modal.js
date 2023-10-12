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
import { TracerCatalog } from "~/lib/data_structures.js";


/**
 * 
 * @param {{
 *  tracer_catalog : TracerCatalog
 * }} param0 
 * @returns 
 */
export function ActivityModal({
  active_date, active_tracer, order_mapping, on_close, timeSlotID, timeSlotMapping, tracer_catalog
}){
  // State extraction
  const state = useTracershopState();
  const websocket = useWebsocket()
  const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = state.deliver_times.get(timeSlotID)
  const /**@type {ActivityProduction} */ production = state.production.get(timeSlot.production_run);
  const /**@type {Array<ActivityOrder>}*/ orders = order_mapping.get(timeSlot.id)
  const /**@type {DeliveryEndpoint} */ endpoint = state.delivery_endpoint.get(timeSlot.destination)
  const /**@type {Customer} */ customer = state.customer.get(endpoint.owner)
  const /**@type {Number} */ overhead = tracer_catalog.getOverheadForTracer(customer.id, active_tracer)
  const /**@type {Tracer} */ tracer = state.tracer.get(active_tracer)
  const /**@type {Isotope} */ isotope = state.isotopes.get(tracer.isotope)
  
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
  function VialRow({vial, onSelect, selected, websocket, setError}){
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
        setError(ERROR_LEVELS.error, errors)
      }
    }

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
  
  function NewVialRow({stopAddingVial, setError, websocket, active_date, customer}){
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
        setError(errors);
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
      const freeingUser = props[DATA_USER].get(order.freed_by);
      freed_by = freeingUser.username.toUpperCase();
    }

    let rowIcon = <StatusIcon status={order.status}/>
    if (order.moved_to_time_slot){
      rowIcon = <ClickableIcon src="/static/images/move_top.svg"/>
    }
    orderRows.push(
      <OrderRow
        key={order.id}
        order={order}
        timeSlotId={props[PROP_TIME_SLOT_ID]}
        timeSlots={props[DATA_DELIVER_TIME]}
        websocket={websocket}
    />);
  }

  const vials = [...props[DATA_VIAL].values()].filter(
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

  // STATE DEFINITION
  const [state_, _setState] = useState({
    editingVials : new Map(),
    errorLevel : null,
    errorMessage : <div></div>,
    freeing : false,
    loginMessage : "",
    selectedVials : new Set(),
    addingVial : false
  })

  function setState(newState){
    _setState({...state, ...newState})
  }

  function startFreeing(){
    if(compareDates(props[PROP_ACTIVE_DATE], new Date())){
      setState({ freeing : true})
    } else {
      setState({
        freeing : true,
        errorLevel : ERROR_LEVELS.hint,
        errorMessage : <div>Ordren som er i gang med at blive frigivet er ikke til i dag!</div>
      })
    }

  }

  // Derived state Values
  const canFree = state.selectedVials.size > 0 && !(state.addingVial)

  // Functions
  function onClickAccept(){
    const /**@type {Array<ActivityOrder>} */ orders = props[PROP_ORDER_MAPPING].get(props[PROP_TIME_SLOT_ID]);
    {Math.floor(freed_activity)}
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
    window.location = getPDFUrls(endpoint, tracer, props[PROP_ACTIVE_DATE])
  }

  function onFree(username, password){
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_FREE_ACTIVITY);
    const data = {};
    data[DATA_DELIVER_TIME] = props[PROP_TIME_SLOT_ID]
    data[DATA_ACTIVITY_ORDER] = orderIDs
    data[DATA_VIAL] = [...state.selectedVials];
    message[WEBSOCKET_DATA] = data;
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[DATA_AUTH] = auth;
    websocket.send(message).then((data) =>{
      if (data[AUTH_IS_AUTHENTICATED]){
        setState({
          freeing : false,
          errorMessage : <div></div>,
          errorLevel : null,
        });
      } else {
        setState({
          errorMessage : <div>Forkert login</div>,
          errorLevel : ERROR_LEVELS.error,
        });
      }
    });
  }

  function stopAddingVial(){
    setState({addingVial : false})
  }

  function setError(level, errors){
    const errorHTML = errors.map((errorString, i) => {
      return <p key={i}>{errorString}</p>
    })

    setState({
      errorLevel : level,
      errorMessage : <div>{errorHTML}</div>
    })
  }

  /**
   * @param {Vial} vial */
  function selectVial(vial){
    if(state.freeing || minimum_status === 3){
      return;
    }

    return () => {
      if(state.selectedVials.has(vial.id)){
        const newSelectedVials = new Set(state.selectedVials);
        newSelectedVials.delete(vial.id)
        setState({
          selectedVials : newSelectedVials
        })
      } else {
        const newSelectedVials = new Set(state.selectedVials);
        newSelectedVials.add(vial.id)
        setState({
          selectedVials : newSelectedVials
        });
      }
    }
  }

  // Sub elements
  // Buttons
  const AcceptButton =  <MarginButton onClick={onClickAccept}>Accepter Ordre</MarginButton>;
  const ConfirmButton = canFree ?
    <MarginButton onClick={startFreeing}>
      Godkend Ordre
    </MarginButton> : <MarginButton disabled>Godkend Ordre</MarginButton>;

  const CancelFreeButton = <MarginButton onClick={() => {setState({freeing : true})}}>Rediger Ordre</MarginButton>
  const PDFButton = <MarginButton onClick={onClickToPDF}>Se føgleseddel</MarginButton>;

  let sideElement = <div></div>;

  if (state.freeing){
    sideElement = (<Col md={6}>
      <Authenticate
        authenticate={onFree}
        errorMessage={state.loginMessage}
        fit_in={false}
        headerMessage={`Frigiv Ordre - ${orderIDs.join(', ')}`}
        spinner={state.loginSpinner}
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
  const formattedOrderTime = `${timeSlot.delivery_time}`

  const totalActivityHover = <HoverBox
    Base={<div>Total Aktivitet</div>}
    Hover={<div>Mængde af aktivitet der skal produceres til ordren.</div>}
  />;

  let allocationTotal = 0;
  for(const vid of state.selectedVials.values()){
    const /**@type {Vial} */ vial = props[DATA_VIAL].get(vid);
    allocationTotal += vial.activity;
  }

  const vialRows = vials.map((_vial, i) => {
    const /**@type {Vial} */ vial = _vial;
    const selected = minimum_status === 3 ? true : state.selectedVials.has(vial.id);
    return <VialRow
      key={vial.id}
      vial={vial}
      websocket={websocket}
      selected={selected}
      onSelect={selectVial(vial)}
      setError={setError}
    />
  })

  if(state.addingVial){
    vialRows.push(
      <NewVialRow
        active_date={dateString}
        key={-1}
        stopAddingVial={stopAddingVial}
        setError={setError}
        websocket={websocket}
        tracer={tracer}
        customer={customer}
      />
    )
  }

  return (
    <Modal
    data-testid="activity_modal"
      show={true}
      size="lg"
      onHide={props[PROP_ON_CLOSE]}
      className={styles.mariLight}>
    <Modal.Header>
      <h3>
        Ordre - {parseDateToDanishDate(dateToDateString(props[PROP_ACTIVE_DATE]))} - {timeSlot.delivery_time}
      </h3>
    </Modal.Header>
    <Modal.Body>
        <Row>
          <Col md={(state.usingCalculator || state.freeing) ? 6 : 12}>
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
        {state.errorLevel != null ? <AlertBox
          level={state.errorLevel}
          message={state.errorMessage}/> : ""}
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
            {(state.addingVial || state.freeing) ? "" :
              <div>
                <ClickableIcon
                  label="add-new-vial"
                  src="/static/images/plus.svg"
                  onClick={() => {setState({addingVial : true})}}/>
              </div>}
            </div>
          </div>
        </Row>
      </Modal.Body>
    <Modal.Footer>
      <div>
        {minimum_status == 1 ? AcceptButton : "" }
        {minimum_status == 2 && !state.freeing ? ConfirmButton : ""}
        {minimum_status == 2 && state.freeing ? CancelFreeButton : ""}
        {minimum_status == 3 ? PDFButton : ""}
        <CloseButton onClick={props[PROP_ON_CLOSE]}/>
      </div>
    </Modal.Footer>
    </Modal>
  )
}