import React, {Component,} from "react";
import { Button, Form, FormControl, Modal, Table } from "react-bootstrap";

import { JSON_TRACER_MAPPING, LEGACY_KEYWORD_CUSTOMER_ID, LEGACY_KEYWORD_ID, LEGACY_KEYWORD_TRACER_ID,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
  WEBSOCKET_MESSAGE_DELETE_DATA_CLASS } from "../../lib/constants";
import { renderTableRow } from "../../lib/rendering";
import { changeState } from "../../lib/state_management";

import propTypes from "prop-types";

import styles from '../../css/Site.module.css';

export { TracerModal }

class TracerModal extends Component {
  static propTypes = {
    customers : propTypes.objectOf(Map).isRequired,
    tracerMapping : propTypes.objectOf(Map).isRequired,
    tracerID : propTypes.number.isRequired
    // websocket
  }
  constructor(props) {
    super(props);
    this.state = {
      filter : ""
    }
  }


  updateTracerCustomer(event, CustomerID){
    if(event.target.checked){
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS)
      const data = {};
      data[LEGACY_KEYWORD_CUSTOMER_ID] = CustomerID;
      data[LEGACY_KEYWORD_TRACER_ID] = this.props.tracerID;

      message[WEBSOCKET_DATA] = data
      message[WEBSOCKET_DATATYPE] = JSON_TRACER_MAPPING

      this.props.websocket.send(message);
    } else {
      const TracerMappingID = this.TracerMapping.get(CustomerID);
      const data = {};
      data[LEGACY_KEYWORD_CUSTOMER_ID] = CustomerID;
      data[LEGACY_KEYWORD_TRACER_ID]   = this.props.tracerID;
      data[LEGACY_KEYWORD_ID] = TracerMappingID;
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_DELETE_DATA_CLASS);
      message[WEBSOCKET_DATA] = data;
      message[WEBSOCKET_DATATYPE] = JSON_TRACER_MAPPING;

      this.props.websocket.send(message);
    }
  }

  renderCustomerRow(customer){
    const allowedToOrder = this.TracerMapping.has(customer.ID)
    return renderTableRow(customer.ID, [
      customer.UserName, <Form.Check
        aria-label={`check-${customer.ID}`}
        defaultChecked={allowedToOrder}
        type="checkbox"
        className="mb-2"
        onClick={(event) => this.updateTracerCustomer(event, customer.ID)}
      />
    ]);
  }

  renderBody(){
    const Customers = [];
    const filter = new RegExp(this.state.filter,"g");
    for(const [_customer_id, customer] of this.props.customers){
      if(filter.test(customer.UserName)) {
        Customers.push(this.renderCustomerRow(customer));
      }
    }


    return (
    <div>
      Filter: <FormControl
        aria-label="input-filter"
        value={this.state.filterText}
        onChange={changeState("filter", this).bind(this)}/>
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
    const TracerMapping = new Map();

    for(const [TracerMappingID, TracerMappingTuple] of this.props.tracerMapping){
      if(TracerMappingTuple[LEGACY_KEYWORD_TRACER_ID] == this.props.tracerID){
        TracerMapping.set(TracerMappingTuple[LEGACY_KEYWORD_CUSTOMER_ID], TracerMappingID)
      }
    }

    this.TracerMapping = TracerMapping // Derived Property

    return (
      <Modal
        show={true}
        size="lg"
        onHide={this.props.onClose}
        className={styles.mariLight}
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
