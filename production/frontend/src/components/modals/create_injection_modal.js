
import React, { useState } from "react";
import { Button, Col, Form, FormControl, InputGroup, Modal, ModalBody, Row, Table } from "react-bootstrap";

import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box";
import { FormatTime, FormatDateStr, parseDate, dateToDateString, ParseDanishNumber, Capitalize } from "../../lib/formatting";
import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, JSON_INJECTION_ORDER, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,JSON_CUSTOMER,
  JSON_TRACER, JSON_DELIVER_TIME, LEGACY_KEYWORD_INJECTIONS, LEGACY_KEYWORD_USAGE, LEGACY_KEYWORD_COMMENT, LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_TRACER, PROP_ON_CLOSE, JSON_TRACER_MAPPING, TRACER_TYPE_DOSE, WEBSOCKET_MESSAGE_MODEL_CREATE, PROP_ACTIVE_DATE, PROP_WEBSOCKET, JSON_ENDPOINT, INJECTION_USAGE, PROP_USER } from "../../lib/constants";

import styles from '../../css/Site.module.css'
import { Select, toOptions, toOptionsFromEnum } from "../injectable/select";
import { TracershopInputGroup } from '../injectable/tracershop_input_group'
import { Customer, InjectionOrder, Tracer, DeliveryEndpoint } from "../../dataclasses/dataclasses";
import { CloseButton } from "../injectable/buttons";
import { TimeInput } from "../injectable/time_form";
import { setStateToEvent } from "../../lib/state_management";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { UsageSelect } from "../injectable/derived_injectables/usage_select";
import { TracerCatalog } from "../../lib/data_structures";
import { initialize_customer_endpoint_tracer_from_tracerCatalog } from "../../lib/initialization";
import { parseTimeInput, parseWholePositiveNumber } from "../../lib/user_input";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { ErrorInput } from "../injectable/error_input";


export function CreateInjectionOrderModal(props){
  // Initialize select
  let initialization = initialize_customer_endpoint_tracer_from_tracerCatalog(
    props[JSON_ENDPOINT], props[JSON_TRACER_MAPPING]
  )
  const /**@type {TracerWebSocket} */ websocket = props[PROP_WEBSOCKET];

  const [customerID, setCustomer] = useState(initialization.customer);
  const [endpointID, setEndpoint] = useState(initialization.endpoint)
  const [tracerID, setTracer] = useState(initialization.tracer);
  const [usage, setUsage] = useState(1);
  const [injections, setInjections] = useState("");
  const [deliverTime, setDeliveryTime] = useState("")
  const [comment, setComment] = useState("")
  const [errorInjection, setErrorInjection] = useState("")
  const [errorDeliveryTime, setErrorDeliveryTime] = useState("");


  const tracerCatalog = new TracerCatalog(
    props[JSON_TRACER_MAPPING],
    props[JSON_TRACER],
    customerID
  );

  function SubmitOrder(_event){
    //Validation
    const [validInjections, numberInjections] = parseWholePositiveNumber(injections, "Injektioner")
    const [validDeliveryTime, formattedDeliveryTime] = parseTimeInput(deliverTime, "Leverings tid")

    if(!validInjections){
      setErrorInjection(numberInjections)
    }
    if(!validDeliveryTime){
      setErrorDeliveryTime(formattedDeliveryTime)
    }
    if(validDeliveryTime && validInjections){
      websocket.sendCreateModel(JSON_INJECTION_ORDER, new InjectionOrder(
        undefined, // id
        formattedDeliveryTime, // deliver_time
        dateToDateString(props[PROP_ACTIVE_DATE]), // delivery_Date
        numberInjections, // injections
        1, // Status
        usage, // tracer_usage
        comment, // Comment
        props[PROP_USER].id, // Ordered By
        endpointID, // Delivery ID
        tracerID, // Tracer ID
        null, // lot_number
        null, // freed_datetime
        null, // Freed_by
      ))
      props[PROP_ON_CLOSE]()
    }
  }

  const tracerOptions = toOptions(tracerCatalog.getInjectionCatalog(),
                                  'shortname', 'id')

  return(
    <Modal
      show={true}
      onHide={props[PROP_ON_CLOSE]}
      className={styles.mariLight}
    >
      <Modal.Header>
        Opret ny injektion ordre
      </Modal.Header>
      <ModalBody>
        <Row>
          <DestinationSelect
            ariaLabelCustomer="select-customer"
            ariaLabelEndpoint="select-endpoint"
            activeCustomer={customerID}
            activeEndpoint={endpointID}
            customers={props[JSON_CUSTOMER]}
            endpoints={props[JSON_ENDPOINT]}
            setCustomer={setCustomer}
            setEndpoint={setEndpoint}
          />
          <TracershopInputGroup label="Tracer">
            <Select
                aria-label="tracer-select"
                options={tracerOptions}
                onChange={setStateToEvent(setTracer)}
                value={tracerID}

              />
          </TracershopInputGroup>
          <TracershopInputGroup label={"Brug"}>
            <UsageSelect
              aria-label="usage-select"
              onChange={setStateToEvent(setUsage)}
              value={usage}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label={"Injektioner"}>
            <ErrorInput error={errorInjection}>
              <Form.Control
                aria-label="injection-input"
                value={injections}
                onChange={setStateToEvent(setInjections)}
              />
            </ErrorInput>
          </TracershopInputGroup>
          <TracershopInputGroup label={"Leverings tid"}>
            <ErrorInput error={errorDeliveryTime}>
              <TimeInput
                aria-label="delivery-time-input"
                value={deliverTime}
                stateFunction={setDeliveryTime}
              />
            </ErrorInput>
          </TracershopInputGroup>
          <TracershopInputGroup label="Kommentar">
            <Form.Control
              aria-label="comment-input"
              value={comment}
              onChange={setStateToEvent(setComment)}
            />
          </TracershopInputGroup>
        </Row>
      </ModalBody>
      <Modal.Footer>
        <CloseButton onClick={props[PROP_ON_CLOSE]}/>
        <Button onClick={SubmitOrder}>Opret Ordre</Button>
      </Modal.Footer>
    </Modal>);
}