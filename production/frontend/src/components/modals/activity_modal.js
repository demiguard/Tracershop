import React, { Component } from "react";
import propTypes from 'prop-types'
import { Button, ButtonGroup, Col, Form, FormControl, Modal, Row, Table } from "react-bootstrap";

import { ERROR_LEVELS, AlertBox } from "../injectable/alert_box.js";
import styles from '../../css/Site.module.css'
import { renderTableRow } from "../../lib/rendering.js";
import { changeState, toggleState } from "../../lib/state_management.js";
import { Calculator } from "../injectable/calculator.js";
import Authenticate from "../injectable/authenticate.js";
import { HoverBox } from "../injectable/hover_box";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { ClickableIcon } from "../injectable/icons.js";
import { compareDates as compareDates } from "../../lib/utils.js";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, JSON_ACTIVITY_ORDER, JSON_AUTH, JSON_VIAL, WEBSOCKET_DATA,
  WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_EDIT_STATE,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY } from "../../lib/constants.js";
import { batchNumberValidator, FormatTime, ParseDanishNumber } from "../../lib/formatting.js";

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
    charge : "",
    filltime : "",
    volume : "",
    activity : "",
  }
}



class ActivityModal extends Component {
  static propTypes = {
    customers: propTypes.instanceOf(Map).isRequired,
    isotopes : propTypes.instanceOf(Map).isRequired,
    tracers  : propTypes.instanceOf(Map).isRequired,
    order    : propTypes.number.isRequired,
    orders   : propTypes.instanceOf(Map).isRequired,
    vials    : propTypes.instanceOf(Map).isRequired,
  }

