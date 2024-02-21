import React, { useEffect, useState } from "react";
import { Col, Form, FormControl, InputGroup, Modal, Row, Table } from "react-bootstrap";

import { Customer, DeliveryEndpoint, ActivityDeliveryTimeSlot, ActivityOrder, Vial, ActivityProduction, Tracer, Isotope } from "~/dataclasses/dataclasses.js";
import { ERROR_LEVELS, AlertBox } from "../injectable/alert_box.js";
import styles from '~/css/Site.module.css'

import { Authenticate } from "../injectable/authenticate.js";
import { HoverBox } from "../injectable/hover_box";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { Comment } from "../injectable/data_displays/comment.js";

import { ERROR_BACKGROUND_COLOR, NEW_LOCAL_ID, ORDER_STATUS, StateType } from "~/lib/constants.js";

import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_ACTIVITY_ORDER,
  DATA_AUTH, DATA_CUSTOMER, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_ISOTOPE,
  DATA_PRODUCTION, DATA_TRACER, DATA_USER, DATA_VIAL, WEBSOCKET_DATA,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY } from "~/lib/shared_constants.js"
import { dateToDateString, formatReleaserUsername, parseDateToDanishDate } from "~/lib/formatting.js";
import { getTimeString } from "~/lib/chronomancy.js";

import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { concatErrors, parseBatchNumberInput, parseDanishPositiveNumberInput, parseTimeInput } from "../../lib/user_input.js";
import { compareDates, getPDFUrls, toMapping } from "../../lib/utils.js";
import { TimeInput } from "../injectable/inputs/time_input.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { ActivityOrderCollection, OrderMapping, ReleaseRightHolder, TracerCatalog } from "~/lib/data_structures.js";
import { CommitButton } from "../injectable/commit_button.js";
import { Optional, Options } from "../injectable/optional.js";
import { reset_error, setTempObjectToEvent } from "~/lib/state_management.js";
import { ErrorInput } from "../injectable/inputs/error_input.js";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group.js";

/**
 * Filters out vials that is should not be displayed by the activity modal
 * @param {String} dateString
 * @param {ActivityOrderCollection} orderCollection
 * @param {Customer} customer
 * @returns {Boolean} - True if the vial should be displayed false otherwise
 */
