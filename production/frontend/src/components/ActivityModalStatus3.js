import React, { Component } from "react";
import { Modal, Table, Button } from "react-bootstrap";
import { renderDateTime, renderTableRow } from "./lib/Rendering";


export { ActivityModalStatus3 }


class ActivityModalStatus3 extends Component {
  constructor(props){
    super(props);
  }

  /** Exit function, resets internal state for next time the modal is open.
   */
  CloseModal(){
    this.props.onClose();
  }

  /** returns the name of the corrosponding Employee
   * @param {Number} employeeID
   * @returns {String} The name of the user 
   */
  getUserMapping(employeeID){
    const employee = this.props.employees.get(employeeID);
    return employee.Username;
  }

  /**
   * 
   * @param {Object} vial Simple object with the attributes 
   * @returns {JSX.Element}
   */
  renderVial(vial){
    return renderTableRow(vial.ID, [vial.ID, vial.filltime, vial.activity, vial.charge, vial.volume])
  }


  render(){
    const vials = [];
    for(const [vialID, vial] of this.props.vials) {
      if (vial.OrderMap == this.props.Order.oid) {
        vials.push(this.renderVial(vial));
      }
    } 

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
            {renderTableRow(0,["Order ID:", this.props.Order.oid])}
            {renderTableRow(1,["Kunde:", this.props.customer.username + " - " + this.props.customer.Name])}
            {renderTableRow(2,["Bestilt Aktivitet:", this.props.Order.amount])}
            {renderTableRow(3,["Udleveret Aktivitet",this.props.Order.frigivet_amount])}
            {renderTableRow(4,["Bestilt til:",renderDateTime(this.props.Order.deliver_datetime)])}
            {renderTableRow(5,["Frigivet kl:",renderDateTime(this.props.Order.frigivet_datetime)])}
            {renderTableRow(6,["Frigivet af:", this.getUserMapping(this.props.Order.frigivet_af)])}
            {renderTableRow(7,["Batch Nummer:", this.props.Order.batchnr])}
            {renderTableRow(8, ["Bestilt Af:",  this.props.Order.username])}
            {this.props.Order.comment ? renderTableRow(9, ["Kommentar", this.props.Order.comment]) : null}
          </tbody>
        </Table>
        
        <Table striped bordered>
          <thead>
            <tr>
              <th>Vials</th>
              <th>Dispensations tidspunkt</th>
              <th>Aktivit</th>
              <th>Batch nummer</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {vials}
          </tbody>
        </Table>

      </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.CloseModal.bind(this)}> Luk </Button>
      </Modal.Footer>
    </Modal>)
  }

}