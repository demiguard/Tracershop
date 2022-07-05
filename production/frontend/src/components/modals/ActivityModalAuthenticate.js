import React, { Component } from "react";
import { Modal, Button, Container, Col, Table, Row } from "react-bootstrap";
import Authenticate from "/src/components/injectables/Authenticate";
import { renderTableRow } from "/src/lib/Rendering";
import { ajax } from "jquery"
import { AUTH_DETAIL, AUTH_PASSWORD, AUTH_USERNAME } from "/src/lib/constants";

export { ActivityModalAuthenticate }

const initial_state = {

};

/**
 * Props
 *  @param {Boolean} show - Should the modal be shown or not
 *  @param {CallableFunction} onClose - Function to be called if the user wishes to close the modal
 *  @param {CallableFunction} cancel - Function called when the user wish to cancel the authentication
 *  @param {Object} Order - Object with information on the order

            customer={this.props.customer}
            vials={this.props.vials}
 * @param {} selectedVials  {this.state.selectedVials}
            accept={this.props.AcceptOrder}
 */
export default class ActivityModalAuthenticate extends Component {
  constructor(props){
    super(props);
    this.state = {
      ErrorMessage : ""
    }
  }

  submitLogin(username, password){
    const dataObject = {};

    dataObject[AUTH_USERNAME] = username;
    dataObject[AUTH_PASSWORD] = password;

    ajax({
      url:"auth/authenticate",
      type:"post",
      data:JSON.stringify(dataObject)
    }).then((data) => {
      if (data[AUTH_DETAIL]) {
        this.props.accept(this.props.Order.oid, this.props.selectedVials);
      } else {
        this.setState({
          ...this.state, ErrorMessage : "Forkert Login"
        });
      }
    });
  }


  CloseModal(){
    this.setState(initial_state);
    this.props.onClose();
  }

  render() {
    const Order = this.props.Order;
    const OrderID = (Order) ? Order.oid : "";

    const Customer = (this.props.customer) ? this.props.customer : null;
    const CustomerNumber = (Customer) ? Customer.CustomerNumber  : "";
    const CustomerName   = (Customer) ? Customer.username + " - " + Customer.Name : "";
    const Activity       = (Order) ? Order.total_amount_o : "";

    const Vials = [];
    var AssignedActivity = 0;
    for (let vialID of this.props.selectedVials) {
      const Vial = this.props.vials.get(vialID)
      AssignedActivity += Number(Vial.activity)
      Vials.push(renderTableRow(Vial.ID, ["Vial", Vial.ID]))
    }



    return (
      <Modal
      show={this.props.show}
      size="lg"
      onHide={this.CloseModal.bind(this)}
      >
      <Modal.Header>Frigiv Order {OrderID}</Modal.Header>
      <Modal.Body>
        <Container>
          <Row>

          <Col xs={4}>
          <Authenticate
            login_message="Frigiv Ordre"
            authenticate={this.submitLogin.bind(this)}
            ErrorMessage={this.state.ErrorMessage}
            fit_in={false}
            />
          </Col>
          <Col xs={8}>
            <Table striped bordered>
              <tbody>
                {renderTableRow("0", ["Order ID", OrderID])}
                {renderTableRow("1", ["Kunde nummber:", CustomerNumber])}
                {renderTableRow("2", ["Navn:" , CustomerName])}
                {renderTableRow("3", ["Ønsket aktivitet:", Activity])}
                {renderTableRow("4", ["Allokeret Aktivitet:", AssignedActivity])}
                {renderTableRow("5", ["Bestilt Af:",  Order.username])}
                {Order.comment ? renderTableRow("6", ["Kommentar", Order.comment]) : null}
                {Vials}
              </tbody>
            </Table>
          </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.props.cancel}> Tilbage </Button>
        <Button onClick={this.CloseModal.bind(this)}> Luk </Button>
      </Modal.Footer>
    </Modal>);
  }
}
