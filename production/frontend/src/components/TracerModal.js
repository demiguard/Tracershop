import { ajax } from "jquery";
import React, {Component,} from "react";
import { Button, Form, Modal, Table } from "react-bootstrap";

export default class TracerModal extends Component {
  constructor(props) {
    super(props);
  }

  updateTracerCustomer(event, CustomerID){
    
    const checked = event.target.checked;

    ajax({
      url:"api/updateTracerCustomer",
      type:"PUT",
      dataType:"json",
      data:JSON.stringify({
        newValue : checked,
        customer_id : CustomerID,
        tracer_id : this.props.tracerID
      })

    })
  }

  renderCustomerRow(customer){
    const allowedToOrder = this.props.ModalTracerMap.has(customer.ID)

    return (
      <tr key={customer.ID}>
        <td>{customer.UserName}</td>
        <td>
          <Form.Check 
            defaultChecked={allowedToOrder}
            type="checkbox"
            className="mb-2"
            onClick={(event) => this.updateTracerCustomer(event, customer.ID)}
          />
        </td>
      </tr>
    )
  }

  renderBody(){
    const Customers = [];
    for(const [_customer_id, customer] of this.props.customers.entries()){
      Customers.push(this.renderCustomerRow(customer))
    }


    return (
    <div>
      <Table>
        <thead>
          <tr>
            <th>Tracer</th>
            <th>Kan bestille</th>
          </tr>
        </thead>
        <tbody>
          {Customers}
        </tbody>
      </Table>
    </div>);
  }


  render() {
    return (
      <Modal 
        show={this.props.show}
        size="lg"  
        onHide={this.props.onClose}
      >
        <Modal.Header>
          <Modal.Title>Tracer Konfiguration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderBody()}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            onClick={this.props.onClose}
          >Færdig</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
