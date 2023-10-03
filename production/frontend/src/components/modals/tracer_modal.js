import React, {Component,} from "react";
import { Button, Container, Form, FormControl, Modal, Row, Table } from "react-bootstrap";

import { JSON_CUSTOMER, JSON_TRACER, JSON_TRACER_MAPPING, LEGACY_KEYWORD_CUSTOMER_ID, LEGACY_KEYWORD_ID, LEGACY_KEYWORD_TRACER_ID,
  PROP_ACTIVE_TRACER,
  PROP_ON_CLOSE,
  PROP_WEBSOCKET,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
  WEBSOCKET_MESSAGE_DELETE_DATA_CLASS,  WEBSOCKET_MESSAGE_MODEL_CREATE,
  WEBSOCKET_MESSAGE_MODEL_DELETE} from "../../lib/constants";
import { renderTableRow } from "../../lib/rendering";
import { changeState } from "../../lib/state_management";

import propTypes from "prop-types";

import styles from '../../css/Site.module.css';
import { Customer, TracerCatalog } from "../../dataclasses/dataclasses";
import { KEYWORD_TracerCatalog_CUSTOMER, KEYWORD_TracerCatalog_TRACER } from "../../dataclasses/keywords";
import { CloseButton } from "../injectable/buttons";

export { TracerModal }


const propType = {}
propType[JSON_CUSTOMER] = propTypes.objectOf(Map).isRequired;
propType[JSON_TRACER_MAPPING] = propTypes.objectOf(Map).isRequired;
propType[PROP_ACTIVE_TRACER] = propTypes.number.isRequired;
propType[PROP_ON_CLOSE] = propTypes.func.isRequired;
propType[JSON_TRACER] = propTypes.objectOf(Map).isRequired;

class TracerModal extends Component {
  static propTypes = propType
  constructor(props) {
    super(props);
    this.state = {
      filter : ""
    }
  }


  updateTracerCustomer(event, CustomerID){
    if(event.target.checked){
      const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
      const data = {};
      data[KEYWORD_TracerCatalog_CUSTOMER] = CustomerID;
      data[KEYWORD_TracerCatalog_TRACER] = this.props[PROP_ACTIVE_TRACER];

      message[WEBSOCKET_DATA] = data
      message[WEBSOCKET_DATATYPE] = JSON_TRACER_MAPPING

      this.props[PROP_WEBSOCKET].send(message);
    } else {
      const tracerCatalogID = this.TracerMapping.get(CustomerID);
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_MODEL_DELETE);
      message[WEBSOCKET_DATA_ID] = tracerCatalogID
      message[WEBSOCKET_DATATYPE] = JSON_TRACER_MAPPING;

      this.props[PROP_WEBSOCKET].send(message);
    }
  }

  /**
   * Renders a row in the table, representing the customer
   * @param {Customer} customer - customer to be rendered
   * @returns {Element}
   */
  renderCustomerRow(customer){
    const allowedToOrder = this.TracerMapping.has(customer.id)
    return renderTableRow(customer.id, [
      customer.short_name, <Form.Check
        aria-label={`check-${customer.id}`}
        defaultChecked={allowedToOrder}
        type="checkbox"
        className="mb-2"
        onClick={(event) => this.updateTracerCustomer(event, customer.id)}
      />
    ]);
  }

  renderBody(){
    const customerRows = [];
    const filter = new RegExp(this.state.filter,"g");
    for(const [_customer_id, _customer] of this.props[JSON_CUSTOMER]){
      const /**@type {Customer} */ customer = _customer
      if(filter.test(customer.short_name)) {
        customerRows.push(this.renderCustomerRow(customer));
      }
    }


    return (
    <Container>
      <Row>
      Filter: <FormControl
        aria-label="input-filter"
        value={this.state.filterText}
        onChange={changeState("filter", this).bind(this)}/>
      </Row>
      <Row>
        <Table>
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Kan bestille</th>
            </tr>
          </thead>
          <tbody>
            {customerRows}
          </tbody>
        </Table>
      </Row>
    </Container>);
  }


  render() {

    const/**@type {Tracer} */ tracer = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER])
    // This is a map so the id can be found later, if a TracerCatalog needs to be deleted
    const TracerMapping = new Map();

    for(const [ID, _TracerCatalog ] of this.props[JSON_TRACER_MAPPING]){
      const /**@type {TracerCatalog} */ tracerCatalog = _TracerCatalog

      if(tracerCatalog.tracer == this.props[PROP_ACTIVE_TRACER]){
        TracerMapping.set(tracerCatalog.customer, tracerCatalog.id)
      }
    }

    this.TracerMapping = TracerMapping // Derived Property

    return (
      <Modal
        show={true}
        size="lg"
        onHide={this.props[PROP_ON_CLOSE]}
        className={styles.mariLight}
      >
        <Modal.Header>
          <Modal.Title>Tracer Catalog for {tracer.short_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderBody()}
        </Modal.Body>
        <Modal.Footer>
        <CloseButton
          onClick={this.props[PROP_ON_CLOSE]}
        />
        </Modal.Footer>
      </Modal>
    );
  }
}
