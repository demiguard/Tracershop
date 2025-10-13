import React, { useState } from "react";
import { Container, FormControl, Modal, Row } from "react-bootstrap";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { DateDisplay } from "../injectable/data_displays/date_display";
import { CloseButton } from "../injectable/buttons";
import { getDay } from "~/lib/chronomancy";
import { endpointFilter, isotopeDeliveryFilter } from "~/lib/filters";
import { CustomerSelect } from "../injectable/derived_injectables/customer_select";
import { FONT } from "~/lib/styles";
import { Customer, DeliveryEndpoint, IsotopeDelivery, TracershopState } from "~/dataclasses/dataclasses";
import { EndpointSelect } from "../injectable/derived_injectables/endpoint_select";
import { TimeSlotSelect } from "../injectable/derived_injectables/timeslot_select";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { EditableInput } from "../injectable/inputs/editable_input";
import { ErrorInput } from "../injectable/inputs/error_input";
import { useErrorState } from "~/lib/error_handling";
import { IsotopeTimeSlotSelect } from "../injectable/derived_injectables/isotope_time_slot_select";
import { setStateToEvent } from "~/lib/state_management";
import { Optional } from "../injectable/optional";
import { IsotopeDisplay } from "../injectable/data_displays/isotope_display";
import { DayDisplay } from "../injectable/data_displays/day_display";

type CustomerState = {
  deliveries : Array<IsotopeDelivery>,
  endpoints : Array<DeliveryEndpoint>,
  customers : Array<Customer>,

  selectedDelivery : number | "",
  selectedEndpoint : number | "",
  selectedCustomer : number | "",
}

export function CreateIsotopeOrderModal({on_close, active_isotope}){
  const state = useTracershopState();
  const day = getDay(state.today);

  // State
  const [displayActivity, setDisplayActivity] = useState("");
  const [errorActivity, setErrorActivity] = useErrorState();
  const [customerState, setCustomerState] = useState<CustomerState>(() => {
    const deliveries = isotopeDeliveryFilter(state, {
      day : day,
      isotopeID : active_isotope,
      state : state
    });

    const validCustomers = new Set<Customer>();
    const validEndpoints = new Set<DeliveryEndpoint>();

    for(const delivery of deliveries){
      const endpoint = state.delivery_endpoint.get(delivery.delivery_endpoint);
      validEndpoints.add(endpoint);
      validCustomers.add(state.customer.get(endpoint.owner));
    }

    const selectedDelivery = deliveries.length ? deliveries[0] : null;
    const selectedEndpoint = selectedDelivery ? state.delivery_endpoint.get(selectedDelivery.delivery_endpoint) : null
    const selectedCustomer = selectedEndpoint ? state.customer.get(selectedEndpoint.owner) : null

    return {
      deliveries : deliveries,
      endpoints : [...validEndpoints],
      customers : [...validCustomers],

      selectedDelivery : selectedDelivery ? selectedDelivery.id : "",
      selectedEndpoint : selectedEndpoint ? selectedEndpoint.id : "",
      selectedCustomer : selectedCustomer ? selectedCustomer.id : "",
    }
  });

  function changeCustomer(event: React.ChangeEvent<HTMLSelectElement>){
    setCustomerState(old => {
      const newCustomerID = Number(event.target.value);
      const endpointOptions = endpointFilter(customerState.endpoints, {owner : newCustomerID});
      const newSelectedEndpoint = endpointOptions.length ? endpointOptions[0] : null;

      const delivery = newSelectedEndpoint ? isotopeDeliveryFilter(old.deliveries, { endpointID : newSelectedEndpoint.id })[0] : null

      return {
        ...old,
        selectedCustomer : newCustomerID ? newCustomerID : "",
        selectedEndpoint : newSelectedEndpoint ? newSelectedEndpoint.id : "",
        selectedDelivery : delivery ? delivery.id : ""
      };
    })
  }

  function changeEndpoint(event: React.ChangeEvent<HTMLSelectElement>){
    setCustomerState(old => {
      const newEndpointID = Number(event.target.value);

      const delivery = isotopeDeliveryFilter(old.deliveries, { endpointID : newEndpointID })[0];

      return {
        ...old,
        selectedEndpoint : newEndpointID ? newEndpointID : "",
        selectedDelivery : delivery ? delivery.id : ""
      }
    });
  }

  function changeDelivery(event: React.ChangeEvent<HTMLSelectElement>){
    setCustomerState(old => {
      const deliveryID = Number(event.target.value);

      return {
        ...old,
        selectedDelivery : deliveryID ? deliveryID : ""
      }
    })
  }

  const endpointOptions = endpointFilter(
    customerState.endpoints,
    { owner : customerState.selectedCustomer }
  );

  const deliveryOptions = isotopeDeliveryFilter(
    customerState.deliveries,
    { endpointID : customerState.selectedEndpoint }
  );

  const noDeliveriesJSX = <p>
    Der er ingen levering af <IsotopeDisplay isotope={active_isotope}/> om <DayDisplay day={day}/>
    <br/>
    En adminstrator skal oprette dem under `Opsætning` - `Kunde`
  </p>


  return (
    <Modal
      show={true}
      onHide={on_close}
      style={FONT.light}
    >
      <Modal.Header>
        <h2>
          Opret isotop ordre - <DateDisplay date={state.today}/>
        </h2>
      </Modal.Header>
      <Modal.Body>
        <Container>
        <Optional exists={customerState.deliveries.length > 0} alternative={noDeliveriesJSX}>
          <Row>
            <CustomerSelect
              data-testid="isotope-order-create-customer"
              customers={customerState.customers}
              onChange={changeCustomer}
              value={customerState.selectedCustomer}
            />
          </Row>
          <Row>
            <EndpointSelect
              data-testid="isotope-order-create-endpoint"
              delivery_endpoint={endpointOptions}
              value={customerState.selectedEndpoint}
              onChange={changeEndpoint}
            />
          </Row>
          <Row>
            <IsotopeTimeSlotSelect
              data-testid="isotope-order-create-deliveries"
              deliveries={deliveryOptions}
              value={customerState.selectedDelivery}
              onChange={changeDelivery}
            />
          </Row>
          <Row>
            <TracershopInputGroup error={errorActivity} label="Aktivitet" tail="MBq">
              <FormControl value={displayActivity} onChange={setStateToEvent(setDisplayActivity)}/>
            </TracershopInputGroup>
          </Row>
          </Optional>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <CloseButton onClick={on_close}/>
      </Modal.Footer>
    </Modal>
  );
}