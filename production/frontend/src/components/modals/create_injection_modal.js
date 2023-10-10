
import React, { useState } from "react";
import { Button, Form, Modal, ModalBody, Row } from "react-bootstrap";

import { dateToDateString } from "~/lib/formatting";
import { PROP_ON_CLOSE, PROP_ACTIVE_DATE, PROP_USER } from "~/lib/constants";
import { DATA_TRACER_MAPPING, DATA_CUSTOMER, DATA_TRACER, DATA_INJECTION_ORDER, DATA_ENDPOINT } from "~/lib/shared_constants"
import styles from '~/css/Site.module.css'
import { Select, toOptions } from "../injectable/select";
import { TracershopInputGroup } from '../injectable/tracershop_input_group'
import { InjectionOrder } from "~/dataclasses/dataclasses";
import { CloseButton } from "../injectable/buttons";
import { TimeInput } from "../injectable/time_form";
import { setStateToEvent } from "../../lib/state_management";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { UsageSelect } from "../injectable/derived_injectables/usage_select";
import { TracerCatalog } from "~/lib/data_structures";
import { initialize_customer_endpoint_tracer_from_tracerCatalog } from "~/lib/initialization";
import { parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input";
import { TracerWebSocket } from "~/lib/tracer_websocket";
import { ErrorInput } from "../injectable/error_input";
import { useWebsocket } from "../tracer_shop_context";


export function CreateInjectionOrderModal(props){
  // Initialize select
  let initialization = initialize_customer_endpoint_tracer_from_tracerCatalog(
    props[DATA_ENDPOINT], props[DATA_TRACER_MAPPING]
  )

  const tracerCatalog = new TracerCatalog(
    props[DATA_TRACER_MAPPING],
    props[DATA_TRACER],
  );
  const websocket = useWebsocket();

  const [customerID, setCustomer] = useState(initialization.customer);
  const [endpointID, setEndpoint] = useState(initialization.endpoint)
  const [tracerID, setTracer] = useState(initialization.tracer);
  const [usage, setUsage] = useState(1);
  const [injections, setInjections] = useState("");
  const [deliverTime, setDeliveryTime] = useState("")
  const [comment, setComment] = useState("")
  const [errorInjection, setErrorInjection] = useState("")
  const [errorDeliveryTime, setErrorDeliveryTime] = useState("");

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
      websocket.sendCreateInjectionOrder(new InjectionOrder(
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

  const tracerOptions = toOptions(tracerCatalog.getInjectionCatalog(customerID),
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
            customers={props[DATA_CUSTOMER]}
            endpoints={props[DATA_ENDPOINT]}
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