  constructor(props){
    super(props);
    const order = this.props.orders.get(this.props.order);
    const state = initial_state;
    state.activityValue = order.amount;
    if (order.status == 3) for (const [_, vial] of this.props.vials){
      if(vial.order_id == order.oid){
        state.selectedVials.add(vial.ID)
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
    var errorMessages = [];
    if(vial.charge == "") {
      errorMessages.push(<p key="charge">Batch nummer er ikke tastet ind</p>);
    } else if(!batchNumberValidator(vial.charge)){
      errorMessages.push(<p key="charge">Batch nummer ikke i korrekt format</p>);
    }

    const fillTime = FormatTime(vial.filltime)
    if(vial.filltime == "") {
      errorMessages.push(<p key="time">produktions tidpunktet er ikke tastet ind</p>);
    } else if(fillTime == null){
      errorMessages.push(<p key="time">Tidspunktet er ikke formateret korrekt: HH:MM:SS</p>);
    } else {
      vial.filltime = fillTime;
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
    })
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

    this.props.websocket.send(message);
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
        filltime : "",
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

    const order = this.props.orders.get(this.props.order);
    const customer = this.props.customers.get(order.BID)

    const newVial = this.state.newVial;
    newVial.filldate = order.deliver_datetime.substring(0, 10);
    newVial.customer = customer.kundenr

    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
    message[WEBSOCKET_DATA] = newVial;
    message[WEBSOCKET_DATATYPE] = JSON_VIAL;
    this.props.websocket.send(message);
    this.setState({
      ...this.state,
      errorLevel : null,
      errorMessage : "",
      newVial : {
        charge : "",
        filltime : "",
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
    if(key == "charge")
      return (event) => {
        const newState = {
          ...this.state
        };
        const newNewVial = {...this.state.newVial};
        newNewVial.charge = event.target.value;
        newState.newVial = newNewVial
        this.setState(newState);
      }

    if(key == "filltime")
      return (event) => {
        const newState = {
          ...this.state
        };
        const newNewVial = {...this.state.newVial};
        if(this.state.newVial.filltime.length < event.target.value.length &&
          (event.target.value.length == 2 || event.target.value.length == 5)){
            newNewVial.filltime = event.target.value + ':';
        } else {
          newNewVial.filltime = event.target.value;
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
    const Vial = this.props.vials.get(vialID)
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

      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
      message[WEBSOCKET_DATATYPE] = JSON_VIAL;
      message[WEBSOCKET_DATA] = vial;

      this.props.websocket.send(message);
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
    if(key == "charge")
    return (event) => {
      const editVial = {...this.state.editingVials.get(vialID)};
      const newEditingVials = new Map(this.state.editingVials);
      editVial.charge = event.target.value;
      newEditingVials.set(vialID, editVial);
      this.setState({
        ...this.state,
        editingVials : newEditingVials
      });
    }

  if(key == "filltime")
    return (event) => {
      const editVial = {...this.state.editingVials.get(vialID)};
      if(editVial.filltime.length < event.target.value.length &&
        (event.target.value.length == 2 || event.target.value.length == 5)){
          editVial.filltime = event.target.value + ':';
      } else {
        editVial.filltime = event.target.value;
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

  throw "unknown key!"
  }

  /**
   * This function is called to change the modal to an Authentication mode
   * This function is called from the status 2 Modal indicating, that the manager
   * should render the authentication component instead of the status2 modal.
   */
  startFreeingOrder(){
    // ***** warnings *****
    const today = new Date();
    const order = this.props.orders.get(this.props.order)

    const orderDate = new Date(order.deliver_datetime);
    if(!compareDates(today, orderDate)){
      this.setState({
        isFreeing : true,
        errorMessage : "Bemærk Du er i gang med at frigive en ordre, der ikke er til i dag!",
        errorLevel : ERROR_LEVELS.hint,
      })
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
    const order = {...this.props.orders.get(this.props.order)}
    order.status = 2;
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
    message[WEBSOCKET_DATA] = order;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    this.props.websocket.send(message);
  }


  /**
   * Injected method to the authenticate object. Called when the user wish to free an order
   * @param {string} username - Inputted Username of the user
   * @param {*} password - Inputted Password of the user
   */
  async onFree(username, password){
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_FREE_ACTIVITY);
    const data = {};
    data[JSON_ACTIVITY_ORDER] = this.props.order;
    data[JSON_VIAL] = [...this.state.selectedVials];
    message[WEBSOCKET_DATA] = data;
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[JSON_AUTH] = auth;
    this.props.websocket.send(message).then((data) =>{
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
  renderButtonGroup() {
    const order = this.props.orders.get(this.props.order);
    const customer = this.props.customers.get(order.BID);

    const AcceptButton =  <MarginButton onClick={this.onClickAccept.bind(this)}>Accepter Ordre</MarginButton>;
    const ConfirmButton = this.canFree() ? <MarginButton onClick={this.startFreeingOrder.bind(this)}>Godkend Ordre</MarginButton>
      : <MarginButton disabled onClick={this.startFreeingOrder.bind(this)}>Godkend Ordre</MarginButton>;

    const CancelFreeButton = <MarginButton onClick={this.cancelFreeing.bind(this)}>Rediger Ordre</MarginButton>
    const PDFButton =        <MarginButton onClick={this.onClickToPDF.bind(this)}>Se føgleseddel</MarginButton>;

    return (<div>
              {!this.state.usingCalculator && order.status == 1 ? AcceptButton : "" }
              {!this.state.usingCalculator && order.status == 2 && !this.state.isFreeing ? ConfirmButton : ""}
              {!this.state.usingCalculator && order.status == 2 && this.state.isFreeing ? CancelFreeButton : ""}
              {order.status == 3 ? PDFButton : ""}
              <CloseButton onClick={this.props.onClose} />
      </div>
    );
  }

  renderVialTable(){
    const order = this.props.orders.get(this.props.order);
    const orderDate = order.deliver_datetime.substring(0,10);
    const customer = this.props.customers.get(order.BID);
    const tableVials = []
    for(var [vialID, vial] of this.props.vials){
      if (vial.customer != customer.kundenr || vial.filldate != orderDate){
        continue
      }
      const selected = this.state.selectedVials.has(vialID);
      const editing = this.state.editingVials.has(vialID);
      const freeing = this.state.isFreeing;


      var editButton;
      var useButton;

      if (freeing){
        editButton = <div/>
        useButton = <Form.Check // If select you can unselect it
          id={`vial-usage-${vial.ID}`}
          disabled
        />
      }
      else if(editing){
        editButton = <ClickableIcon  // Accept Edits
          src={"/static/images/accept.svg"}
          altText={"Accept"}
          onClick={this.commitEditVial(vialID).bind(this)}
        />;
        useButton = <ClickableIcon  // Reject Edits
        src={"/static/images/decline.svg"}
        altText={"decline"}
        onClick={this.rejectEditVial(vialID).bind(this)}
      />;
      } else {
        if(selected) {
          editButton = <div></div> // If selected you cannot vial
        } else {
          editButton = <ClickableIcon // Start editing
            src={"/static/images/pen.svg"}
            altText="rediger"
            onClick={this.startEditVial(vialID).bind(this)}
          />;
        }
        useButton = <Form.Check  // Select TVeVial(VialID)).bind(this)}
          id={`vial-usage-${vial.ID}`}
          onChange={this.toggleVial(vialID).bind(this)}
        />
      }

      if(editing){
        vial = this.state.editingVials.get(vialID)

        tableVials.push(renderTableRow(
          vialID, [
            vial.ID,
            <FormControl onChange={this.editVial(vial.ID, "charge").bind(this)} value={vial.charge}/>,
            <FormControl onChange={this.editVial(vial.ID, "filltime").bind(this)} value={vial.filltime}/>,
            <FormControl onChange={this.editVial(vial.ID, "volume").bind(this)} value={vial.volume}/>,
            <FormControl onChange={this.editVial(vial.ID, "activity").bind(this)} value={vial.activity}/>,
            editButton,
            useButton
          ]));
      } else {
        tableVials.push(renderTableRow(
          vialID, [
          vial.ID,
          vial.charge,
          vial.filltime,
          vial.volume,
          vial.activity,
          editButton,
          useButton
        ]));
      }
    } // End Vial iteration

    if(this.state.addingVial){
      tableVials.push(renderTableRow(-1,[
        "Ny",
        <FormControl onChange={this.editAddingVial("charge").bind(this)} value={this.state.newVial.charge}/>,
        <FormControl onChange={this.editAddingVial("filltime").bind(this)} value={this.state.newVial.filltime}/>,
        <FormControl onChange={this.editAddingVial("volume").bind(this)} value={this.state.newVial.volume}/>,
        <FormControl onChange={this.editAddingVial("activity").bind(this)} value={this.state.newVial.activity}/>,
        <ClickableIcon src={"/static/images/plus.svg"} onClick={this.commitNewVial.bind(this)}/>,
        <ClickableIcon src={"/static/images/decline.svg"} onClick={this.stopAddingVial.bind(this)}/>
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
        {(this.state.addingVial || this.state.isFreeing) ? "" : <div>{<ClickableIcon src={"/static/images/plus.svg"} onClick={this.startAddingVial.bind(this)}/>}</div>}
      </div>
    </div>)
  }

  /**
   * Creates the top table with basic order information
   * @returns {JSX.Element}
   */
  renderDescriptionTable(){
    const order = this.props.orders.get(this.props.order);
    const customer = this.props.customers.get(order.BID);
    const destinationHover = <HoverBox
      Base={<div>Destination:</div>}
      Hover={<div>Kundens brugernavn, rigtige navn og <br/>
        bestillerens profil, hvis tilgændelig.</div>}
    />;
    const destinationMessage = order.username ?
                                `${customer.UserName} - ${customer.Realname} - ${order.username}` :
                                `${customer.UserName} - ${customer.Realname}`;
    const formattetOrderTime = `${order.deliver_datetime.substring(11,13)
    }:${order.deliver_datetime.substring(14,16)} - ${order.deliver_datetime.substring(8,10)
    }/${order.deliver_datetime.substring(5,7)}/${order.deliver_datetime.substring(0,4)} - Kørsel ${order.run}`;

    const activityTableCellEditable = <Row>
      <Col md={10} className="p-2">{Math.floor(order.amount)}</Col>
      {this.state.usingCalculator ? "" :
        <Col md={2} className="p-2">{<ClickableIcon
                                      src={"/static/images/calculator.svg"}
                                      onClick={this.startCalculator.bind(this)}/>}
        </Col>}
    </Row>

    const activityHover = <HoverBox
        Base={<div>Bestilt Aktivitet</div>}
        Hover={<div>Den mængde af aktivit kunden ønsket ved denne ordre. <br/>
        Ikke korrigeret for andre ordre eller eventuel overhead.</div>}/>

    const activityTableCellEditing = <Col md="auto" >
        <FormControl value={this.state.activityValue} onChange={changeState("activityValue", this)}/>
        <ClickableIcon src={"/static/images/accept.svg"} onClick={this.acceptNewActivity}/>
      </Col>

    const activityTableCellFixed = <div>{Math.floor(order.amount)}</div>

    const canEdit = (order.status == 1 || order.status == 2) && !this.state.isFreeing;
    var activityTableCell;
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

    const totalActivity = Math.floor(
      order.total_amount * (1 + customer.overhead / 100));

    const hasAllocation = (order.status == 2) || (order.status == 3);
    const allocationMessage = order.status == 2 ?
                      "Allokeret aktivitet:"
                    : "Frigivet aktivitet:";
    var allocationTotal = 0;
    for(const vid of this.state.selectedVials.values()){
      const vial = this.props.vials.get(vid);
      allocationTotal += vial.activity;
    }

    const AllocationRow = renderTableRow(
      "5",
      [allocationMessage, Math.floor(allocationTotal)]
    )

    const freedTime = order.frigivet_datetime != undefined ? `${order.frigivet_datetime.substring(11,13)
    }:${order.frigivet_datetime.substring(14,16)} - ${order.frigivet_datetime.substring(8,10)
    }/${order.frigivet_datetime.substring(5,7)}/${order.frigivet_datetime.substring(0,4)}` : null

    const TableRows = [
      renderTableRow("1", [destinationHover, destinationMessage]),
      renderTableRow("2", ["Levering tidspunkt:", formattetOrderTime]),
      renderTableRow("3", [activityHover, activityTableCell]),
      renderTableRow("4", [totalActivityHover, totalActivity]),
    ]

    if (hasAllocation) TableRows.push(AllocationRow);
    if (freedTime != null) TableRows.push(
      renderTableRow("6", ["Frigivet tidspunkt:", freedTime])
    );
    if (order.comment != undefined) TableRows.push(
      renderTableRow("99", ["Kommentar:", order.comment])
    )

    return (<Table>
              <tbody>
                {TableRows}
              </tbody>
            </Table>);
  }


  render() {
    const order = this.props.orders.get(this.props.order);
    const colWidth = (this.state.usingCalculator || this.state.isFreeing) ? 6 : 12;

    const deliver_datetime = new Date(order.deliver_datetime)
    var sideElement = <div></div>;
    if(this.state.usingCalculator){
      sideElement = (<Col md={6}>
        <Calculator
          cancel={this.cancelCalculator.bind(this)}
          commit={this.commitCalculator.bind(this)}
          defaultMBq={300}
          isotopes={this.props.isotopes}
          productionTime={deliver_datetime}
          tracer={this.props.tracers.get(order.tracer)}
          initial_MBq={Number(order.amount)}
        />
      </Col>)
    } else if (this.state.isFreeing){
      sideElement = (<Col md={6}>
        <Authenticate
          authenticate={this.onFree.bind(this)}
          errorMessage={this.state.loginMessage}
          fit_in={false}
          headerMessage={`Frigiv Ordre - ${order.oid}`}
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
      onHide={this.props.onClose}
      className={styles.mariLight}>
      <Modal.Header>Ordre {order.oid}</Modal.Header>
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
