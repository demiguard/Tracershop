import React, { Component } from "react";
import { Modal, Button, Row, Container, Table } from "react-bootstrap";
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
export default class FDGModal extends Component {
  constructor(props){
    super(props);

    this.state = {
      ActiveVial : null
    };
  }

  renderTableRow(Text, Value) {
    return(
      <tr>
        <td>{Text}</td>
        <td>{Value}</td>
      </tr>
    );
  }

  renderOrder(){
    const Order = this.props.Order;
    const Customer = this.props.Customer;
    
    const OrderID = (Order) ? Order.oid : "";
    const CustomerNumber = (Customer) ? Customer.CustomerNumber  : "";
    const CustomerName   = (Customer) ? Customer.Name : "";


    return(
      <div>
        <Table>
          <tbody>
            {this.renderTableRow("Order ID", OrderID)}
            {this.renderTableRow("Kunde nummber:", CustomerNumber)}
            {this.renderTableRow("Navn:" , CustomerName)}
          </tbody>
        </Table> 
      </div>);
  }

  renderVials(){
    return(<div></div>)
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
      onHide={this.props.onClose}
    >
      <Modal.Header>Ordre {OrderID}</Modal.Header>
      <Modal.Body>{this.renderBody()}</Modal.Body>
      <Modal.Footer>
        <Button> Set Status til 3 </Button>
        <Button onClick={this.props.onClose}> Tilbage </Button>
      </Modal.Footer>
    </Modal>);
  }
}