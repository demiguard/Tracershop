
import React, { useState } from "react";
import { Button, Col, Form, FormControl, InputGroup, Modal, ModalBody, Row, Table } from "react-bootstrap";

import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box";
import { FormatTime, FormatDateStr, parseDate, dateToDateString, ParseDanishNumber } from "../../lib/formatting";
import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, JSON_INJECTION_ORDER, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,JSON_CUSTOMER,
  JSON_TRACER, JSON_DELIVER_TIME, LEGACY_KEYWORD_INJECTIONS, LEGACY_KEYWORD_USAGE, LEGACY_KEYWORD_COMMENT, LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_TRACER, PROP_ON_CLOSE, JSON_TRACER_MAPPING, TRACER_TYPE_DOSE, WEBSOCKET_MESSAGE_MODEL_CREATE, PROP_ACTIVE_DATE, PROP_WEBSOCKET, JSON_ENDPOINT } from "../../lib/constants";

import styles from '../../css/Site.module.css'
import { Select } from "../injectable/select";
import { TracershopInputGroup } from '../injectable/tracershop_input_group'
import { Customer, InjectionOrder, Tracer, TracerCatalog, DeliveryEndpoint } from "../../dataclasses/dataclasses";
import { event } from "jquery";
import { CloseButton } from "../injectable/buttons";


export { CreateInjectionOrderModal }

function CreateInjectionOrderModal(props){
  const /**@type {Map<Number, Array<Number>>} */ tracerCatalog = new Map()

  for(const [id, _tracerCatalogPage] of props[JSON_TRACER_MAPPING]){
    const /**@type {TracerCatalog} */ tracerCatalogPage = _tracerCatalogPage;
      const /**@type {Tracer} */ tracer = props[JSON_TRACER].get(tracerCatalogPage.tracer)
      if(!(tracer.tracer_type === TRACER_TYPE_DOSE)){
        continue;
      }
      if (tracerCatalog.has(tracerCatalogPage.customer)){
        const customerCatalog = tracerCatalog.get(tracerCatalogPage.customer);
        customerCatalog.push(tracerCatalogPage.tracer);
      } else {
        const customerCatalog = [tracerCatalogPage.tracer];

        tracerCatalog.set(tracerCatalogPage.customer, customerCatalog);
      }
    }

  // Initialize select
  let customerInit;
  let tracerInit;
  for(const [cid, customerCatalog] of tracerCatalog){
    customerInit = cid;
    tracerInit = customerCatalog[0]
    break;
  }

  const /**@type {Array<DeliveryEndpoint} */ endpoints = [...props[JSON_ENDPOINT].values()].filter(
    (endpoint) => {
      return endpoint.owner === customerInit;
    });

  const [customerID, setCustomer] = useState(customerInit);
  const [endpointID, setEndpoint] = useState(endpoints[0].id)
  const [tracerID, setTracer] = useState(tracerInit);
  const [usage, setUsage] = useState(1);
  const [injections, setInjections] = useState("");
  const [deliverTime, setDeliveryTime] = useState("")
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")

  // eventFunctions
  function SubmitOrder(_event){
    //Validation
    const injectionsNumber = ParseDanishNumber(injections);
    if(!injections){
      setError("Der er ikke indtastet hvor mange injektioner der skal bestilles")
      return
    }

    if(isNaN(injectionsNumber)){
      setError("Injektionerne er ikke et tal");
      return;
    }

    if(injectionsNumber <= 0){
      setError("Der skal bestilles et positivt mængde af injectioner")
      return;
    }

    if(injectionsNumber != Math.floor(injectionsNumber)){
      setError("Der kan kun bestilles et helt antal injektioners")
      return
    }

    const formattedDeliverTime = FormatTime(deliverTime);
    if(formattedDeliverTime === null){
      setError("Leverings tidspunktet er ikke et valid");
      return;
    }

    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MODEL_CREATE);
    const data_object = new InjectionOrder(
      undefined, // id
      formattedDeliverTime, // deliver_time
      dateToDateString(props[PROP_ACTIVE_DATE]), // delivery_Date
      injectionsNumber, // injections
      1, // Status
      usage,
      comment,
      undefined,
      endpointID,
      tracerID,
      null,
      null,
      null,
    );
    message[WEBSOCKET_DATA] = [data_object];
    message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
    props[PROP_WEBSOCKET].send(message);
    props[PROP_ON_CLOSE]()
  }

  const customerOptions = [...props[JSON_CUSTOMER].values()].map(
      (_customer) => {
        const /**@type {Customer} */ customer = _customer;
        return {
          id : customer.id,
          name : customer.short_name
        };
      }
    )

  const EndpointOptions = endpoints.map(
    (endpoint) => {return {
        id : endpoint.id,
        name : endpoint.name,
      }
    }
  )

  const endpoint = props[JSON_ENDPOINT].get(endpointID)

  let endpointForm = (<FormControl aria-label="endpoint-form" value={endpoint.name} readOnly/>)
  if (1 < EndpointOptions.length){
    endpointForm = <Select
      aria-label="endpoint-form"
      options={EndpointOptions}
      valueKey="id"
      nameKey="name"
      onChange={(event) => {setEndpoint(event.target.value)}}
      value={endpointID}
    ></Select>
  }


  const tracerOptions = [...props[JSON_TRACER].values()].map(
    (_tracer) => {
      const /**@type {Tracer} */ tracer = _tracer
      return {
          id : tracer.id,
          name : tracer.shortname,
        }
      }
    )


  const UsageOptions = [ // TODO: Remove magic
    {value: 1, name: "Human"},
    {value: 2, name: "Dyr"},
    {value: 3, name: "Andet"},
  ];

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
          <TracershopInputGroup label="Kunde">
            <Select
                aria-label="customer-select"
                options={customerOptions}
                valueKey="id"
                nameKey="name"
                onChange={(event) => {setCustomer(Number(event.target.value))}}
                value={customerID}
              />
          </TracershopInputGroup>
          <TracershopInputGroup label="Leveringssted">
            {endpointForm}
          </TracershopInputGroup>
          <TracershopInputGroup label="Tracer">
            <Select
                aria-label="tracer-select"
                options={tracerOptions}
                valueKey="id"
                nameKey="name"
                onChange={(event) => {setTracer(Number(event.target.value))}}
                value={tracerID}

              />
          </TracershopInputGroup>
          <TracershopInputGroup label={"Brug"}>
            <Select
              aria-label="usage-select"
              options={UsageOptions}
              nameKey="name"
              valueKey="value" // wtf naming
              onChange={(event) => {setUsage(Number(event.target.value))}}
              value={usage}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label={"Injektioner"}>
            <Form.Control
                aria-label="injection-input"
                value={injections}
                onChange={(event) => {setInjections(event.target.value)}}
              />
          </TracershopInputGroup>
          <TracershopInputGroup label={"Leverings tid"}>
            <Form.Control
              aria-label="delivery-time-input"
              value={deliverTime}
              onChange={(event) => {setDeliveryTime(event.target.value)}}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label="Kommentar">
            <Form.Control
              aria-label="comment-input"
              value={comment}
              onChange={(event) => {setComment(event.target.value)}}
            />
          </TracershopInputGroup>
        </Row>
        { error != "" ? <Row><AlertBox
          level={ERROR_LEVELS.error}
          message={error}
           /></Row> : "" }
      </ModalBody>
      <Modal.Footer>
        <CloseButton onClick={props[PROP_ON_CLOSE]}></CloseButton>
        <Button onClick={SubmitOrder}>Opret Ordre</Button>
      </Modal.Footer>
    </Modal>);
}