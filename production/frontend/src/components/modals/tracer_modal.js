import React, {useState} from "react";
import propTypes from "prop-types";
import { Container, Form, FormControl, Modal, Row, Table } from "react-bootstrap";

import { PROP_ACTIVE_TRACER, PROP_ON_CLOSE } from "~/lib/constants";
import {DATA_TRACER_MAPPING, WEBSOCKET_DATA,
  WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_MODEL_CREATE,
  WEBSOCKET_MESSAGE_MODEL_DELETE
} from "~/lib/shared_constants";

import { setStateToEvent } from "~/lib/state_management";
import { Tracer, Customer, TracerCatalogPage } from "~/dataclasses/dataclasses";
import { CloseButton } from "../injectable/buttons";
import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { EndpointDisplay } from "../injectable/data_displays/endpoint";
import { FONT } from "~/lib/styles";

export function TracerModal ({active_tracer, on_close}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const [filter, setFilter] = useState("");
  const/**@type {Tracer} */ tracer = state.tracer.get(active_tracer)
    // This is a map so the id can be found later, if a TracerCatalog needs to be deleted
    const TracerMapping = new Map();

    for(const _TracerCatalog of state.tracer_mapping.values()){
      const /**@type {TracerCatalogPage} */ tracerCatalog = _TracerCatalog

      if(tracerCatalog.tracer == active_tracer){
        TracerMapping.set(tracerCatalog.endpoint, tracerCatalog.id)
      }
    }

  function updateTracerCustomer(event, endpointID){
    if(event.target.checked){
      const message = websocket.getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
      const data = {};
      data.endpoint = endpointID;
      data.tracer = active_tracer;

      message[WEBSOCKET_DATA] = data
      message[WEBSOCKET_DATATYPE] = DATA_TRACER_MAPPING

      websocket.send(message);
    } else {
      const tracerCatalogID = TracerMapping.get(endpointID);
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
  function EndpointRow({endpoint}){
    const allowedToOrder = TracerMapping.has(endpoint.id)
    return (<tr>
      <td><EndpointDisplay endpoint={endpoint}/></td>
      <td>
      <Form.Check
        aria-label={`check-${endpoint.id}`}
        defaultChecked={allowedToOrder}
        type="checkbox"
        className="mb-2"
        onClick={(event) => updateTracerCustomer(event, endpoint.id)}
      />
      </td>
    </tr>);
  }

    const customerRows = [];
    const filterRegExp = new RegExp(filter,"g");
    for(const endpoint of state.delivery_endpoint.values()){
      const customer = state.customer.get(endpoint.owner);
      if(filter === ""
          || filterRegExp.test(customer.short_name)
          || filterRegExp.test(endpoint.name)
          ) {
        customerRows.push(<EndpointRow endpoint={endpoint} key={endpoint.id}/>);
      }
    }

    return (
      <Modal
        show={true}
        size="lg"
        onHide={on_close}
        style={FONT.light}
      >
        <Modal.Header>
          <Modal.Title>Tracer Catalog for {tracer.shortname}</Modal.Title>
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
        <CloseButton onClick={on_close} />
      </Modal.Footer>
      </Modal>
    );
}

TracerModal.propTypes = {
  [PROP_ACTIVE_TRACER] : propTypes.number.isRequired,
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
}