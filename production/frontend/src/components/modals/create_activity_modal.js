import React, { useRef, useState } from "react";
import { Modal, Button, FormControl, Row, Container } from "react-bootstrap";

import { Calculator } from "../injectable/calculator";
import { dateToDateString } from "~/lib/formatting";
import { ActivityOrder } from "~/dataclasses/dataclasses";
import { ClickableIcon } from "../injectable/icons";
import { TracershopInputGroup } from '../injectable/inputs/tracershop_input_group'
import { getDay } from "~/lib/chronomancy";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";
import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { setStateToEvent } from "~/lib/state_management";
import { DATA_ACTIVITY_ORDER } from "~/lib/shared_constants";
import { NEW_LOCAL_ID, ORDER_STATUS } from "~/lib/constants";
import { Optional } from "~/components/injectable/optional";
import { FONT, MARGIN } from "~/lib/styles";

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

    websocket.sendCreateModel(DATA_ACTIVITY_ORDER,
      new ActivityOrder(NEW_LOCAL_ID, // order_id
                        amountNumber, // ordered_activity
                        dateToDateString(active_date), // delivery_Date
                        ORDER_STATUS.ACCEPTED, // status
                        "Lavet af productionen", // comment
                        activeTimeSlot, // ordered_time_Slot
                        null, // moved_to_time_slot
                        null, // freed_datetime
                        state.logged_in_user.id, // ordered_by
                        null, // freed_by
      ));
    on_close();
  }

  function commitCalculator(activity){
    setAmount(activity);
    setShowCalculator(false);
  }

  const day = getDay(active_date);
  const filteredTimeSlots = [...state.deliver_times.values()].filter(
    (timeSlot) => {
      const production = state.production.get(timeSlot.production_run);
      return production.production_day == day;
    }
  )

  const canCreate = !((!!activeCustomer) && (!!activeEndpoint) && (!!activeTimeSlot) && (!showCalculator) && (!!amount));
  const Tracer = state.tracer.get(active_tracer);
  const dateString = dateToDateString(active_date)
  const deliveryTimeSlot = state.deliver_times.get(activeTimeSlot);
  const deliveryTime = deliveryTimeSlot ? new Date(`${dateString} ${deliveryTimeSlot.delivery_time}`) : NaN;
  const canCalculator = !isNaN(deliveryTime); // Note that js considers date object as numbers, and invalid dates are isomorphic to NaN

  return (
      <Modal
        show={true}
        onHide={on_close}
        style={FONT.light}
      >
        <Modal.Header> Opret Order </Modal.Header>
        <Modal.Body>
          { showCalculator ?
          <Calculator
            isotopes={state.isotopes}
            tracer={Tracer}
            productionTime={deliveryTime}
            defaultMBq={300}
            cancel={() => {setShowCalculator(false);}}
            commit={commitCalculator}
          /> :
          <Container>
            <Row style={MARGIN.topBottom.px15}>
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
              <TracershopInputGroup label="Aktivitet" error={error} tail={"Mbq"}>
                <FormControl
                  aria-label={"activity-input"}
                  onChange={setStateToEvent(setAmount)}
                  value={amount}
                />
              </TracershopInputGroup>
            </Row>
          </Container>
          }

        </Modal.Body>
        <Modal.Footer>
          <Optional exists={!canCreate} alternative={
            <Button disabled={true}>Opret Ordre</Button>}>
            <Button onClick={createOrder}>Opret Ordre</Button>
          </Optional>
          <Optional exists={canCalculator && !showCalculator}>
            <ClickableIcon
              onClick={(_event) => {setShowCalculator(true);}}
              src="/static/images/calculator.svg"
            />
          </Optional>
          <Button onClick={on_close}>Luk</Button>
        </Modal.Footer>
      </Modal>
    )
}