function vialFilterFunction(dateString, orderCollection, customer){
  return (vial) => {
    if(vial.fill_date !== dateString){
      return false;
    }
    if(orderCollection.minimum_status === ORDER_STATUS.RELEASED){
      return orderCollection.orderIDs.includes(vial.assigned_to)
    } else {
      return vial.owner === customer.id;
    }
  }
}

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
  const websocket = useWebsocket();
  //
  const dateString = dateToDateString(active_date);
  const timeSlot = state.deliver_times.get(timeSlotID);
  const originalOrders = order_mapping.getOrders(timeSlot.id);
  const endpoint = state.delivery_endpoint.get(timeSlot.destination);
  const customer = state.customer.get(endpoint.owner);
  const overhead = tracer_catalog.getOverheadForTracer(customer.id, active_tracer);
  const tracer = state.tracer.get(active_tracer);
  const releaseRightHolder = new ReleaseRightHolder(state.logged_in_user, state.release_right);
  const orderCollection = new ActivityOrderCollection(originalOrders, state, overhead);
  const RightsToFree = releaseRightHolder.permissionForTracer(tracer);

  console.log(orderCollection)

  // Order State
  const /** @type {StateType<Map<Number, ActivityOrder>>} */
    [orders, setOrders] = useState(new Map());
  const [orderErrors, setOrderErrors] = useState(new Map());
  const [editingOrders, setEditingOrders] = useState(new Set());
  // Vials State
  const /** @type {StateType<Map<Number,Vial>>} */
    [vials, setVials] = useState(new Map());
  const [vialErrors, setVialError] = useState(new Map());
  const [selectedVials, setSelectedVials] = useState(new Set());
  const [editingVials, setEditingVials] = useState(new Set());

  const [errorMessage, setErrorMessage] = useState("");
  const [errorLevel, setErrorLevel] = useState("");
  const [freeing, setFreeing] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [loginSpinner, setLoginSpinner] = useState(false);

  // Effects
  // These effects are for updating prop dependant state
  useEffect(function initializeVials() {
    setVials(oldVials => {
      const newOriginalVials = [...state.vial.values()].filter(
        vialFilterFunction(dateString, orderCollection, customer))
      const newVials = toMapping(newOriginalVials);
      if (oldVials.has(NEW_LOCAL_ID)){
        newVials.set(NEW_LOCAL_ID, oldVials.get(NEW_LOCAL_ID))
      }
      return newVials;
    });
  }, [state.vial]);

  useEffect(function initializeOrders(){
    setOrders(toMapping(order_mapping.getOrders(timeSlot.id)));
  }, [order_mapping]);

  // Derived State
  const addingVial = vials.has(NEW_LOCAL_ID);

  // Helper functions
  function allocateNewVial(){
    setVials(oldVials => {
      const newVials = new Map(oldVials);
      newVials.set(NEW_LOCAL_ID, new Vial(NEW_LOCAL_ID, active_tracer, "", "", "", "", dateString, null, customer.id))
      return newVials;
    });
  }

  function deallocateNewVial(){
    setVials(oldVials => {
      const newVials = new Map(oldVials);
      newVials.delete(NEW_LOCAL_ID);
      return newVials;
    });
  }


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
    const orderRowStates = {
      DEFAULT : 0,
      DEFAULT_CANNOT_EDIT : 1,
      EDITING : 2,
    }
    const orderRowState = (() => {
      if(editing){return orderRowStates.EDITING;}
      if(!canEdit){return orderRowStates.DEFAULT_CANNOT_EDIT;}
      return orderRowStates.DEFAULT;
    })();

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

    let iconFunction = canEdit ? () => {setEditing(true)} : () => {}
    return (
      <Row>
        <Col>Order ID:{order.id}</Col>
        <Col>{activityDisplay}</Col>
        <Col xs={2}>
          <Comment comment={order.comment}/>
        </Col>
        <Col xs={2} style={{
          justifyContent : "right", display : "flex"
        }}><Optional exists={editing} alternative={
          <StatusIcon
                label={`edit-order-activity-${order.id}`}
                order={order}
                onClick={iconFunction}
          />
        }>
          <ClickableIcon
            label={`edit-accept-order-activity-${order.id}`}
            src="static/images/accept.svg"
            onClick={acceptEdit}
          />
        </Optional>
          </Col>
      </Row>
    )
  }

  /**
   * A row in the vial table
   * @param {{
   * vial : Vial,
   * minimum_status : Number,
   * onSelect : CallableFunction,
   * selected : Boolean,
   * }} props for component
   * @returns
   */
  function VialRow({vial, onSelect, selected}){
    const vialErrorInit = {
      lot_number : "",
      full_time : "",
      volume : "",
      activity : ""
    }

    const creating = vial.id <= 0;
    const [editing, setEditing] = useState(creating);
    const [tempVial, setTempVial] = useState({...vial});
    const [vialErrors, setVialErrors] = useState({...vialErrorInit});

    // Note there's a level of
    const vialRowStates = {
      DEFAULT : 0,
      DEFAULT_CANNOT_EDIT : 1,
      EDITING : 2,
      SELECTED : 3,

    };


    const assignable = !Boolean(vial.assigned_to);
    // This value should be moved into orderRowState
    const canEdit = (orderCollection.minimum_status == 1 || orderCollection.minimum_status == 2) && !freeing;
    const vialRowState = (() => {
      if(editing) {return vialRowStates.EDITING;}
      if(selected){return vialRowStates.SELECTED;}
      if(canEdit) {return vialRowStates.DEFAULT;}
      return vialRowStates.DEFAULT_CANNOT_EDIT;
    })();

    function setDisplayVial(newVial){
      setTempVial({
        ...tempVial,
        ...newVial,
      })
    }


    // Refresh the vial
    useEffect(() => {
      setDisplayVial(vial)
      return () => {}
    }, [vial])

    function setFillTime(newFillTime){
      setTempVial(tmp => {return {...tmp,
        fill_time : newFillTime
      }})
    }

    function validate() {
      const [batchValid, formattedLotNumber] = parseBatchNumberInput(tempVial.lot_number, "lot nr.");
      const [timeValid, formattedFillTime] = parseTimeInput(tempVial.fill_time, "Produktions tidspunk");
      const [volumeValid, formattedVolume] = parseDanishPositiveNumberInput(tempVial.volume, "Volume");
      const [activityValid, formattedActivity] = parseDanishPositiveNumberInput(tempVial.activity, "Aktiviten");

      const newVialError = {
        ...vialErrorInit
      }
      if(!batchValid) {
        newVialError.lot_number = formattedLotNumber;
      }

      if(!timeValid){
        newVialError.full_time = formattedFillTime;
      }
      if(!volumeValid){
        newVialError.volume = formattedVolume;
      }
      if(!activityValid){
        newVialError.activity = formattedActivity;
      }

      setVialErrors(newVialError);

      const success = batchValid && timeValid && volumeValid && activityValid;
      if(success){
        setEditing(false);
      }

      return [success,
        { ...vial,
          lot_number : formattedLotNumber,
          fill_time : formattedFillTime,
          volume : formattedVolume,
          activity : formattedActivity
        }];
    }

    return (
      <tr>
        <td>
          <Optional exists={!creating} alternative={<div>Ny</div>}>
            {vial.id}
          </Optional>
        </td>
        <td>
          <Optional exists={editing} alternative={<div>{vial.lot_number}</div>}>
            <TracershopInputGroup>
            <ErrorInput error={vialErrors.lot_number}>
              <FormControl
                value={tempVial.lot_number}
                aria-label={`lot_number-${vial.id}`}
                onChange={setTempObjectToEvent(setTempVial, 'lot_number')}
                />
            </ErrorInput>
            </TracershopInputGroup>
          </Optional>
        </td>
        <td>
          <Optional exists={editing} alternative={<div>{vial.fill_time}</div>}>
            <TracershopInputGroup>
              <ErrorInput error={vialErrors.full_time}>
                <TimeInput
                  value={tempVial.fill_time}
                  aria-label={`fill_time-${vial.id}`}
                  stateFunction={setFillTime}
                  />
                </ErrorInput>
            </TracershopInputGroup>
          </Optional>
        </td>
        <td>
          <Optional exists={editing} alternative={<div>{vial.volume} ml</div>}>
            <TracershopInputGroup>
              <ErrorInput error={vialErrors.volume}>
                <FormControl
                  aria-label={`volume-${vial.id}`}
                  value={tempVial.volume}
                  onChange={setTempObjectToEvent(setTempVial, 'volume')}
                />
              </ErrorInput>
              <InputGroup.Text> ml</InputGroup.Text>
            </TracershopInputGroup>
          </Optional>
        </td>
        <td>
          <Optional exists={editing} alternative={<div>{vial.activity} MBq</div>}>
          <TracershopInputGroup>
              <ErrorInput error={vialErrors.activity}>
              <FormControl
                value={tempVial.activity}
                aria-label={`activity-${vial.id}`}
                onChange={setTempObjectToEvent(setTempVial, 'activity')}/>
              </ErrorInput>
              <InputGroup.Text> MBq</InputGroup.Text>
            </TracershopInputGroup>
          </Optional>
        </td>
        <td>
        <Optional exists={!Boolean(vial.assigned_to)}>
          <Options index={vialRowState}>
            <div> {/* DEFAULT */}
              <ClickableIcon
                src="/static/images/pen.svg"
                label={`edit-vial-${vial.id}`}
                onClick={() => {setEditing(true);}}
              />
            </div>
            <div> {/* DEFAULT_CANNOT_EDIT */}
            </div>
            <div> {/* EDITING */}
              <CommitButton
                temp_object={tempVial}
                object_type={DATA_VIAL}
                validate={validate}
                callback={deallocateNewVial}
                label={`vial-commit-${vial.id}`}
              />
            </div>
            <div> {/* SELECTED */}
            </div>
          </Options>
        </Optional>
        </td>
        <td>
          <Optional exists={assignable}>
            <Options index={vialRowState}>
              <div> {/* DEFAULT */}
                <Form.Check
                  aria-label={`vial-usage-${vial.id}`}
                  onChange={onSelect}
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
                onClick={() => {setEditing(false); if(creating) {deallocateNewVial()}}}
              />
              </div>
              <div> {/* SELECTED */}
              <Form.Check
                aria-label={`vial-usage-${vial.id}`}
                onChange={onSelect}
                checked={selected}/>
              </div>
            </Options>
          </Optional>
        </td>
      </tr>
    );
  }

  // "Subcomponents"
  const orderRows = [...orders.values()].map((order) => {
    const editing = editingOrders.has(order.id);
    const canEdit = order.status == ORDER_STATUS.ACCEPTED
            || order.status == ORDER_STATUS.ORDERED;
    const orderRowStates = {
      DEFAULT : 0,
      DEFAULT_CANNOT_EDIT : 1,
      EDITING : 2,
    }
    const orderRowState = (() => {
      if(editing){return orderRowStates.EDITING;}
      if(!canEdit){return orderRowStates.DEFAULT_CANNOT_EDIT;}
      return orderRowStates.DEFAULT;
    })();

    const error = orderErrors.has(order.id) ? orderErrors.get(order.id) : "";

    function validate(){
      const [valid, activityNumber] = parseDanishPositiveNumberInput(order.ordered_activity);
      if(!valid){
        setOrderErrors(oldErrors => {
          const newErrors = new Map(oldErrors);
          newErrors.set(order.id, activityNumber);
          return newErrors;
        });
        return [false, {}];
      }
      return [true, {...order,
        ordered_activity : activityNumber,
      }]
    }

    function commitCallback(){
      setEditingOrders(oldEditingOrders => {
        const newEditingOrders = new Set(oldEditingOrders);
        newEditingOrders.delete(order.id)
        return newEditingOrders;
      });
    }



    let activityDisplay = canEdit ?
                            <HoverBox
                              Base={<p>{`${order.ordered_activity} MBq`}</p>}
                              Hover={<p>Tryg på status Ikonet for at ændre dosis</p>}
                              />
                            : `${order.ordered_activity} MBq`;

      if(editing){
        activityDisplay = (
          <ErrorInput error={error}>
            <FormControl
                              aria-label={`edit-form-order-activity-${order.id}`}
                              value={order.ordered_activity}
                              onChange={(event) => {
                                setOrders(orders => {
                                  const newOrders = new Map(orders)
                                  newOrders.set(order.id, {...order,
                                    ordered_activity : event.target.value})
                                  })
                                  reset_error(set, order.id)
                                }}
                            />
          </ErrorInput>);
    }

    return (
      <Row key={order.id}>
        <Col>Order ID:{order.id}</Col>
        <Col>{activityDisplay}</Col>
        <Col xs={2}>
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
                    setEditingOrders(editingOrders => {
                      const newEditingOrders = new Set(editingOrders)
                      newEditingOrders.add(order.id)
                      return newEditingOrders
                    });
                  }
                }}
          />
        }>
          <CommitButton
            object_type={DATA_ACTIVITY_ORDER}
            temp_object={order}
            validate={validate}
            callback={commitCallback}
          />
        </Optional>
          </Col>
      </Row>
    )
  })

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
    for(const order of orders){
      if (order.status === ORDER_STATUS.ORDERED){
        order.status = ORDER_STATUS.RELEASED;
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

  function setError(level, error){
    setErrorLevel(level)
    setErrorMessage(<div>{error}</div>);
  }

  /**
   * @param {Vial} vial */
  function selectVial(vial){
    if(freeing || orderCollection.minimum_status === ORDER_STATUS.RELEASED){
      return () => {};
    }

    return () => {
      setSelectedVials(oldSelection => {
        const newSelection = new(oldSelection);
        if(oldSelection.has(vial.id)){
          newSelection.delete(vial.id);
        } else {
          newSelection.add(vial.id);
        }
        return newSelection;
      })
    };
  }

  // Sub elements
  // Buttons
  const AcceptButton =  <MarginButton onClick={onClickAccept}>Accepter Ordre</MarginButton>;

  const canFree = selectedVials.size > 0 && !(addingVial) && RightsToFree;
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

  const vialRows = [...vials.values()].map((_vial) => {
    const /**@type {Vial} */ vial = _vial;
    const selected = orderCollection.minimum_status === ORDER_STATUS.RELEASED ?
      true : selectedVials.has(vial.id);
    return <VialRow
      key={vial.id}
      vial={vial}
      selected={selected}
      onSelect={selectVial(vial)}
      setError={setError}
    />
  });


  return (
    <Modal
    data-testid="activity_modal"
      show={true}
      size="lg"
      onHide={on_close}
      className={styles.mariLight}>
    <Modal.Header>
      <h3>
        Ordre - {parseDateToDanishDate(dateString)} - {timeSlot.delivery_time}
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
              <Col>{Math.floor(orderCollection.deliver_activity)} MBq</Col>
            </Row>
            <hr/>
            <Optional exists={orderCollection.minimum_status == ORDER_STATUS.ACCEPTED}>
              <Row>
                <Col>Allokeret aktivitet:</Col>
                <Col data-testid="allocation-col" >{Math.floor(allocationTotal)} MBq</Col>
              </Row>
              <hr/>
            </Optional>
            <Optional exists={orderCollection.minimum_status == ORDER_STATUS.RELEASED}>
              <Row>
                <Col>Frigivet aktivitet</Col>
                <Col>{Math.floor(orderCollection.delivered_activity)} MBq</Col>
              </Row>
              <hr/>
              <Row>
                <Col>Frigivet tidpunktet</Col>
                <Col>{orderCollection.freed_time}</Col>
              </Row>
              <hr/>
              <Row>
                <Col>Frigivet af</Col>
                <Col>{formatReleaserUsername(orderCollection.freed_by)}</Col>
              </Row>
              <hr/>
            </Optional>
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
                  onClick={allocateNewVial}/>
              </div>}
            </div>
          </div>
        </Row>
      </Modal.Body>
    <Modal.Footer>
      <div>
        {orderCollection.minimum_status == 1 ? AcceptButton : "" }
        {orderCollection.minimum_status == 2 && !freeing ? ConfirmButton : ""}
        {orderCollection.minimum_status == 2 && freeing ? CancelFreeButton : ""}
        {orderCollection.minimum_status == 3 ? PDFButton : ""}
        <CloseButton onClick={on_close}/>
      </div>
    </Modal.Footer>
    </Modal>
  )
}