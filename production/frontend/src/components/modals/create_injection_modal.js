
import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Modal, ModalBody, Row } from "react-bootstrap";

import { dateToDateString } from "~/lib/formatting";
import { PROP_ON_CLOSE, PROP_ACTIVE_DATE } from "~/lib/constants";
import styles from '~/css/Site.module.css'
import { Select, toOptions } from "../injectable/select";
import { TracershopInputGroup } from '../injectable/inputs/tracershop_input_group'
import { InjectionOrder } from "~/dataclasses/dataclasses";
import { CloseButton, MarginButton } from "../injectable/buttons";
import { TimeInput } from "../injectable/inputs/time_input";
import { setStateToEvent } from "../../lib/state_management";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { UsageSelect } from "../injectable/derived_injectables/usage_select";
import { TracerCatalog } from "~/lib/data_structures";
import { initialize_customer_endpoint_tracer_from_tracerCatalog } from "~/lib/initialization";
import { parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input";

import { ErrorInput } from "../injectable/inputs/error_input";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import propTypes from "prop-types";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants";
import { getId } from "~/lib/utils";
import { Optional } from "~/components/injectable/optional";


export function CreateInjectionOrderModal({active_date, on_close}){
  const state = useTracershopState();
  const websocket = useWebsocket();
  // Initialize select


  const initialization = useRef({
    customer : null,
    endpoint : null,
    tracer : null,
  });

  if(initialization.current.customer === null
      || initialization.current.endpoint === null
      || initialization.current.tracer === null
    ){
    initialization.current = initialize_customer_endpoint_tracer_from_tracerCatalog(
      state.delivery_endpoint, state.tracer_mapping
    );
  }

  const tracerCatalog = new TracerCatalog(
    state.tracer_mapping,
    state.tracer,
  );

  const [customerID, setCustomer] = useState(initialization.current.customer);
  const [endpointID, setEndpoint] = useState(initialization.current.endpoint)
  const [tracerID, setTracer] = useState(initialization.current.tracer);
  const [usage, setUsage] = useState(0);
  const [injections, setInjections] = useState("");
  const [deliverTime, setDeliveryTime] = useState("")
  const [comment, setComment] = useState("")
  const [errorInjection, setErrorInjection] = useState("")
  const [errorDeliveryTime, setErrorDeliveryTime] = useState("");

  // Can send
  const canOrder = !!endpointID && !!tracerID;


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
      websocket.sendCreateModel(
        DATA_INJECTION_ORDER,
        new InjectionOrder(
          undefined, // id
          formattedDeliveryTime, // deliver_time
          dateToDateString(active_date), // delivery_Date
          numberInjections, // injections
          1, // Status
          usage, // tracer_usage
          comment, // Comment
          state.logged_in_user.id, // Ordered By
          endpointID, // Delivery ID
          tracerID, // Tracer ID
          null, // lot_number
          null, // freed_datetime
          null, // freed_by
      ));
      on_close();
    }
  }

  const tracerOptions = toOptions(tracerCatalog.getInjectionCatalog(endpointID),
                                  'shortname', 'id')

  useEffect(() => {
    const newOptions = tracerCatalog.getInjectionCatalog(endpointID);
    const newOptionsIDs = newOptions.map(getId);
    if(!(newOptionsIDs.includes(tracerID))){
      if(newOptions.length){
        setTracer(newOptions[0].id);
      } else {
        setTracer("");
      }
    }
  }, [endpointID])

  return(
    <Modal
      show={true}
      onHide={on_close}
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
            customers={state.customer}
            endpoints={state.delivery_endpoint}
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
        <Optional exists={canOrder} alternative={<Button disabled={true}>Opret Ordre</Button>}>
          <Button onClick={SubmitOrder}>Opret Ordre</Button>
        </Optional>
        <CloseButton onClick={on_close}/>
      </Modal.Footer>
    </Modal>);
}

CreateInjectionOrderModal.propTypes = {
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
  [PROP_ACTIVE_DATE] : propTypes.objectOf(Date),
}