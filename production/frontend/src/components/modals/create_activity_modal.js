import React, { useRef, useState } from "react";
import { Modal, Button, FormControl, InputGroup, Row, Container } from "react-bootstrap";

import { Calculator } from "../injectable/calculator";
import { dateToDateString } from "~/lib/formatting";
import { PROP_ON_CLOSE, PROP_ACTIVE_TRACER, PROP_ACTIVE_DATE,
  PROP_TIME_SLOT_MAPPING } from "~/lib/constants.js"

import { DATA_CUSTOMER, DATA_TRACER, DATA_ISOTOPE, DATA_ENDPOINT, DATA_DELIVER_TIME, DATA_PRODUCTION
} from "~/lib/shared_constants";
import { ActivityDeliveryTimeSlot, ActivityOrder } from "~/dataclasses/dataclasses";
import styles from '../../css/Site.module.css'
import { HoverBox } from "../injectable/hover_box";
import { ClickableIcon } from "../injectable/icons";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box"
import { TracershopInputGroup } from '../injectable/tracershop_input_group'
import { getDay } from "~/lib/chronomancy";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import { setStateToEvent } from "~/lib/state_management";

export function CreateOrderModal({active_date, active_tracer, on_close, timeSlotMapping}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const init = useRef({
    active_customer : null,
    active_endpoint : null,
    active_timeSlot : null,
  });

  if(init.current.active_customer === null
     || init.current.active_endpoint === null
     || init.current.active_timeSlot === null){

      let endpointInit = ""
      let customerInit = ""
      let timeSlotIdInit = ""
      for(const [customerID, endpointMap] of timeSlotMapping){
        customerInit = customerID;
        for(const [endpointID, timeSlotOptions] of endpointMap){
          if(timeSlotOptions.length){
            endpointInit = endpointID
            timeSlotIdInit = timeSlotOptions[0].id
            break
          }
        }
        break;
      }
      init.current = {
        active_customer : endpointInit,
        active_endpoint : customerInit,
        active_timeSlot : timeSlotIdInit,
      }
    }


  const [activeCustomer, setActiveCustomer] = useState(init.current.active_customer);
  const [activeEndpoint, setActiveEndpoint] = useState(init.current.active_endpoint);
  const [activeTimeSlot, setActiveTimeSlot] = useState(init.current.active_timeSlot);

  const [amount, setAmount] = useState("");
  const [showCalculator, setShowCalculator] = useState(false);
  const [error, setError] = useState("");


  function createOrder(_event){
    const [valid, amountNumber] = parseDanishPositiveNumberInput(amount, "Aktiviteten")

    if(!valid){
      setError(amountNumber);
      return;
    }

    websocket.sendCreateActivityOrder(
      new ActivityOrder(undefined, // order_id
                        amountNumber, // ordered_activity
                        dateToDateString(active_date), // delivery_Date
                        1, // status
                        "", // comment
                        activeTimeSlot, // ordered_time_Slot
                        null, // moved_to_time_slot
                        null, // ordered_by, set by backend
                        null, // freed_by
      ))
    on_close();
  }

  function commitCalculator(activity){
    setAmount(activity);
    setShowCalculator(false);

  }

  const day = getDay(active_date);
  const filteredTimeSlots = [...state.deliver_times.values()].filter(
    (timeSlot) => {
      const production = state.production.get(timeSlot.production_run)
      return production.production_day == day;
    }
  )

  const Tracer = state.tracer.get(active_tracer)

  return (
      <Modal
        show={true}
        onHide={on_close}
        className={styles.mariLight}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          { showCalculator ?
          <Calculator
            isotopes={state.isotopes}
            tracer={Tracer}
            productionTime={deliveryDateTime}
            defaultMBq={300}
            cancel={() => {setShowCalculator(false);}}
            commit={commitCalculator}
          /> :
          <Container>
            <Row className={styles.Margin15tb}>
              <DestinationSelect
                ariaLabelCustomer="customer-select"
                ariaLabelEndpoint="endpoint-select"
                ariaLabelTimeSlot="time-slot-select"
                activeCustomer={activeCustomer}
                activeEndpoint={activeEndpoint}
                activeTimeSlot={activeTimeSlot}
                customers={state.customer}
                endpoints={state.delivery_endpoint}
                timeSlots={filteredTimeSlots}
                setCustomer={setActiveCustomer}
                setEndpoint={setActiveEndpoint}
                setTimeSlot={setActiveTimeSlot}
              />
              <TracershopInputGroup label="Aktivitet">
                <FormControl
                  aria-label={"activity-input"}
                  onChange={setStateToEvent(setAmount)}
                  value={state.amount}
                />
                <InputGroup.Text>
                  MBq
                </InputGroup.Text>
                <InputGroup.Text>
                  <ClickableIcon
                    src="/static/images/calculator.svg"
                    onClick={(_event) => {setState({showCalculator : true})}}
                  />
                </InputGroup.Text>
              </TracershopInputGroup>
            </Row>

            { error !== "" ?
            <Row>
              <AlertBox
                message={<div>error</div>}
                level={ERROR_LEVELS.error}
              >
              </AlertBox>
            </Row> : null }
          </Container>
          }

        </Modal.Body>
        <Modal.Footer>
          {showCalculator ? <HoverBox
            Base={<Button disabled={true}>Opret Ordre</Button>}
            Hover={<div>Du kan ikke opret en ordre imens at du bruger lommeregneren</div>}
          ></HoverBox>
           : <Button onClick={createOrder}>Opret Ordre</Button>}
          <Button onClick={on_close}>Luk</Button>
        </Modal.Footer>
      </Modal>
    )
}
