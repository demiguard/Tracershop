import React, { Component } from "react";
import { Modal, Button, Row, Container, Table, FormControl, Col, Image } from "react-bootstrap";
import { JSON_ACTIVITY_ORDER, JSON_VIAL, KEYWORD_AMOUNT, KEYWORD_AMOUNT_O, KEYWORD_TOTAL_AMOUNT, KEYWORD_TOTAL_AMOUNT_O, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE } from "../../lib/constants";
import { renderClickableIcon,renderTableRow } from "../../lib/Rendering";
import { changeState, toggleState } from "../../lib/stateManagement";
import { addCharacter } from "../../lib/utils";
import { FormatTime, ParseDanishNumber, FormatDateStr } from "/src/lib/formatting";
import { autoAddCharacter } from "/src/lib/utils";


export { ActivityModalStatus2 }


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

    const order = this.props.orders.get(this.props.order);

    this.state = {
      ErrorMessage : "",
      EditingVials : new Map(),

      editingOrderedActivity : false,
      editOrderActivity : order.amount,
      CreatingVial : false,
      newCharge : "",
      newFillTime : "",
      newVolume : "",
      newActivity : "",
      ErrorMessage :"",
    };
  }

  // ********* State Update Functions ********* //
  CloseModal(){
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

  /** This function validates user input to create a vial.
   * In case of error It updates state with relevant error message.
   *
   * @param {*} charge - User input representing Charge or Batchnumber to be validated
   * @param {*} Activity - User input representing A positive number
   * @param {*} Volume - User input representing Volume of vial.
   * @param {*} FillTime - User input representing fill time of vial.
   * @returns {Boolean} - if the vial is valid or not
   */
  validateVial(charge, activity, volume, FillTimeStr){
    var ErrorInInput = false;
    var NewErrorMessage = "";

    if (!charge){ // Ask jacob for format
      ErrorInInput = true;
      NewErrorMessage += "Der er ikke skrevet Noget Batch Nummer.\n"
    }
    const NewActivity = ParseDanishNumber(activity)
    if (isNaN(NewActivity)){
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset skal være et tal.\n"
    } else if ( NewActivity <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset Kan ikke være negativ.\n"
    }
    const NewVolume = ParseDanishNumber(volume)
    if (isNaN(NewVolume)){
      ErrorInInput = true;
      NewErrorMessage += "Volumen skal være et tal.\n"
    } else if ( NewVolume <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Volumen kan ikke være negativ.\n"
    }

    const FillTime = FormatTime(FillTimeStr);
    if (FillTime === null) { // This is the output if fillTime fails to parse
      ErrorInInput = true;
      NewErrorMessage += "Tidsformattet er ikke korrekt.\n"
    }

    const order = this.props.orders.get(this.props.order);
    const Customer = this.props.customers.get(order.BID);
    const CustomerNumber = Customer.kundenr;

    if (CustomerNumber === null) {
      ErrorInInput = true;
      NewErrorMessage += "Kunne ikke finde denne kunden's Kundenummer.\n"
    }

    if (ErrorInInput){
      this.setState({
        ...this.state,
        ErrorMessage : NewErrorMessage
      });
    }

    return ErrorInInput;
  }

  changeNewFieldTime(event){
    const newState = {...this.state};
    newState.newFillTime = autoAddCharacter(event, ":", new Set([2,5]), this.state.newFillTime);

    this.setState(newState);
  }

  toggleActivity(){
    const retfunc = (event) => {
      if(this.state.editingOrderedActivity){
        const order = this.props.orders.get(this.props.order);
        const newActivity = Number(this.state.editOrderActivity)
        if(isNaN(newActivity) ){
          this.setState({
            errorMessage : "Den bestilte aktivitet er ikke et tal"
          });
          return;
        }
        if(newActivity < 0 ){
          this.setState({
            errorMessage : "Der bestilte aktivitet kan ikke være negativ"
          });
          return;
        }

        // Activity from other orders assigned to total_* attributes
        const externalActivity = order.total_amount - order.amount;
        const newTotalActivity = newActivity + externalActivity;

        const newAmountOverhead = (1 + this.props.customer.overhead / 100) * newActivity;
        const newTotalAmountOverhead = (1 + this.props.customer.overhead / 100) * newTotalActivity;

        const newOrder = {...order};
        // This is why python is better
        newOrder[KEYWORD_AMOUNT] = newActivity;
        newOrder[KEYWORD_AMOUNT_O] = newAmountOverhead;
        newOrder[KEYWORD_TOTAL_AMOUNT] = newTotalActivity;
        newOrder[KEYWORD_TOTAL_AMOUNT_O] = newTotalAmountOverhead

        const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
        message[WEBSOCKET_DATA] = newOrder;
        message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;

        this.props.websocket.send(message);

        this.setState({
          ...this.state,
          errorMessage : "",
          editingOrderedActivity : false
        });
      } else {
        this.setState({
          ...this.state,
          editingOrderedActivity : true
        })
      }
    }
    return retfunc.bind(this)
  }
  // ********* Vial Functions ********** //

  /*
  * This Function checks that the current new Vial is ok,
  * then calls the prop function for creating new vials.
  *
  */
  createNewVial(){
    if(this.validateVial(this.state.newCharge, this.state.newActivity, this.state.newVolume,this.state.newFillTime)){
      return;
    }
    const NewVolume = ParseDanishNumber(this.state.newVolume);
    const NewActivity = ParseDanishNumber(this.state.newActivity);
    const FillTime = FormatTime(this.state.newFillTime);
    const order = this.props.orders.get(this.props.order);
    const Customer = this.props.customers.get(order.BID);
    const CustomerNumber = Customer.kundenr;

    // This function will trigger an update to the prop Vials, that in turn will trigger an update, and then we'll be able to see the Vial when the backend have accepted it.
    // Note that other users will also be able to see this vial, since it's created using the websocket.
    this.props.createVial(this.state.newCharge, FillTime, Number(NewVolume.toFixed(2)), Number(NewActivity.toFixed(2)), CustomerNumber)
    this.StopCreatingNewVial()
  }

  // * Editing Functions * //

  AcceptEditVial(vialID){
    //Validate the data, if ok then Pass it on the table, that will use its websocket to probergate the change onward.
    const EditingData = this.state.EditingVials.get(vialID);

    if(this.validateVial(EditingData.charge, EditingData.activity, EditingData.volume, EditingData.filltime)){
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
      newErrorMessage += "Du kan ikke godkende en ordre imens du er i gang med oprette et hætteglas.\n";
    }
    if(this.state.EditingVials.size !== 0){
      newErrorMessage += "Du kan ikke godkende en ordre imens du er i gang med redigerer et hætteglas.\n";
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
    const Order = this.props.orders.get(this.props.order);
    const OrderID = (Order) ? Order.oid : "";

    const Customer = this.props.customers.get(Order.BID);
    const CustomerNumber = (Customer) ? Customer.kundenr  : "";
    const CustomerName   = (Customer) ? Customer.UserName + " - " + Customer.Realname : "";

    var AssignedActivity = 0;
    for (let vialID of this.props.selectedVials) {
      const Vial = this.props.vials.get(vialID)
      AssignedActivity += Number(Vial.activity)
    }

    // The Close icon have been decreed by an external source

    return(
      <div>
        <Table striped bordered>
          <tbody>
            {renderTableRow("0", ["Order ID", OrderID])}
            {renderTableRow("1", ["Kunde nummber:", CustomerNumber])}
            {renderTableRow("2", ["Navn:" , CustomerName])}
            {renderTableRow("3", ["Bestilt aktivitet",
          <Row>
            <Col>{this.state.editingOrderedActivity ?
              <FormControl
                value={this.state.editOrderActivity}
                onChange={changeState("editOrderActivity", this).bind(this)}
              />
             : Order.amount}</Col>
            <Col md="auto" className="justify-content-end">{
              this.state.editingOrderedActivity ?
                renderClickableIcon("/static/images/accept.svg", this.toggleActivity().bind(this)) :
                renderClickableIcon("/static/images/pen.svg", this.toggleActivity().bind(this))}
              {renderClickableIcon("/static/images/calculator.svg")}</Col>
          </Row>
          ])}
            {renderTableRow("4", ["Ønsket aktivitet:", Order.total_amount_o])}
            {renderTableRow("5", ["Allokeret Aktivitet:", AssignedActivity])}
            {Order.comment ? renderTableRow("6", ["Kommentar", Order.comment]) : null}
          </tbody>
        </Table>
      </div>);
  }

  renderVials(){
    const order = this.props.orders.get(this.props.order);
    const Customer = this.props.customers.get(order.BID)

    const CustomerNumber = (Customer) ? Customer.kundenr  : "";
    const vials_in_use = [];
    if (CustomerNumber) {
      for(const [_, vial] of this.props.vials){

        if (vial.order_id !== null) continue;
        if (vial.customer !== CustomerNumber) continue;
        if (vial.filldate !==
          `${this.props.date.getFullYear()}-${FormatDateStr(this.props.date.getMonth() + 1)}-${
            FormatDateStr(this.props.date.getDate())}`) continue;
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
    const order = this.props.orders.get(this.props.order);

    return (
      <Modal
      show={this.props.show}
      size="lg"
      onHide={this.CloseModal.bind(this)}
      >
      <Modal.Header>Order {order.oid}</Modal.Header>
      <Modal.Body>{this.renderBody()}</Modal.Body>
      <Modal.Footer>
        <Button onClick={this.confirmOrder.bind(this)}>Godkend</Button>
        <Button onClick={this.CloseModal.bind(this)}> Luk </Button>
      </Modal.Footer>
    </Modal>);
  }
}
