import React, { Component, useState } from "react";
import propTypes from 'prop-types'
import { Button, ButtonGroup, Col, Form, FormControl, Modal, Row, Table } from "react-bootstrap";
import { Customer, DeliveryEndpoint, ActivityDeliveryTimeSlot, ActivityOrder, Vial, ActivityProduction, Tracer, Isotope } from "../../dataclasses/dataclasses.js";
import { ERROR_LEVELS, AlertBox } from "../injectable/alert_box.js";
import styles from '../../css/Site.module.css'
import { renderComment, renderTableRow } from "../../lib/rendering.js";
import { changeState, toggleState } from "../../lib/state_management.js";
import { Calculator } from "../injectable/calculator.js";
import Authenticate from "../injectable/authenticate.js";
import { HoverBox } from "../injectable/hover_box";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { compareDates as compareDates } from "../../lib/utils.js";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, ERROR_BACKGROUND_COLOR, JSON_ACTIVITY_ORDER, JSON_AUTH, JSON_CUSTOMER, JSON_DELIVER_TIME, JSON_ENDPOINT, JSON_ISOTOPE, JSON_PRODUCTION, JSON_TRACER, JSON_VIAL, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_ON_CLOSE, PROP_ORDER_MAPPING, PROP_OVERHEAD_MAP, PROP_TIME_SLOT_ID, PROP_WEBSOCKET, WEBSOCKET_DATA,
  WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_MODEL_CREATE,  WEBSOCKET_MESSAGE_MODEL_EDIT} from "../../lib/constants.js";
import { batchNumberValidator, dateToDateString, FormatTime, ParseDanishNumber, parseDateToDanishDate } from "../../lib/formatting.js";
import { KEYWORD_ActivityOrder_STATUS, KEYWORD_DeliveryEndpoint_OWNER, KEYWORD_Vial_ACTIVITY, KEYWORD_Vial_FILL_TIME, KEYWORD_Vial_LOT_NUMBER, KEYWORD_Vial_VOLUME } from "../../dataclasses/keywords.js";
import { compareTimeStamp } from "../../lib/chronomancy.js";
import { CalculateProduction } from "../../lib/physics.js";
import { TracerWebSocket } from "../../lib/tracer_websocket.js";


export { ActivityModal }

const initial_state = {
  selectedVials : new Set(),
  editingVials : new Map(),
  isFreeing : false,
  editingActivity : false,
  usingCalculator : false,
  activityValue : 0,
  loginMessage : "",
  loginSpinner : false,
  errorLevel : null,
  errorMessage : "",
  addingVial: false,
  newVial : {
    lot_number : "",
    fill_time : "",
    volume : "",
    activity : "",
  }
}

/**
 * 
 * @param {{
 *  order : ActivityOrder,
 *  websocket : TracerWebSocket,
 *  timeSlots : Map<Number, ActivityDeliveryTimeSlot>
 *  timeSlotId : Number
 * }} props
 * @retuns {Element}
 */
