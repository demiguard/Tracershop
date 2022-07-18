import React, { Component } from "react";
import { Modal, Button, Row, Container, Table, FormControl } from "react-bootstrap";
import { JSON_VIAL, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../lib/constants";
import { renderClickableIcon,renderTableRow } from "../../lib/Rendering";
import { changeState } from "../../lib/stateManagement";
import { addCharacter } from "../../lib/utils";
import { FormatTime, ParseDanishNumber, FormatDateStr } from "/src/lib/formatting";
import { autoAddCharacter } from "/src/lib/utils";


export { ActivityModalStatus2 }

const initial_state = {
  ErrorMessage : "",

  EditingVials : new Map(),

  CreatingVial : false,
  newCharge : "",
  newFillTime : "",
  newVolume : "",
  newActivity : "",
  ErrorMessage :"",
};


/** This class renders a Modal for an order with status two.
 * The purpose of the modal is select the vial to be freed with the given order
 *
 * Props:
 *  show  - Boolean - Should the modal be shown or not?
 *  Order - Obejct - The order to be rendered
 *  customer - Object - The customer related to the order
 *  onClose - func - Function that closes the modal
 *  vials - Map<int,Obejcts> - A mapping with all vials.
 *  editVial - func - Function that communicates an edit to a vial.
 *  createVial - func - Function that creates a vial on the backend
 *  selectedVials - Set - Set of vials, that should be associated with this order
 *  toggleVial - func - Function called when a given vial is toggled in the selectedVials
 *  Authenticate - func - Function called when the modal is ready to be confirmed
 *
 *  @author Christoffer Vilstrup Jensen
 */
export default class ActivityModalStatus2 extends Component {
  constructor(props){
    super(props);

    this.state = initial_state;
  }

  // ********* State Update Functions ********* //
  CloseModal(){
    this.setState(initial_state);
    this.props.onClose();
  }

  StopCreatingNewVial(){
    this.setState({...this.state,
      CreatingVial : false,
      newCharge : "",
      newFillTime : "",
      newVolume : "",
      newActivity : "",
      ErrorMessage :""
    })
  }

  initializeNewVial(){
    this.setState({
      ...this.state,
      CreatingVial : true,
      newBatch : "",
      newFillTime : "",
      newVolume : "",
      newActivity : "",
    });
  }

  changeNewFieldTime(event){
    const newState = {...this.state};
    newState.newFillTime = autoAddCharacter(event, ":", new Set([2,5]), this.state.newFillTime);

    this.setState(newState);
  }

  // ********* Vial Functions ********** //

  /*
  * This Function checks that the current new Vial is ok,
  * then calls the prop function for creating new vials.
  *
  */
  createNewVial(){
    var ErrorInInput = false;
    var NewErrorMessage = "";

    if (!this.state.newCharge){
      ErrorInInput = true;
      NewErrorMessage += "Der er ikke skrevet Noget Batch Nummer.\n"
    }
    const NewActivity = ParseDanishNumber(this.state.newActivity)
    if (isNaN(NewActivity)){
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset skal være et tal.\n"
    } else if ( NewActivity <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset Kan ikke være negativ.\n"
    }
    const NewVolume = ParseDanishNumber(this.state.newVolume)
    if (isNaN(NewVolume)){
      ErrorInInput = true;
      NewErrorMessage += "Volumen skal være et tal.\n"
    } else if ( NewVolume <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Volumen kan ikke være negativ.\n"
    }

    const FillTime = FormatTime(this.state.newFillTime);
    if (FillTime === null) { // This is the output if fillTime fails to parse
      ErrorInInput = true;
      NewErrorMessage += "Tidsformattet er ikke korrekt.\n"
    }
    const Customer = (this.props.customer) ? (this.props.customer) : null
    const CustomerNumber = (Customer) ? Customer.kundenr : null

    if (CustomerNumber === null) {
      ErrorInInput = true;
      NewErrorMessage += "Kunne ikke finde denne kunden's Kundenummer.\n"
    }

    if (ErrorInInput){
      console.log(NewErrorMessage);
      this.setState({...this.state, ErrorMessage : NewErrorMessage})
      return
    }


    const editingSet = this.state.EditingVials
    const new_state = {...initial_state}
    new_state.EditingVials = editingSet
    // This function will trigger an update to the prop Vials, that in turn will trigger an update, and then we'll be able to see the Vial when the backend have accepted it.
    // Note that other users will also be able to see this vial, since it's created using the websocket. 
    this.props.createVial(this.state.newCharge, FillTime, Number(NewVolume.toFixed(2)), Number(NewActivity.toFixed(2)), CustomerNumber)
    this.setState(new_state);
  }

  // * Editing Functions * //

  AcceptEditVial(vialID){
    //Validate the data, if ok then Pass it on the table, that will use its websocket to probergate the change onward.
    const EditingData = this.state.EditingVials.get(vialID);

    var ErrorInInput = false;
    var NewErrorMessage = "";

    console.log(EditingData);
    const BatchName = EditingData.charge
    if (!BatchName){
      ErrorInInput = true;
      NewErrorMessage += "Der er ikke skrevet Noget Batch Nummer.\n"
    }
    const NewActivity = ParseDanishNumber(EditingData.activity)
    if (isNaN(NewActivity)){
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset skal være et tal.\n"
    } else if ( NewActivity <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset Kan ikke være negativ.\n"
    } else {
      EditingData.activity
    }


    const NewVolume = ParseDanishNumber(EditingData.volume)
    if (isNaN(NewVolume)){
      ErrorInInput = true;
      NewErrorMessage += "Volumen skal være et tal.\n"
    } else if ( NewVolume <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Volumen kan ikke være negativ.\n"
    } else {
      EditingData.volume = NewVolume;
    }


    const FillTime = FormatTime(EditingData.filltime);
    if (FillTime === null) { // This is the output if fillTime fails to parse
      ErrorInInput = true;
      NewErrorMessage += "Tidsformattet er ikke korrekt.\n"
    }

    const Customer = (this.props.customer) ? (this.props.customer) : null
    const CustomerNumber = (Customer) ? Customer.kundenr : null

    if (CustomerNumber === null) {
      ErrorInInput = true;
      NewErrorMessage += "Kunne ikke finde denne kunden's Kundenummer.\n"
    }

    if (ErrorInInput){
      console.log(NewErrorMessage);
      this.setState({...this.state, ErrorMessage : NewErrorMessage});
      return;
    }

    // This function causes an update to the props vials, so a re-render happens
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
    message[WEBSOCKET_DATATYPE] = JSON_VIAL;
    message[WEBSOCKET_DATA] = EditingData;
    this.props.websocket.send(message);

    const newEdittingMap = new Map(this.state.EditingVials);
    newEdittingMap.delete(vialID);
    this.setState({...this.state, EditingVials : newEdittingMap});
  }

  RejectEditVial(vialID){
    const newEdittingMap = new Map(this.state.EditingVials)
    newEdittingMap.delete(vialID)
    this.setState({...this.state, EditingVials : newEdittingMap, ErrorMessage : ""})
  }

  EditVialTimeField(vialID, This){
    const returnFunction = (event) => {
      const newEdittingMap = new Map(This.state.EditingVials);
      const newVialData = {...newEdittingMap.get(vialID)};
      if (event.code == "Backspace"){
        return
      } else if ([2,5].includes(event.target.value.length)){
        newVialData["filltime"] = event.target.value + ':';
        newEdittingMap.set(vialID, newVialData);
        this.setState({...this.state, EditingVials : newEdittingMap });
      } else {
        return
      }
    }
    return returnFunction;
  }

  EditVialField(vialID, fieldName, This){
    const returnFunction = (event) => {
      const newEdittingMap = new Map(This.state.EditingVials)
      const newData = {...newEdittingMap.get(vialID)}
      newData[fieldName] = event.target.value
      newEdittingMap.set(vialID, newData)
      This.setState({...This.state, EditingVials : newEdittingMap})
    }
    return returnFunction.bind(this)
  }


  /** This function updates the state such that a user can edit a vial.
   *
   * @param {Number} vialID This is the ID of the Vial used for key in state.EditingVials
   */
  startEditVial(vialID){
    if(this.props.selectedVials.has(vialID)){
      this.props.toggleVial(vialID);
    }

    const vial = {...this.props.vials.get(vialID)};
    const newEdittingMap = new Map(this.state.EditingVials);
    newEdittingMap.set(vialID, vial);

    this.setState({...this.state,
      EditingVials : newEdittingMap
    });
  }

  // ***** Authenticate functions ***** //

  /** This function performs checks to see if the order is suitable to Free
   *  if check fails then it updates state with a "helpful" error message
   *  if succeeds then calls parent to move to next step in workflow.
   */
  confirmOrder(){
    var newErrorMessage = "";

    this.setState({...this.state, ErrorMessage : ""})

    if(this.state.CreatingVial){
      newErrorMessage += "Du kan ikke godkende en ordre imens du er i gang med Oprette en vial.\n";
    }
    if(this.state.EditingVials.size !== 0){
      newErrorMessage += "Du kan ikke godkende en ordre imens du er i gang med redigerer en vial.\n";
    }
    if (this.props.selectedVials.size === 0) {
      newErrorMessage += "Du kan ikke godkende en ordre, uden at vælge mindst 1 vial.\n"
    }
    if (newErrorMessage) {
      this.setState({
        ...this.state,
        ErrorMessage : newErrorMessage
      });
    } else {
      this.props.Authenticate();
    }
  }

  // ********* Render Functions ********* //
  //     *     Rendering Vials      *     //
  renderVial(vial){
    const isChecked = this.props.selectedVials.has(vial.ID)

    return [
      vial.ID,
      vial.charge,
      vial.filltime,
      vial.volume,
      vial.activity,
      (<Button onClick={() => this.startEditVial(vial.ID)}>Rediger</Button>),
      (<input type="checkbox" checked={isChecked ? 'checked' : ''} onChange={() => this.props.toggleVial(vial.ID)}/>)
    ]
  }

  renderEditingVial(vial){
    const editingState = this.state.EditingVials.get(vial.ID);

    return [vial.ID,
      <FormControl
        value={editingState.charge}
        onChange={this.EditVialField(vial.ID, "charge").bind(this)}/>,
      <FormControl
        value={editingState.filltime}
        onChange={this.EditVialField(vial.ID, "filltime", this).bind(this)}
        onKeyDown={this.EditVialTimeField(vial.ID, this).bind(this)}/>,
      <FormControl
        value={editingState.volume}
        onChange={this.EditVialField(vial.ID, "volume", this).bind(this)}/>,
      <FormControl
        value={editingState.activity}
        onChange={this.EditVialField(vial.ID, "activity", this).bind(this)}/>,
      renderClickableIcon("/static/images/accept.svg",
        () => this.AcceptEditVial(vial.ID)),
      renderClickableIcon("/static/images/decline.svg",
        () => this.RejectEditVial(vial.ID))
    ]
  }

  renderNewVial(){
    const bacthInput = (<FormControl
      value={this.state.newCharge}
      onChange={changeState("newCharge", this).bind(this)}
    />);
    const ProductionTimeInput = (<FormControl
      value={this.state.newFillTime}
      onChange={changeState("newFillTime", this).bind(this)}
      onKeyDown={addCharacter(':', "newFillTime",[2,5], this)}
    />);
    const VolumeInput = (<FormControl
      value={this.state.newVolume}
      onChange={changeState("newVolume", this).bind(this)}
    />);
    const ActivityInput = (<FormControl
      value={this.state.newActivity}
      onChange={changeState("newActivity", this).bind(this)}
    />);
    const AcceptButton = (<Button onClick={this.createNewVial.bind(this)}>Opret</Button>);
    const EmptyDiv = (<div></div>);


    return ["ny", bacthInput, ProductionTimeInput, VolumeInput, ActivityInput, AcceptButton, EmptyDiv];
  }

  // * Render Body * //

  renderOrder(){
    const Order = this.props.Order;
    const OrderID = (Order) ? Order.oid : "";

    const Customer = (this.props.customer) ? this.props.customer : null;
    const CustomerNumber = (Customer) ? Customer.kundenr  : "";
    const CustomerName   = (Customer) ? Customer.UserName + " - " + Customer.Realname : "";
    const Activity       = (Order) ? Order.total_amount_o : "";

    var AssignedActivity = 0;
    for (let vialID of this.props.selectedVials) {
      const Vial = this.props.vials.get(vialID)
      AssignedActivity += Number(Vial.activity)
    }

    return(
      <div>
        <Table striped bordered>
          <tbody>
            {renderTableRow("0", ["Order ID", OrderID])}
            {renderTableRow("1", ["Kunde nummber:", CustomerNumber])}
            {renderTableRow("2", ["Navn:" , CustomerName])}
            {renderTableRow("3", ["Ønsket aktivitet:", Activity])}
            {renderTableRow("4", ["Allokeret Aktivitet:", AssignedActivity])}
            {renderTableRow("5", ["Bestilt Af:",  Order.username])}
            {Order.comment ? renderTableRow("6", ["Kommentar", Order.comment]) : null}
          </tbody>
        </Table>
      </div>);
  }

  renderVials(){
    const Order = this.props.Order;

    const Customer = (this.props.customer) ? this.props.customer : null;
    const CustomerNumber = (Customer) ? Customer.kundenr  : "";
    const vials_in_use = [];
    if (CustomerNumber) {
      for(let [_, vial] of this.props.vials){

        if (vial.OrderMap !== null) continue;
        if (vial.customer !== CustomerNumber) continue;
        if (vial.filldate !==
          `${this.props.date.getFullYear()}-${FormatDateStr(this.props.date.getMonth() + 1)}-${FormatDateStr(this.props.date.getDate())}`) continue;
        vials_in_use.push(vial);
      }
    }

    vials_in_use.sort((v1, v2) => {
      if (v1.filltime < v2.filltime) {
        return -1;
      } else if (v1.filltime === v2.filltime) {
        return v1.ID - v2.ID;
      } else {
        return 1;
      }
    });

    const RenderVials = [];
    for (const vial of vials_in_use){
      (this.state.EditingVials.has(vial.ID)) ? RenderVials.push(
        renderTableRow(vial.ID, this.renderEditingVial(vial))
      ) :
      RenderVials.push(
        renderTableRow(vial.ID, this.renderVial(vial))
      );
    }

    var AddNewOrderButton;

    if(this.state.CreatingVial){
      RenderVials.push(renderTableRow("new", this.renderNewVial()))
      AddNewOrderButton = (<Button onClick={this.StopCreatingNewVial.bind(this)}>Anuller ny Vial</Button>)
    } else {
      AddNewOrderButton = (<Button onClick={() => {this.initializeNewVial()}}>Opret Ny Vial</Button>)
    }

    return(<div>
      <Table bordered>
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
          {RenderVials}
        </tbody>
      </Table>
      {AddNewOrderButton}
    </div>)
  }

  renderBody(){
    return (
      <Container fluid>
        <Row>{this.renderOrder()}</Row>
        <Row>{this.renderVials()}</Row>
        {this.state.ErrorMessage ? <Row>{this.state.ErrorMessage}</Row> : null }
      </Container>);
  }

  // * Main render function * //

  render() {
    return (
      <Modal
      show={this.props.show}
      size="lg"
      onHide={this.CloseModal.bind(this)}
      >
      <Modal.Header>Order {this.props.Order.oid}</Modal.Header>
      <Modal.Body>{this.renderBody()}</Modal.Body>
      <Modal.Footer>
        <Button onClick={this.confirmOrder.bind(this)}>Godkend</Button>
        <Button onClick={this.CloseModal.bind(this)}> Luk </Button>
      </Modal.Footer>
    </Modal>);
  }
}
