import React, { Component } from "react";
import { Modal, Table, Button } from "react-bootstrap";
import { renderDateTime, renderTableRow } from "/src/lib/Rendering";

import styles from '../../css/Site.module.css'


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
    const Order = this.props.orders.get(this.props.order)
    const Customer = this.props.customers.get(Order.BID)
    const username = Customer.UserName;

    const year     = Order.deliver_datetime.substring(0,4);
    const month    = Order.deliver_datetime.substring(5,7);
    const oid      = Order.oid

    const pdfID = Order.COID == -1 ? oid : Order.COID;

    const ToPDF = () => {
      let path = `pdfs/${username}/${year}/${month}/${pdfID}`
      window.location.href = path;
    }



    const vials = [];
    for(const [vialID, vial] of this.props.vials) {
      if (vial.order_id == Order.oid) {
        vials.push(this.renderVial(vial));
      }
    }

    return (
    <Modal
      show={this.props.show}
      size="lg"
      onHide={this.CloseModal.bind(this)}
      className={styles.mariLight}
    >
      <Modal.Header>Frigivet Ordre {Order.oid}</Modal.Header>
      <Modal.Body>
        <Table striped bordered>
          <tbody>
            {renderTableRow(0,["Order ID:", Order.oid])}
            {renderTableRow(1,["Kunde:", Customer.UserName + " - " + Customer.Realname])}
            {renderTableRow(2,["Bestilt Aktivitet:", Order.amount])}
            {renderTableRow(3,["Udleveret Aktivitet",Order.frigivet_amount])}
            {renderTableRow(4,["Bestilt til:",renderDateTime(Order.deliver_datetime)])}
            {renderTableRow(5,["Frigivet kl:",renderDateTime(Order.frigivet_datetime)])}
            {renderTableRow(6,["Frigivet af:", this.getUserMapping(Order.frigivet_af)])}
            {renderTableRow(7,["Batch Nummer:", Order.batchnr])}
            {renderTableRow(8, ["Bestilt Af:",  Order.username])}
            {Order.comment ? renderTableRow(9, ["Kommentar", Order.comment]) : null}
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
        <Button onClick={ToPDF}> Se følgeseddel</Button>
      </Modal.Footer>
    </Modal>)
  }
}