function OrderRow({order, websocket, timeSlots, timeSlotId}){
  const timeSlot = timeSlots.get(timeSlotId);
  const [activity, setActivity] = useState(order.ordered_activity);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const canEdit = order.status == 1 || order.status == 2;
  const displayStyle = error ? {backgroundColor : ERROR_BACKGROUND_COLOR} : {}

  function acceptEdit (){
    const activityNumber = Number(activity)
    if(isNaN(activity) || activity <= 0){
      setError(true);
      return;
    }
    order.ordered_activity = activityNumber;

    websocket.sendEditModel(JSON_ACTIVITY_ORDER, [order]);
    setEditing(false);
    setError(false);
  }

  let activityDisplay = canEdit ?  <HoverBox
    Base={<p>{`${activity} MBq`}</p>}
    Hover={<p>Tryg på status Ikonet for at ændre dosis</p>}
    /> : `${activity} MBq`;

    if(editing){
      activityDisplay = <FormControl style={displayStyle} value={activity} onChange={(event) => {
        setActivity(event.target.value)
    }}/>
  }


  let iconFunction= canEdit ? () => {setEditing(true)} : () => {}
  let icon = <StatusIcon status={order.status}  onClick={iconFunction}/>
  if (order.moved_to_time_slot){
    icon = <ClickableIcon src="/static/images/move_top.svg" onClick={iconFunction}/>
  }
  if(editing){
    icon = <ClickableIcon src="static/images/accept.svg" onClick={acceptEdit}/>
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


class ActivityModal extends Component {
  /*
   *
  static propTypes = {
    customers: propTypes.instanceOf(Map).isRequired,
    isotopes : propTypes.instanceOf(Map).isRequired,
    tracers  : propTypes.instanceOf(Map).isRequired,
    order    : propTypes.number.isRequired,
    orders   : propTypes.instanceOf(Map).isRequired,
    vials    : propTypes.instanceOf(Map).isRequired,
  }
  */

  constructor(props){
    super(props);

    const /**@type {Array<ActivityOrder>} */ orders = this.props[PROP_ORDER_MAPPING].get(this.props[PROP_TIME_SLOT_ID])
    const state = {...initial_state}
    this.minimum_status = 5

    const orderIDs = []
    for(const order of orders){
      this.minimum_status = Math.min(this.minimum_status, order.status)
      orderIDs.push(order.id)
    }

    if(this.minimum_status == 3){
      for(const [vialID, _vial] of this.props[JSON_VIAL]){
        const /**@type {Vial} */ vial = _vial
        if(orderIDs.includes(vial.assigned_to)){
          state.selectedVials.add(vialID)
        }
      }
    }

    this.state = state;
  }

  // ***** Helper Functions *****
  /** Function determining if the user can free this order or not
   *
   * @returns {boolean} - If it's possible to free a vial
   */
  canFree(){
    // TODO: add Hover message
    if (this.state.usingCalculator) return false;
    if (this.state.editingVials.size > 0) return false;
    if (this.state.selectedVials.size == 0) return false;
    if (this.state.addingVial) return false;

    return true;
  }
  /**
   * Check if vial is valid and can be type converted
   * Side effect: Formats input attributes to their correct types.
   * @param {Object} vial
   * @returns {boolean} - If the vial is acceptable
   */
  validateVial(vial){
    const errorMessages = [];
    if(vial.lot_number == "") {
      errorMessages.push(<p key="charge">Batch nummer er ikke tastet ind</p>);
    } else if(!batchNumberValidator(vial.lot_number)){
      errorMessages.push(<p key="charge">Batch nummer ikke i korrekt format</p>);
    }

    const fillTime = FormatTime(vial.fill_time)
    if(vial.fill_time == "") {
      errorMessages.push(<p key="time">produktions tidpunktet er ikke tastet ind</p>);
    } else if(fillTime == null){
      errorMessages.push(<p key="time">Tidspunktet er ikke formateret korrekt: HH:MM:SS</p>);
    } else {
      vial.fill_time = fillTime;
    }

    const volume = ParseDanishNumber(vial.volume);
    if (vial.volume == "") {
      errorMessages.push(<p key="volume">Volumen er ikke indtastet</p>);
    } else if(isNaN(volume)){
      errorMessages.push(<p key="volume">Volumen er ikke et tal</p>);
    } else if (volume < 0) {
      errorMessages.push(<p key="volume">Volumen kan ikke være negativ</p>);
    } else {
      vial.volume = volume;
    }

    const activity = ParseDanishNumber(vial.activity);
    if (vial.activity == "") {
      errorMessages.push(<p key="activity">Aktiviten er ikke indtastet</p>);
    } else if(isNaN(activity)){
      errorMessages.push(<p key="activity">Aktiviten er ikke et tal</p>);
    } else if (activity < 0) {
      errorMessages.push(<p key="activity">Aktiviten kan ikke være negativ</p>);
    } else {
      vial.activity = activity;
    }

    if(errorMessages.length){
      const errorMessage = <div>{errorMessages}</div>
      this.setState({
        ...this.state,
        errorMessage : errorMessage,
        errorLevel : ERROR_LEVELS.error
      });
      return false;
    } else {
      return true;
    }
  }

  // ***** Calculator Functions *****
  /**
   * Function called when the modal should start using the calculator
   */
  startCalculator(){
    this.setState({...this.state,
      usingCalculator : true
    })
  }

  /**
   * Function called when you want to stop using the calculator without any state change
   */
  cancelCalculator() {
    this.setState({...this.state,
      usingCalculator : false
    });
  }

  /**
   * Function called when you want to stop using the calculator with any state change
   * @param {Number} - NewActivity: The activity calculated from the calculator
   */
  commitCalculator(newActivity){
    const order = this.props.orders.get(this.props.order);
    if (order.status == 3){
      throw "HOW DID YOU EVEN MANAGE TO DO THIS?"
    }
    const customer = this.props.customers.get(order.BID);
    const newOverhead = newActivity * (1 + (customer.overhead / 100));
    const ghostActivity = order.total_amount - order.amount;
    const newTotal = newActivity + ghostActivity;
    const newTotalOverhead = newTotal * (1 + (customer.overhead / 100));
    const newOrder = {...order};

    newOrder.amount = newActivity;
    newOrder.amount_o = newOverhead;
    newOrder.total_amount = newTotal;
    newOrder.total_amount_o = newTotalOverhead;

    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    message[WEBSOCKET_DATA] = newOrder;

    this.props[PROP_WEBSOCKET].send(message);
    this.setState({
      usingCalculator : false
    });
  }

  // ***** Vial Functions *****
  /** Moves a Vial in or out of the selectedVials set in state
   *
   * @param {Number} vialID id of the vial being toggled
   * @returns {CallableFunction} - Function that responses to the event
   */
  toggleVial(vialID){
    const retFunc = (event) => {
      if(this.minimum_status == 3) {
        return
      }
      const selectedVials = new Set(this.state.selectedVials) //make a copy for new state
      if (selectedVials.has(vialID)){
        selectedVials.delete(vialID)
      } else {
        selectedVials.add(vialID)
      }
      this.setState({...this.state,
        selectedVials : selectedVials
      });
    }

    return retFunc;
  }

  // ##### New Vial Functions #####
  /**
   * Changes state such that the modal is allowing creation of a new vial
   */
  startAddingVial(){
    this.setState({
      ...this.state,
      addingVial : true,
    })
  }

  /**
   * Changes state such that the modal is no longer adding the vial without state change
   */
  stopAddingVial(){
    this.setState({
      ...this.state,
      addingVial : false,
      errorLevel : null,
      errorMessage : "",
      newVial : {
        charge : "",
        fill_time : "",
        volume : "",
        activity : "",
      }
    })
  }

  /**
   * Function called in response to the user pressing the "to create a vial"-button
   * @returns {void}
   */
  commitNewVial(){
    if(!this.validateVial(this.state.newVial)){
      return;
    }

    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot  = this.props[JSON_DELIVER_TIME].get(this.props[PROP_TIME_SLOT_ID]);
    const /**@type {DeliveryEndpoint } */ endpoint = this.props[JSON_ENDPOINT].get(timeSlot.destination)
    const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(endpoint.owner)


    const newVial = {};
    newVial[KEYWORD_Vial_ACTIVITY] = this.state.newVial.activity;
    newVial[KEYWORD_Vial_FILL_TIME] = this.state.newVial.fill_time;
    newVial[KEYWORD_Vial_VOLUME] = this.state.newVial.volume;
    newVial[KEYWORD_Vial_LOT_NUMBER] = this.state.newVial.lot_number;

    newVial.fill_date = dateToDateString(this.props[PROP_ACTIVE_DATE])
    newVial.owner = customer.id

    const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
    message[WEBSOCKET_DATA] = newVial;
    message[WEBSOCKET_DATATYPE] = JSON_VIAL;
    this.props[PROP_WEBSOCKET].send(message);
    this.setState({
      ...this.state,
      errorLevel : null,
      errorMessage : "",
      newVial : {
        lot_number : "",
        fill_time : "",
        volume : "",
        activity : "",
      },
      addingVial : false
    })
  }

  /**
   * Generates the onChange functions for the inputs to the new vial.
   * @param {String} key - Key determining which input function to generate
   * @returns {(event: event) => void} - Callable function that changes state based on user input
   */
  editAddingVial(key){
    // Okay I have a lot of repeated code here and it's by choice,
    // such that it's possible to easily add custom formatting to each input.
    if(key == "lot_number")
      return (event) => {
        const newState = {
          ...this.state
        };
        const newNewVial = {...this.state.newVial};
        newNewVial.lot_number = event.target.value;
        newState.newVial = newNewVial
        this.setState(newState);
      }

    if(key == "fill_time")
      return (event) => {
        const newState = {
          ...this.state
        };
        const newNewVial = {...this.state.newVial};
        if(this.state.newVial.fill_time.length < event.target.value.length &&
          (event.target.value.length == 2 || event.target.value.length == 5)){
            newNewVial.fill_time = event.target.value + ':';
        } else {
          newNewVial.fill_time = event.target.value;
        }
        newState.newVial = newNewVial
        this.setState(newState);
      }

    if(key == "volume")
      return (event) => {
        const newState = {
          ...this.state
        };
        const newNewVial = {...this.state.newVial};
        newNewVial.volume = event.target.value;
        newState.newVial = newNewVial
        this.setState(newState);
      }

    if(key == "activity")
      return (event) => {
        const newState = {
          ...this.state
        };
        const newNewVial = {...this.state.newVial};
        newNewVial.activity = event.target.value;
        newState.newVial = newNewVial
        this.setState(newState);
      }

    throw "unknown key!"
  }

  // ##### Edit Vial Functions #####
  /** creates a function to be called when the user wants to edit a vial
   *
   * @param {Number} vialID - ID of vial the user wants to edit
   * @returns {CallableFunction} - Function adds vial to editing
   */
  startEditVial(vialID) {
    const Vial = this.props[JSON_VIAL].get(vialID)

    const retFunc = () => {
      const newState = { ...this.state };
      const editingVials = new Map(this.state.editingVials);
      editingVials.set(vialID, Vial);
      newState.editingVials = editingVials;
      this.setState(newState);
    }
    return retFunc;
  }

  /** Creates a function to be called when the user want to discards edits
   *
   * @param {Number} VialID - ID of the vial the user want to discard
   * @returns {CallableFunction} - Function that discard vial from editing
   */
  rejectEditVial(VialID) {
    const retFunc = () => {
      const newState = { ...this.state };
      const editingVials = new Map(this.state.editingVials);
      editingVials.delete(VialID);
      newState.editingVials = editingVials;
      this.setState(newState);
    }
    return retFunc;
  }

  /**
   * Creates a function to be called, when the user is finished editing a vial and presses the finish button
   * @param {Number} VialID - Vial in question
   * @returns {CallableFunction}
   */
  commitEditVial(vialID) {
    const retFunc = (event) => {
      const vial = this.state.editingVials.get(vialID);
      if(!this.validateVial(vial)){ // Side Effect: Reformats input as correct types
        return;
      }

      const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_EDIT);
      message[WEBSOCKET_DATATYPE] = JSON_VIAL;
      message[WEBSOCKET_DATA] = vial;

      this.props[PROP_WEBSOCKET].send(message);
      const newEditVials = new Map(this.state.editingVials);
      newEditVials.delete(vialID);
      this.setState({
        ...this.state,
        editingVials : newEditVials
      });
    }
    return retFunc
  }

  editVial(vialID, key){
    if(key == "lot_number")
    return (event) => {
      const editVial = {...this.state.editingVials.get(vialID)};
      const newEditingVials = new Map(this.state.editingVials);
      editVial.lot_number = event.target.value;
      newEditingVials.set(vialID, editVial);
      this.setState({
        ...this.state,
        editingVials : newEditingVials
      });
    }

  if(key == "fill_time")
    return (event) => {
      const /**@type {Vial} */ editVial = {...this.state.editingVials.get(vialID)};
      if(editVial.fill_time.length < event.target.value.length &&
        (event.target.value.length == 2 || event.target.value.length == 5)){
          editVial.fill_time = event.target.value + ':';
      } else {
        editVial.fill_time = event.target.value;
      }
      const newEditingVials = new Map(this.state.editingVials);
      newEditingVials.set(vialID, editVial);
      this.setState({
        ...this.state,
        editingVials : newEditingVials
      });
    }

  if(key == "volume")
    return (event) => {
      const editVial = {...this.state.editingVials.get(vialID)};
      const newEditingVials = new Map(this.state.editingVials);
      editVial.volume = event.target.value;
      newEditingVials.set(vialID, editVial);
      this.setState({
        ...this.state,
        editingVials : newEditingVials
      });
    }

  if(key == "activity")
    return (event) => {
      const editVial = {...this.state.editingVials.get(vialID)};
      const newEditingVials = new Map(this.state.editingVials);
      editVial.activity = event.target.value;
      newEditingVials.set(vialID, editVial);
      this.setState({
        ...this.state,
        editingVials : newEditingVials
      });
    }

  throw "unknown key!";
  }

  /**
   * This function is called to change the modal to an Authentication mode
   * This function is called from the status 2 Modal indicating, that the manager
   * should render the authentication component instead of the status2 modal.
   */
  startFreeingOrder(){
    // ***** warnings *****
    const today = new Date();
    const /**@type {Array<ActivityOrder>} */ orders = this.props[PROP_ORDER_MAPPING].get(this.props[PROP_TIME_SLOT_ID]);
    let date_mismatch = false;

    for(const order of orders){
      const orderDate = new Date(order.delivery_date);
      date_mismatch |= (!compareDates(today, orderDate))
    }
    if(date_mismatch){
      this.setState({
        isFreeing : true,
        errorMessage : "Bemærk Du er i gang med at frigive en ordre, der ikke er til i dag!",
        errorLevel : ERROR_LEVELS.hint,
      });
      return;
    }

    this.setState({
      ...this.state,
      isFreeing : true
    });
  }

  cancelFreeing(){
    this.setState({
      ...this.state,
      errorMessage : "",
      errorLevel : null,
      isFreeing : false
    });
  }

  onClickAccept(){
    const orders = this.props[PROP_ORDER_MAPPING].get(this.props[PROP_TIME_SLOT_ID]);
    const modified_orders = []
    for(const order of orders){
      if (order.status == 1){
        order.status = 2
        modified_orders.push(order)
      }
    }
    if(modified_orders.length == 0){
      return;
    }

    this.props[PROP_WEBSOCKET].sendEditModel(JSON_ACTIVITY_ORDER, modified_orders)
  }


  /**
   * Injected method to the authenticate object. Called when the user wish to free an order
   * @param {string} username - Inputted Username of the user
   * @param {*} password - Inputted Password of the user
   */
  async onFree(username, password){
    const /**@type {Array<ActivityOrder>} */ orders = this.props[PROP_ORDER_MAPPING].get(this.props[PROP_TIME_SLOT_ID])
    const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_FREE_ACTIVITY);
    const data = {};
    const orderIDs = []
    for(const order of orders){
      orderIDs.push(order.id)
    }
    data[JSON_DELIVER_TIME] = this.props[PROP_TIME_SLOT_ID]
    data[JSON_ACTIVITY_ORDER] = orderIDs
    data[JSON_VIAL] = [...this.state.selectedVials];
    message[WEBSOCKET_DATA] = data;
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[JSON_AUTH] = auth;
    this.props[PROP_WEBSOCKET].send(message).then((data) =>{
      if (data[AUTH_IS_AUTHENTICATED]){
        this.setState({...this.state,
          isFreeing : false,
          errorMessage : "",
          errorLevel : null,
        });
      } else {
        this.setState({...this.state,
          errorMessage : "Forkert login",
          errorLevel : ERROR_LEVELS.error,
        });
      }
    });
  }

  /**
   * This function is called when the user presses "Se føgleseddel"
   */
  onClickToPDF(){
    const order    = this.props.orders.get(this.props.order);
    const customer = this.props.customers.get(order.BID);
    const username = customer.UserName;
    const year     = order.deliver_datetime.substring(0,4);
    const month    = order.deliver_datetime.substring(5,7);
    const pdfID    = order.COID == -1 ? order.oid : order.COID;
    const path     = `pdfs/${username}/${year}/${month}/${pdfID}`;
    window.location.href = path;
  }

  // Render Functions
    /**
   * Creates the top table with basic order information
   * @returns {JSX.Element}
   */
  renderDescriptionTable(){
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot  = this.props[JSON_DELIVER_TIME].get(this.props[PROP_TIME_SLOT_ID]);
    const /**@type {Array<ActivityOrder>} */ orders = this.props[PROP_ORDER_MAPPING].get(this.props[PROP_TIME_SLOT_ID]);
    const /**@type {DeliveryEndpoint } */ endpoint = this.props[JSON_ENDPOINT].get(timeSlot.destination)
    const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(endpoint[KEYWORD_DeliveryEndpoint_OWNER])
    const /**@type {Number} */ overhead = this.props[PROP_OVERHEAD_MAP].get(customer.id);
    const /**@type {Tracer} */ tracer = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER])
    const /**@type {Isotope} */ isotope = this.props[JSON_ISOTOPE].get(tracer.isotope)

    let minimum_status = 5;
    let activity = 0;
    let freed_time = null
    let commentString = "";
    let orderIDs = []

    for(const order of orders) {
      if(order.moved_to_time_slot === null){
        activity += order.ordered_activity * overhead;
      } else {
        const /**@type {ActivityDeliveryTimeSlot} */ originalTimeSlot = this.props[JSON_DELIVER_TIME].get(order.ordered_time_slot);
        const timeDelta = compareTimeStamp(originalTimeSlot.delivery_time, timeSlot.delivery_time);
        activity += CalculateProduction(isotope.halflife_seconds, timeDelta.hour * 60 + timeDelta.minute, order.ordered_activity) * overhead;
      }

      minimum_status = Math.min(minimum_status, order.status)

      if (order.comment){
        commentString += `Orderer ${order.id} - ${order.comment}\n`;
      }
      if (freed_time === null && order.freed_datetime){
        freed_time = order.freed_datetime;
      }

      let rowIcon = <StatusIcon status={order.status}/>
      if (order.moved_to_time_slot){
        rowIcon = <ClickableIcon src="/static/images/move_top.svg"/>
      }

      orderIDs.push(
        <OrderRow
          key={order.id}
          order={order}
          timeSlotId={this.props[PROP_TIME_SLOT_ID]}
          timeSlots={this.props[JSON_DELIVER_TIME]}
          websocket={this.props[PROP_WEBSOCKET]}
        />)
    }

    const destinationHover = <HoverBox
      Base={<div>Destination:</div>}
      Hover={<div>Kundens brugernavn, rigtige navn og <br/>
        bestillerens profil, hvis tilgændelig.</div>}
    />;
    const destinationMessage = `${customer.long_name} - ${endpoint.name}`
    const formattedOrderTime = `${timeSlot.delivery_time}`

    const activityTableCellEditable = <Row>
      <Col md={10} className="p-2">{Math.floor(activity)}</Col>
    </Row>

    const activityHover = <HoverBox
        Base={<div>Bestilt Aktivitet</div>}
        Hover={<div>Den mængde af aktivit kunden ønsket ved denne ordre. <br/>
        Ikke korrigeret for andre ordre eller eventuel overhead.</div>}/>

    const activityTableCellEditing = <Col md="auto" >
        <FormControl value={this.state.activityValue} onChange={changeState("activityValue", this)}/>
        <ClickableIcon src={"/static/images/accept.svg"} onClick={this.acceptNewActivity}/>
      </Col>

    const activityTableCellFixed = <div>{Math.floor(activity)}</div>

    const canEdit = (minimum_status == 1 || minimum_status == 2) && !this.state.isFreeing;
    let activityTableCell;
    if (!canEdit) {
      activityTableCell = activityTableCellFixed;
    } else if (this.state.editingActivity){
      activityTableCell = activityTableCellEditing
    } else {
      activityTableCell = activityTableCellEditable
    }

    const totalActivityHover = <HoverBox
      Base={<div>Total Aktivitet</div>}
      Hover={<div>Mængde af aktivitet der skal produceres til ordren.</div>}
    />;


    const hasAllocation = minimum_status == 2 || minimum_status == 3;
    const allocationMessage = minimum_status == 2 ?
                      "Allokeret aktivitet:"
                    : "Frigivet aktivitet:";
    var allocationTotal = 0;
    for(const vid of this.state.selectedVials.values()){
      const /**@type {Vial} */ vial = this.props[JSON_VIAL].get(vid);
      allocationTotal += vial.activity;
    }


    return (
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
        <Col>{orderIDs.length == 1 ? "Order" : "Ordre" }</Col>
        <Col>{orderIDs}</Col>
      </Row>
      <hr/>
      <Row>
        <Col>{totalActivityHover}</Col>
        <Col>{Math.floor(activity)} MBq</Col>
      </Row>
      <hr/>
      <Row>
        <Col>{allocationMessage}</Col>
        <Col>{allocationTotal} MBq</Col>
      </Row>
      <hr/>
    </Row>)
  }


  renderVialTable(){
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = this.props[JSON_DELIVER_TIME].get(this.props[PROP_TIME_SLOT_ID]);
    const /**@type {ActivityProduction} */ production = this.props[JSON_PRODUCTION].get(timeSlot.production_run)
    const /**@type {Array<ActivityOrder>} */ orders = this.props[PROP_ORDER_MAPPING].get(timeSlot.id);
    const orderIDs = []
    let minimum_status = 5
    for (const order of orders){
      orderIDs.push(order.id)
      minimum_status = Math.min(minimum_status, order.status)
    }
    const today = new Date(this.props[PROP_ACTIVE_DATE]);
    const tableVials = [];

    for(const [_vialID, _vial] of this.props[JSON_VIAL]){
      const /**@type {Number} */ vialID = _vialID
      const /**@type {Vial}*/ vial = _vial
      const vial_date = new Date(vial.fill_date)
      if (!compareDates(today, vial_date)){
        continue;
      }
      if(vial.assigned_to != null && (!orderIDs.includes(vial.assigned_to)) ){
        continue
      }


      const selected = this.state.selectedVials.has(vialID);
      const editing = this.state.editingVials.has(vialID);
      const freeing = this.state.isFreeing;

      let editButton;
      let useButton;

      if (freeing || minimum_status === 3){
        editButton = <div/>
        useButton = <Form.Check // If select you can unselect it
          id={`vial-usage-${vial.id}`}
          disabled
          checked={selected}
        />
      }
      else if(editing){
        editButton = <ClickableIcon  // Accept Edits
        src={"/static/images/accept.svg"}
        altText={`accept-${vialID}`}
          onClick={this.commitEditVial(vialID).bind(this)}
        />;
        useButton = <ClickableIcon  // Reject Edits
        src={"/static/images/decline.svg"}
        altText={`decline-${vialID}`}
        onClick={this.rejectEditVial(vialID).bind(this)}
        />;
      } else {
        if(selected) {
          editButton = <div></div> // If selected you cannot vial
        } else {
          editButton = <ClickableIcon // Start editing
          src={"/static/images/pen.svg"}
          label={`edit-vial-${vialID}`}
          onClick={this.startEditVial(vialID).bind(this)}
          />;
        }
        useButton = <Form.Check  // Select TVeVial(VialID)).bind(this)}
          aria-label={`vial-usage-${vial.id}`}
          onChange={this.toggleVial(vialID).bind(this)}
          checked={selected}
        />
      }

      if(editing){
        const /**@type {Vial} */ temp_vial = this.state.editingVials.get(vialID)

        tableVials.push(renderTableRow(
          vialID, [
            temp_vial.id,
            <FormControl aria-label={`lot_number-${vialID}`} onChange={this.editVial(temp_vial.id, "lot_number").bind(this)} value={temp_vial.lot_number}/>,
            <FormControl aria-label={`fill_time-${vialID}`} onChange={this.editVial(temp_vial.id, "fill_time").bind(this)} value={temp_vial.fill_time}/>,
            <FormControl aria-label={`volume-${vialID}`} onChange={this.editVial(temp_vial.id, "volume").bind(this)} value={temp_vial.volume}/>,
            <FormControl aria-label={`activity-${vialID}`} onChange={this.editVial(temp_vial.id, "activity").bind(this)} value={temp_vial.activity}/>,
            editButton,
            useButton
          ]));
        } else {
          tableVials.push(renderTableRow(
            vialID, [
            vial.id,
            vial.lot_number,
            vial.fill_time,
            vial.volume,
            vial.activity,
            editButton,
            useButton
        ]));
      }
    }
     // End Vial iteration

    if(this.state.addingVial){
      tableVials.push(renderTableRow(-1,[
        "Ny",
        <FormControl aria-label={`lot_number-new`} onChange={this.editAddingVial("lot_number").bind(this)} value={this.state.newVial.lot_number}/>,
        <FormControl aria-label={`fill_time-new`} onChange={this.editAddingVial("fill_time").bind(this)} value={this.state.newVial.fill_time}/>,
        <FormControl aria-label={`volume-new`} onChange={this.editAddingVial("volume").bind(this)} value={this.state.newVial.volume}/>,
        <FormControl aria-label={`activity-new`} onChange={this.editAddingVial("activity").bind(this)} value={this.state.newVial.activity}/>,
        <ClickableIcon label={"accept-new"} src={"/static/images/plus.svg"} onClick={this.commitNewVial.bind(this)}/>,
        <ClickableIcon label={"decline-new"} src={"/static/images/decline.svg"} onClick={this.stopAddingVial.bind(this)}/>
      ]));
    }

    return (
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
          {tableVials}
        </tbody>
      </Table>
      <div className="flex-row-reverse d-flex">
        {(this.state.addingVial || this.state.isFreeing) ? "" :
          <div>{<ClickableIcon label="add-new-vial" src={"/static/images/plus.svg"} onClick={this.startAddingVial.bind(this)}/>}</div>}
      </div>
    </div>)
  }


  renderButtonGroup() {
    const orders = this.props[PROP_ORDER_MAPPING].get(this.props[PROP_TIME_SLOT_ID])
    let minimum_status = 5

    for(const order of orders){
      minimum_status = Math.min(minimum_status, order[KEYWORD_ActivityOrder_STATUS])
    }

    const AcceptButton =  <MarginButton onClick={this.onClickAccept.bind(this)}>Accepter Ordre</MarginButton>;
    const ConfirmButton = this.canFree() ? <MarginButton onClick={this.startFreeingOrder.bind(this)}>Godkend Ordre</MarginButton>
      : <MarginButton disabled onClick={this.startFreeingOrder.bind(this)}>Godkend Ordre</MarginButton>;

    const CancelFreeButton = <MarginButton onClick={this.cancelFreeing.bind(this)}>Rediger Ordre</MarginButton>
    const PDFButton =        <MarginButton onClick={this.onClickToPDF.bind(this)}>Se føgleseddel</MarginButton>;

    return (<div>
              {!this.state.usingCalculator && minimum_status == 1 ? AcceptButton : "" }
              {!this.state.usingCalculator && minimum_status == 2 && !this.state.isFreeing ? ConfirmButton : ""}
              {!this.state.usingCalculator && minimum_status == 2 && this.state.isFreeing ? CancelFreeButton : ""}
              {minimum_status == 3 ? PDFButton : ""}
              <CloseButton onClick={this.props[PROP_ON_CLOSE]}/>
      </div>
    );
  }


  render() {
    const colWidth = (this.state.usingCalculator || this.state.isFreeing) ? 6 : 12;
    const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = this.props[JSON_DELIVER_TIME].get(this.props[PROP_TIME_SLOT_ID])
    const /**@type {ActivityProduction} */ production = this.props[JSON_PRODUCTION].get(timeSlot.production_run);
    const /**@type {Array<ActivityOrder}*/ orders = this.props[PROP_ORDER_MAPPING].get(timeSlot.id)

    let sideElement = <div></div>;
    if(this.state.usingCalculator){
      const initial_MBq = Number(order.amount);
      sideElement = (<Col md={6}>
        <Calculator
          initial_MBq={initial_MBq}
          cancel={this.cancelCalculator.bind(this)}
          commit={this.commitCalculator.bind(this)}
          defaultMBq={Number(300)}
          isotopes={this.props[JSON_ISOTOPE]}
          productionTime={deliver_datetime}
          tracer={this.props[JSON_TRACER].get(production.tracer)}
        />
      </Col>)
    } else if (this.state.isFreeing){
      const orderIDs = []

      for(const order of orders){
        orderIDs.push(order.id)
      }

      sideElement = (<Col md={6}>
        <Authenticate
          authenticate={this.onFree.bind(this)}
          errorMessage={this.state.loginMessage}
          fit_in={false}
          headerMessage={`Frigiv Ordre - ${orderIDs.join(', ')}`}
          spinner={this.state.loginSpinner}
          buttonMessage={"Frigiv Ordre"}
        />
      </Col>)
    }

    return(
    <Modal
      data-testid="test"
      show={true}
      size="lg"
      onHide={this.props[PROP_ON_CLOSE]}
      className={styles.mariLight}>
      <Modal.Header>Ordre - {parseDateToDanishDate(dateToDateString(this.props[PROP_ACTIVE_DATE]))} - {timeSlot.delivery_time} </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={colWidth}>
            {this.renderDescriptionTable()}
          </Col>
          {sideElement}
        </Row>
        {this.state.errorLevel != null ? <AlertBox
          level={this.state.errorLevel}
          message={this.state.errorMessage}/> : ""}
        <Row>
          {this.renderVialTable()}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        {this.renderButtonGroup()}
      </Modal.Footer>
    </Modal>)
  }
}
