import React, { Component } from "react";
import { Modal, Table, Button } from "react-bootstrap";



export { ActivityModalStatus3 }


class ActivityModalStatus3 extends Component {
  constructor(props){
    super(props);
  }

  CloseModal(){
    this.props.onClose();
  }


  render(){
    return (
    <Modal
      show={this.props.show}
      size="lg"
      onHide={this.CloseModal.bind(this)}
    >
      <Modal.Header>Frigivet Ordre {this.props.Order.oid}</Modal.Header>
      <Modal.Body>
        <Table striped bordered>
          <tbody>
            <tr>
              <td>Order ID</td>
              <td>{this.props.Order.oid} </td>
            </tr>
            <tr>
              <td>Kunde:</td>
              <td>{this.props.customer.username} - {this.props.customer.Name} </td>
            </tr>
            <tr>
              <td>Bestilt Aktivitet:</td>
              <td>{this.props.Order.amount}</td>
            </tr>
            <tr>
              <td>Udleveret Aktivitet</td>
              <td>{this.props.Order.frigivet_amount}</td>
            </tr>
            <tr>
              <td>Bestilt til: (TODO Datetime formatting) </td>
              <td>{this.props.Order.deliver_datetime}</td>
            </tr>
            <tr>
              <td>Frigivet kl: (Skal dette være frigivet_datetime eller hvornår ordre blev frigivet?) </td>
              <td>{this.props.Order.frigivet_datetime}</td>
            </tr>
            <tr>
              <td>Frigivet af: (To do mapping) </td>
              <td>{this.props.Order.frigivet_af}</td>
            </tr>
            <tr>
              <td>Batch Nummer:</td>
              <td>{this.props.Order.batchnr}</td>
            </tr>
          </tbody>
        </Table>

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.CloseModal.bind(this)}> Luk </Button>
      </Modal.Footer>
    </Modal>)
  }

}