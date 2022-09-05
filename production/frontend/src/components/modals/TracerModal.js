import { ajax } from "jquery";
import React, {Component,} from "react";
import { Button, Form, FormControl, Modal, Table } from "react-bootstrap";
import { JSON_TRACER_MAPPING, KEYWORD_CUSTOMER_ID, KEYWORD_TRACER_ID, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS } from "../../lib/constants";
import { changeState } from "../../lib/stateManagement";

export default class TracerModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter : ""
    }
  }

  updateFilter(event){
    const newState = { ...this.state,
      filterText : event.target.value
    };
    this.setState(newState);
  }

  updateTracerCustomer(event, CustomerID){
    if(event.target.checked){
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS)
      const data = {};
      data[KEYWORD_CUSTOMER_ID] = CustomerID;
      data[KEYWORD_TRACER_ID] = this.props.tracerID;

      message[WEBSOCKET_DATA] = data
      message[WEBSOCKET_DATATYPE] = JSON_TRACER_MAPPING

      this.props.websocket.send(message);

    } else {
      console.log("destroy")
    }
  }

  renderCustomerRow(customer){
    const allowedToOrder = this.props.tracerMapping.has(customer.ID)

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
    const filter = new RegExp(this.state.filter,"g");
    for(const [_customer_id, customer] of this.props.customers.entries()){
      if(filter.test(customer.UserName)) {
        Customers.push(this.renderCustomerRow(customer));
      }
    }


    return (
    <div>
      Filter: <FormControl value={this.state.filterText} onChange={changeState("filter", this).bind(this)}/>
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
    const TracerMapping = new Set();
    if(this.props.tracerID != null){
      for(const [TracerMappingID, TracerMappingTuple] of this.props.tracerMapping){
        if(TracerMappingTuple[KEYWORD_TRACER_ID] == this.prosp.tracerID){
          TracerMapping.add(TracerMappingTuple[KEYWORD_CUSTOMER_ID])
        }
      }
    }

    this.TracerMapping = TracerMapping


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
          <Button onClick={this.props.deleteTracer}>
            Slet Tracer
          </Button>
          <Button
            onClick={this.props.onClose}
          >Færdig</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
