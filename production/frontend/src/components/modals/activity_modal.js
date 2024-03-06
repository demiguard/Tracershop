import React, { useEffect, useState } from "react";
import { Col, Container, Form, FormControl, InputGroup, Modal, Row, Table } from "react-bootstrap";

import { Customer, DeliveryEndpoint, ActivityDeliveryTimeSlot, ActivityOrder, Vial, ActivityProduction, Tracer, Isotope } from "~/dataclasses/dataclasses.js";
import { ERROR_LEVELS, AlertBox } from "../injectable/alert_box.js";
import styles from '~/css/Site.module.css'

import { Authenticate } from "../injectable/authenticate.js";
import { HoverBox } from "../injectable/hover_box";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { Comment } from "../injectable/data_displays/comment.js";

import { ERROR_BACKGROUND_COLOR, NEW_LOCAL_ID, ORDER_STATUS, StateType, cssCenter, cssTableCenter, marginLess } from "~/lib/constants.js";

import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_ACTIVITY_ORDER,
  DATA_AUTH, DATA_CUSTOMER, DATA_DELIVER_TIME, DATA_ENDPOINT, DATA_ISOTOPE,
  DATA_PRODUCTION, DATA_TRACER, DATA_USER, DATA_VIAL, WEBSOCKET_DATA,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY } from "~/lib/shared_constants.js"
import { dateToDateString, formatUsername, parseDateToDanishDate } from "~/lib/formatting.js";
import { getTimeString } from "~/lib/chronomancy.js";

import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { concatErrors, parseBatchNumberInput, parseDanishPositiveNumberInput, parseTimeInput } from "../../lib/user_input.js";
import { compareDates, openActivityReleasePDF, toMapping } from "../../lib/utils.js";
import { TimeInput } from "../injectable/inputs/time_input.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { ActivityOrderCollection, OrderMapping, ReleaseRightHolder, TracerCatalog } from "~/lib/data_structures.js";
import { CommitButton } from "../injectable/commit_button.js";
import { Optional, Options } from "../injectable/optional.js";
import { reset_error, setTempMapToEvent, setTempObjectToEvent } from "~/lib/state_management.js";
import { ErrorInput } from "../injectable/inputs/error_input.js";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group.js";
import { CancelBox } from "~/components/injectable/cancel_box.js";


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

