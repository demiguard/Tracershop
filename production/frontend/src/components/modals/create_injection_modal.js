
import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Modal, ModalBody, Row } from "react-bootstrap";
import propTypes, { number } from "prop-types";

import { dateToDateString } from "~/lib/formatting";
import { PROP_ON_CLOSE, PROP_ACTIVE_DATE, ORDER_STATUS } from "~/lib/constants";
import { Select, toOptions } from "../injectable/select";
import { TracershopInputGroup } from '../injectable/inputs/tracershop_input_group'
import { InjectionOrder } from "~/dataclasses/dataclasses";
import { CloseButton, IdempotentButton, MarginButton } from "../injectable/buttons";
import { TimeInput } from "../injectable/inputs/time_input";
import { setStateToEvent } from "../../lib/state_management";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { UsageSelect } from "../injectable/derived_injectables/usage_select";
import { TracerCatalog, useTracerCatalog } from '~/contexts/tracer_catalog';
import { initialize_injection_customer_from_catalog } from "~/lib/initialization";
import { parseTimeInput, parseWholePositiveNumber } from "~/lib/user_input";

import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants";
import { getId } from "~/lib/utils";
import { Optional } from "~/components/injectable/optional";
import { FONT } from "~/lib/styles";
import { useErrorState } from "~/lib/error_handling";


export function CreateInjectionOrderModal({on_close}){
  const state = useTracershopState();
  const active_date = state.today;
  const websocket = useWebsocket();
  const tracerCatalog = useTracerCatalog();

  const initialization = initialize_injection_customer_from_catalog(
    state.delivery_endpoint, state.tracer_mapping, state
  );

  const [customerID, setCustomer] = useState(initialization.customer);
  const [endpointID, setEndpoint] = useState(initialization.endpoint)
  const [tracerID, setTracer] = useState(initialization.tracer);
  const [usage, setUsage] = useState(0);
  const [injections, setInjections] = useState("");
  const [deliverTime, setDeliveryTime] = useState("")
  const [comment, setComment] = useState("")
  const [errorInjection, setErrorInjection] = useErrorState()
  const [errorDeliveryTime, setErrorDeliveryTime] = useErrorState();

  // Can send
  const canOrder = !!endpointID && !!tracerID;

  function SubmitOrder(){
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
          ORDER_STATUS.ORDERED, // Status
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
      style={FONT.light}
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
          <TracershopInputGroup
              label={"Injektioner"}
              error={errorInjection}
              data-testid={"injection-input-group"}
          >
            <Form.Control
              aria-label="injection-input"
              value={injections}
              onChange={setStateToEvent(setInjections)}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label={"Leverings tid"} error={errorDeliveryTime}>
            <TimeInput
              aria-label="delivery-time-input"
              value={deliverTime}
              stateFunction={setDeliveryTime}
            />
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
        <Optional exists={canOrder} alternative={<Button disabled={true}>Opret ordre</Button>}>
          <Button onClick={SubmitOrder}>Opret ordre</Button>
        </Optional>
        <CloseButton onClick={on_close}/>
      </Modal.Footer>
    </Modal>);
}

CreateInjectionOrderModal.propTypes = {
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
}