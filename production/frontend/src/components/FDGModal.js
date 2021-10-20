import React, { Component } from "react";
import { Modal, Button, Row, Container, Table, Tab, FormControl, Form } from "react-bootstrap";
import { renderTableRow } from "./lib/Rendering";
import { FormatTime } from "./lib/formatting";
export { FDGModal }


/*
 * This is the modal that shows up when the user click on an order to recieve additional information
 * This modal also handles 
 * 
 * 
 * Props :
 *  - show      - Boolean indicating if the modal should be shown
 *  - Order     - JavaScript Object with the following values:
 *      * oid    - int - the orders id
 *      * status - int - The status of an order where 1 = Ordered, 2 = Accepted, 3 = Finished, 4 Cancelled
 *  - Customer  - Javascript Object with the customer Information 
 *  - onClose   - Function that closes the modal without any external state
 *  - onStatus3 - Function called when the user changes the status of an order to 3
 *  - applyVial - Function called when the user assigns a vial to an order.
 */

const initial_state = {
  EditingVials : new Map(), // keys are ID, while entity are state data
  CreatingVial : false,

  newCharge : "",
  newFillTime : "",
  newVolume : "",
  newActivity : "", 
  ErrorMessage :""
}

export default class FDGModal extends Component {
  constructor(props){
    super(props);

    this.state = initial_state  
  }

  changeState(value, stateField) {
    const newState =  {...this.state};
    newState[stateField] = value;
    this.setState(newState);
  }

  createNewVial(){
    /*
     * This Function checks that the current new Vial is ok, then calls the prop function
     * for creating new vials. 
     * 
     */
    var ErrorInInput = false;
    var NewErrorMessage = "";
    
    if (!this.state.newCharge){
      ErrorInInput = true;
      NewErrorMessage += "Der er ikke skrevet Noget Batch Nummer.\n"
    }
    const NewActivity = Number(this.state.newActivity)
    if (isNaN(NewActivity)){
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset skal være et tal.\n"
    } else if ( NewActivity <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Aktiviten i glasset Kan ikke være negativ.\n"
    }
    const NewVolume = Number(this.state.newVolume)
    if (isNaN(NewVolume)){
      ErrorInInput = true;
      NewErrorMessage += "Volumen skal være et tal.\n"
    } else if ( NewVolume <= 0) {
      ErrorInInput = true;
      NewErrorMessage += "Volumen kan ikke være negativ.\n"
    }

    const FillTime = FormatTime(this.state.newFillTime);
    if (FillTime == null) { // This is the output if fillTime fails to parse 
      ErrorInInput = true;
      NewErrorMessage += "Tidsformattet er ikke korrekt.\n"
    } 

    if (ErrorInInput){
      console.log(NewErrorMessage);
      this.setState({...this.state, ErrorMessage : NewErrorMessage})
      return
    }



    const editingSet = this.state.EditingVials
    const new_state = {...initial_state}
    new_state.EditingVials = editingSet
    this.props.createVial(this.state.newCharge, FillTime, NewVolume, NewActivity)
    this.setState(new_state);
    
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

  InactiveVialList(vial){
    /*
     * This function extracts the information in a vial object, for displaying
     */
    return [
      vial.ID,
      vial.charge,
      vial.filltime,
      vial.volume,
      vial.activity,
      (<Button>Edit</Button>)
    ]
  }

  ActiveVialList(vial){
    return [this.ID]
  }

  renderNewVial(){
    const bacthInput = (<FormControl
      value={this.state.newCharge}
      onChange={(event) => {this.changeState(event.target.value, "newCharge")}}
    />);
    const ProductionTimeInput = (<FormControl
      value={this.state.newFillTime}
      onChange={(event) => {this.changeState(event.target.value, "newFillTime")}}
    />);
    const VolumeInput = (<FormControl
      value={this.state.newVolume}
      onChange={(event) => {this.changeState(event.target.value, "newVolume")}}
    />);
    const ActivityInput = (<FormControl
      value={this.state.newActivity}
      onChange={(event) => {this.changeState(event.target.value, "newActivity")}}
    />);



    return ["ny", bacthInput, ProductionTimeInput, VolumeInput, ActivityInput]
  }

  renderOrder(){
    const Order = this.props.Order;
    const OrderID = (Order) ? Order.oid : "";

    const Customer = (Order) ? this.props.customer.get(Order.BID) : null;
    const CustomerNumber = (Customer) ? Customer.CustomerNumber  : "";
    const CustomerName   = (Customer) ? Customer.Name : "";
    const Activity       = (Order) ? Order.total_amount_o : "";

    return(
      <div>
        <Table>
          <tbody>
            {renderTableRow("0", ["Order ID", OrderID])}
            {renderTableRow("1", ["Kunde nummber:", CustomerNumber])}
            {renderTableRow("2", ["Navn:" , CustomerName])}
            {renderTableRow("3", ["Ønsket aktivitet:", Activity])}
          </tbody>
        </Table> 
      </div>);
  }

  renderVials(){
    const Order = this.props.Order;
    const OrderID = (Order) ? Order.oid : "";

    const Customer = (Order) ? this.props.customer.get(Order.BID) : null;
    const CustomerNumber = (Customer) ? Customer.CustomerNumber  : "";
    const vials_in_use = [];
    if (CustomerNumber) {
      for(let [vialID, vial ] of this.props.vials){
        if (vial.customer == CustomerNumber){
          (this.state.EditingVials.has(vialID)) ? vials_in_use.push(
            renderTableRow(vialID, this.ActiveVialList(vial))
          ) : 
          vials_in_use.push(
            renderTableRow(vialID, this.InactiveVialList(vial))
          ); 
        }
      }
    }

    var AddNewOrderButton;

    if(this.state.CreatingVial){
      vials_in_use.push(renderTableRow("new", this.renderNewVial()))
      AddNewOrderButton = (<Button onClick={this.createNewVial.bind(this)}>Godkend Ny Vial</Button>)
    } else {
      AddNewOrderButton = (<Button onClick={() => {this.initializeNewVial()}}>Opret Ny Vial</Button>)
    }
    
    return(<div>
      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Batch</th>
            <th>Produktions Tidpunkt</th>
            <th>Volume</th>
            <th>Aktivitet</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vials_in_use}
        </tbody>
      </Table>
      {AddNewOrderButton}
    </div>)
  }

  CloseModal(){
    this.setState(initial_state);
    this.props.onClose();
  }

  renderBody(){
    return (
    <Container fluid>
      <Row>{this.renderOrder()}</Row>
      <Row>{this.renderVials()}</Row>
    </Container>);
  }

  render(){
    const Order = this.props.Order;
    const OrderID = (Order) ? Order.oid : "";


    return(
    <Modal
      show={this.props.show}
      size="lg"
      onHide={this.CloseModal.bind(this)}
    >
      <Modal.Header>Ordre {OrderID}</Modal.Header>
      <Modal.Body>{this.renderBody()}</Modal.Body>
      <Modal.Footer>
        <Button> Set Status til 3 </Button>
        <Button onClick={this.CloseModal.bind(this)}> Tilbage </Button>
      </Modal.Footer>
    </Modal>);
  }
}