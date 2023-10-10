import React, {Component, useState} from "react";

import { Container, Form, FormControl, Modal, Row, Table } from "react-bootstrap";

import { PROP_ACTIVE_TRACER, PROP_ON_CLOSE } from "~/lib/constants";

import {DATA_CUSTOMER, DATA_TRACER, DATA_TRACER_MAPPING, WEBSOCKET_DATA,
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_MODEL_CREATE,
  WEBSOCKET_MESSAGE_MODEL_DELETE
} from "~/lib/shared_constants";

import { renderTableRow } from "~/lib/rendering";
import { setStateToEvent } from "~/lib/state_management";

import propTypes from "prop-types";

import styles from '~/css/Site.module.css';
import { Tracer, Customer, TracerCatalogPage } from "~/dataclasses/dataclasses";
import { CloseButton } from "../injectable/buttons";
import { useWebsocket } from "../tracer_shop_context";


export function TracerModal (props) {
  const websocket = useWebsocket();
  const [filter, setFilter] = useState("");
  const/**@type {Tracer} */ tracer = props[DATA_TRACER].get(props[PROP_ACTIVE_TRACER])
    // This is a map so the id can be found later, if a TracerCatalog needs to be deleted
    const TracerMapping = new Map();

    for(const [ID, _TracerCatalog ] of props[DATA_TRACER_MAPPING]){
      const /**@type {TracerCatalogPage} */ tracerCatalog = _TracerCatalog

      if(tracerCatalog.tracer == props[PROP_ACTIVE_TRACER]){
        TracerMapping.set(tracerCatalog.customer, tracerCatalog.id)
      }
    }

  function updateTracerCustomer(event, CustomerID){
    if(event.target.checked){
      const message = websocket.getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
      const data = {};
      data.customer = CustomerID;
      data.tracer = props[PROP_ACTIVE_TRACER];

      message[WEBSOCKET_DATA] = data
      message[WEBSOCKET_DATATYPE] = DATA_TRACER_MAPPING

      websocket.send(message);
    } else {
      const tracerCatalogID = TracerMapping.get(CustomerID);
      const message = websocket.getMessage(WEBSOCKET_MESSAGE_MODEL_DELETE);
      message[WEBSOCKET_DATA_ID] = tracerCatalogID
      message[WEBSOCKET_DATATYPE] = DATA_TRACER_MAPPING;

      websocket.send(message);
    }
  }

  /**
   * Renders a row in the table, representing the customer
   * @param {Customer} customer - customer to be rendered
   * @returns {Element}
   */
  function CustomerRow(customer){
    const allowedToOrder = TracerMapping.has(customer.id)
    return renderTableRow(customer.id, [
      customer.short_name, <Form.Check
        aria-label={`check-${customer.id}`}
        defaultChecked={allowedToOrder}
        type="checkbox"
        className="mb-2"
        onClick={(event) => updateTracerCustomer(event, customer.id)}
      />
    ]);
  }

    const customerRows = [];
    const filterRegExp = new RegExp(filter,"g");
    for(const [_customer_id, _customer] of props[DATA_CUSTOMER]){
      const /**@type {Customer} */ customer = _customer
      if(filterRegExp.test(customer.short_name)) {
        customerRows.push(CustomerRow(customer));
      }
    }

    return (
      <Modal
        show={true}
        size="lg"
        onHide={props[PROP_ON_CLOSE]}
        className={styles.mariLight}
      >
        <Modal.Header>
          <Modal.Title>Tracer Catalog for {tracer.short_name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Container>
          <Row>
          Filter: <FormControl
            aria-label="input-filter"
            value={filter}
            onChange={setStateToEvent(setFilter)}/>
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
      </Container>
      </Modal.Body>
      <Modal.Footer>
        <CloseButton onClick={props[PROP_ON_CLOSE]} />
        </Modal.Footer>
      </Modal>
    );
}

TracerModal.propTypes = {
  [DATA_CUSTOMER] : propTypes.objectOf(Map).isRequired,
  [DATA_TRACER_MAPPING] : propTypes.objectOf(Map).isRequired,
  [PROP_ACTIVE_TRACER] : propTypes.number.isRequired,
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
  [DATA_TRACER] : propTypes.objectOf(Map).isRequired,
}