const marginRows = {
  marginTop : "7px",
  marginBottom : "7px",
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

  // Order State
  const /** @type {StateType<Map<Number, ActivityOrder>>} */
    [orders, setOrders] = useState(new Map());
  const [orderErrors, setOrderErrors] = useState(new Map());
  const [editingOrders, setEditingOrders] = useState(new Set());
  // Vials State
  const /** @type {StateType<Map<Number,Vial>>} */
    [vials, setVials] = useState(new Map());
  const [vialErrors, setVialError] = useState(new Map());
  const /** @type {StateType<Set<Number>>} */
    [selectedVials, setSelectedVials] = useState(new Set());
  const /** @type {StateType<Set<Number>>} */
    [editingVials, setEditingVials] = useState(new Set());

  const [errorMessage, setErrorMessage] = useState("");
  const [errorLevel, setErrorLevel] = useState("");
  const [freeing, setFreeing] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [loginSpinner, setLoginSpinner] = useState(false);
  const [showCancelBox, setShowCancelBox] = useState(false);

  // Effects
  // These effects are for updating prop dependant state
  useEffect(function initializeVials() {
    setVials(vials => {
      const newOriginalVials = [...state.vial.values()].filter(
        vialFilterFunction(dateString, orderCollection, customer))
      const newVials = toMapping(newOriginalVials);
      if (vials.has(NEW_LOCAL_ID)){
        newVials.set(NEW_LOCAL_ID, vials.get(NEW_LOCAL_ID))
      }
      return newVials;
    });
  }, [state.vial]);

  useEffect(function initializeOrders(){
    setOrders(toMapping(order_mapping.getOrders(timeSlot.id)));
  }, [order_mapping]);

  // Derived State
  const addingVial = vials.has(NEW_LOCAL_ID);
  const canCancel = orderCollection.minimum_status === ORDER_STATUS.ACCEPTED
                || orderCollection.minimum_status === ORDER_STATUS.ORDERED;

  // Helper functions
  function allocateNewVial(){
    setVials(oldVials => {
      const newVials = new Map(oldVials);
      newVials.set(NEW_LOCAL_ID, new Vial(NEW_LOCAL_ID, active_tracer, "", "", "", "", dateString, null, customer.id));
      return newVials;
    });
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
      const [valid, activityNumber] = parseDanishPositiveNumberInput(order.ordered_activity, "Aktiviteten");
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
                  error={error}
                  tail={"MBq"}
                >
                    <FormControl
                      aria-label={`edit-form-order-activity-${order.id}`}
                      value={order.ordered_activity}
                      onChange={(event) => {
                      setOrders(orders => {
                        const newOrders = new Map(orders);
                        const newOrder = order.copy()
                        newOrder.ordered_activity = event.target.value;
                        newOrders.set(order.id, newOrder);
                          return newOrders;
                        });
                        reset_error(setOrderErrors, order.id);
                      }}
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
  });

  const renderedVials = [...vials.values()].map( // Vial rows
    (vial) => {
      const selected = selectedVials.has(vial.id);
      const creating = vial.id === NEW_LOCAL_ID;
      const editing = editingVials.has(vial.id) || creating;
      const canEdit = (orderCollection.minimum_status === ORDER_STATUS.ACCEPTED
                    || orderCollection.minimum_status === ORDER_STATUS.ORDERED)
                    && !freeing;
      const assignable = !Boolean(vial.assigned_to);

      const vialRowStates = {
        DEFAULT : 0,
        DEFAULT_CANNOT_EDIT : 1,
        EDITING : 2,
        SELECTED : 3,
      };

      const vialErrorInit = {
        lot_number : "",
        fill_time : "",
        volume : "",
        activity : "",
      }

      const vialRowState = (() => {
        if(editing) {return vialRowStates.EDITING;}
        if(selected){return vialRowStates.SELECTED;}
        if(canEdit) {return vialRowStates.DEFAULT;}
        return vialRowStates.DEFAULT_CANNOT_EDIT;
      })();

      const error = vialErrors.has(vial.id) ? vialErrors.get(vial.id) : {
        lot_number : "",
        fill_time : "",
        volume : "",
        activity : "",
      };

      // Vial Row functions
      function startEditing() {
        setEditingVials(editingVials => {
          const newEditingVials = new Set(editingVials);
          newEditingVials.add(vial.id);
          return newEditingVials;
        });
      }

      /**
       * Function called after
       */
      function stopEditing() {
        setEditingVials(editingVials => {
          const newEditingVials = new Set(editingVials);
          newEditingVials.delete(vial.id);
          return newEditingVials;
        });
        if(creating){
          setVials(vials => {
            const newVials = new Map(vials);
            newVials.delete(NEW_LOCAL_ID);
            return newVials;
          });
        } else { // Discards edits, note that it's the useEffect initVials
          // responsible for updating the vial
          setVials(vials => {
            const newVials = new Map(vials);
            const newVial = state.vial.get(vial.id).copy();
            newVials.set(vial.id, newVial);
            return newVials;
          });
        }
      }

      function onSelect(){
        if (orderCollection.minimum_status === ORDER_STATUS.ACCEPTED) {
          setSelectedVials(selectedVials => {
            const newSelectedVials = new Set(selectedVials)
            if(selectedVials.has(vial.id)){
              newSelectedVials.delete(vial.id);
            } else {
              newSelectedVials.add(vial.id);
            }
            return newSelectedVials
          })
        }
      }

      function validate() {
        const [batchValid, formattedLotNumber] = parseBatchNumberInput(vial.lot_number, "lot nr.");
        const [timeValid, formattedFillTime] = parseTimeInput(vial.fill_time, "Produktions tidspunk");
        const [volumeValid, formattedVolume] = parseDanishPositiveNumberInput(vial.volume, "Volume");
        const [activityValid, formattedActivity] = parseDanishPositiveNumberInput(vial.activity, "Aktiviten");

        const newVialError = {
          ...vialErrorInit
        }
        if(!batchValid) {
          newVialError.lot_number = formattedLotNumber;
        }

        if(!timeValid){
          newVialError.fill_time = formattedFillTime;
        }
        if(!volumeValid){
          newVialError.volume = formattedVolume;
        }
        if(!activityValid){
          newVialError.activity = formattedActivity;
        }

        setVialError(vialErrors => {
          const newVialErrors = new Map(vialErrors);
          newVialErrors.set(vial.id, newVialError);
          return newVialErrors
        });

        const success = batchValid && timeValid && volumeValid && activityValid;
        return [success,
          { ...vial,
            lot_number : formattedLotNumber,
            fill_time : formattedFillTime,
            volume : formattedVolume,
            activity : formattedActivity
          }];
      }

      return (
        <tr key={vial.id}>
          <td style={cssTableCenter}>
            <Optional exists={!creating} alternative={<div>Ny</div>}>
              {vial.id}
            </Optional>
          </td>
          <td>
            <Optional exists={editing} alternative={<div>{vial.lot_number}</div>}>
              <TracershopInputGroup error={error.lot_number}>
                <FormControl
                  value={vial.lot_number}
                  aria-label={`lot_number-${vial.id}`}
                  onChange={setTempMapToEvent(setVials, vial.id, 'lot_number')}
                />
              </TracershopInputGroup>
            </Optional>
          </td>
          <td>
            <Optional exists={editing} alternative={<div>{vial.fill_time}</div>}>
              <TracershopInputGroup error={error.fill_time}>
                  <TimeInput
                    value={vial.fill_time}
                    aria-label={`fill_time-${vial.id}`}
                    stateFunction={function setFillTime(newFillTime){
                      setVials(vials => {
                        const newVials = new Map(vials);
                        const newVial = vial.copy();
                        newVial.fill_time = newFillTime;
                        newVials.set(vial.id, newVial);
                        return newVials;
                      });
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
                    value={vial.volume}
                    onChange={setTempMapToEvent(setVials, vial.id, 'volume')}
                  />
              </TracershopInputGroup>
            </Optional>
          </td>
          <td>
            <Optional exists={editing} alternative={<div>{vial.activity} MBq</div>}>
            <TracershopInputGroup error={error.activity} tail={"MBq"}>
                  <FormControl
                    value={vial.activity}
                    aria-label={`activity-${vial.id}`}
                    onChange={setTempMapToEvent(setVials, vial.id, 'activity')}
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
                <CommitButton
                  temp_object={vial}
                  object_type={DATA_VIAL}
                  validate={validate}
                  callback={stopEditing}
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
                  onClick={stopEditing}
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
    for(const order of orders){
      if (order.status === ORDER_STATUS.ORDERED){
        order.status = ORDER_STATUS.ACCEPTED;
      }
    }
    websocket.sendEditModel(DATA_ACTIVITY_ORDER, orders)
  }

  function onClickToPDF() {
    openActivityReleasePDF(endpoint, tracer, active_date)
  }

  function onFree(username, password){
    setLoginSpinner(true);
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_FREE_ACTIVITY);
    const data = {};
    data[DATA_DELIVER_TIME] = timeSlotID
    data[DATA_ACTIVITY_ORDER] = orderCollection.orderIDs
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

  function startCancelOrders(){
    setShowCancelBox(true);
  }
  function stopCancelOrders(){
    setShowCancelBox(false);
  }

  function confirmCancel(){
    const ordersToBeSend = []
    const cancelationTime = new Date();
    const cancelationTimeString = `${cancelationTime.getFullYear()}-${cancelationTime.getMonth() + 1}-${cancelationTime.getDay()} ${cancelationTime.getHours()}:${cancelationTime.getMinutes()}:${cancelationTime.getSeconds()}`
    for(const order of orderCollection.orders){
      ordersToBeSend.push({...order,
        status : ORDER_STATUS.CANCELLED,
        freed_by : state.logged_in_user.id,
        freed_datetime : cancelationTimeString,
      });
    }
    if(ordersToBeSend.length){
      websocket.sendEditModel(DATA_ACTIVITY_ORDER, ordersToBeSend);
    }
    setShowCancelBox(false);
  }

  // Sub elements
  // Buttons
  const AcceptButton = editingOrders.size === 0 ?
      <MarginButton onClick={onClickAccept}>Accepter</MarginButton>
    : <HoverBox
        Base={<MarginButton disabled>Accepter</MarginButton>}
        Hover={<div>Du kan ikke accepter ordre imens du redigerer dem.</div>}
      />;

  const canFree = selectedVials.size > 0 && !(addingVial) && RightsToFree;
  const ConfirmButton = canFree ?
                          <MarginButton onClick={startFreeing}>Godkend</MarginButton>
                        : <MarginButton disabled>Godkend</MarginButton>;
  const CancelFreeButton = <MarginButton onClick={() => {setFreeing(false)}}>Rediger</MarginButton>
  const PDFButton = <MarginButton onClick={onClickToPDF}>Frigivelsecertifikat</MarginButton>;

  let sideElement = <div></div>;

  if (freeing){
    sideElement = (<Col md={6}>
      <Authenticate
        authenticate={onFree}
        errorMessage={loginMessage}
        fit_in={false}
        headerMessage={`Frigiv Ordre - ${orderCollection.orderIDs.join(', ')}`}
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

  return (
    <div>
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
          <Col md={freeing ? 6 : 12}>
          <Row>
            <Row style={marginRows}>
              <Col>{destinationHover}</Col>
              <Col>{destinationMessage}</Col>
            </Row>
            <hr style={marginLess}/>
            <Row style={marginRows}>
              <Col>Levering tidspunkt:</Col>
              <Col>{timeSlot.delivery_time}</Col>
            </Row>
            <hr style={marginLess}/>
            <Row style={marginRows}>
              <Col style={{
                display : "block",
                margin: 'auto',
                alignItems: 'center',
              }}>{orderRows.length == 1 ? "Order" : "Ordre" }</Col>
              <Col>{orderRows}</Col>
            </Row>
            <hr style={marginLess}/>
            <Row style={marginRows}>
              <Col>{totalActivityHover}</Col>
              <Col>{Math.floor(orderCollection.deliver_activity)} MBq</Col>
            </Row>
            <hr style={marginLess}/>
            <Optional exists={orderCollection.minimum_status == ORDER_STATUS.ACCEPTED}>
              <Row style={marginRows}>
                <Col>Allokeret aktivitet:</Col>
                <Col data-testid="allocation-col">{Math.floor(allocationTotal)} MBq</Col>
              </Row>
              <hr style={marginLess}/>
            </Optional>
            <Optional exists={orderCollection.minimum_status == ORDER_STATUS.RELEASED}>
              <Row style={marginRows}>
                <Col>Frigivet aktivitet</Col>
                <Col>{Math.floor(orderCollection.delivered_activity)} MBq</Col>
              </Row>
              <hr style={marginLess}/>
              <Row style={marginRows}>
                <Col>Frigivet tidpunktet</Col>
                <Col>{orderCollection.freed_time}</Col>
              </Row>
              <hr style={marginLess}/>
              <Row style={marginRows}>
                <Col>Frigivet af</Col>
                <Col>{formatUsername(orderCollection.freed_by)}</Col>
              </Row>
              <hr style={marginLess}/>
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
              {renderedVials}
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
      <Container>
      <Row className="justify-content-around">
        <Col>
          <Optional exists={canCancel}>
            <Col md="auto">
              <MarginButton onClick={startCancelOrders}>Afvis</MarginButton>
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
    <CancelBox
      confirm = {confirmCancel}
      show={showCancelBox}
      onClose={stopCancelOrders}
    />
    </div>
  );
}