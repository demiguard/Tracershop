/**This is a select, that is used for customers and endpoints together.
 * The Main problem about this select is that there's cascading effects.
 * So if a customer changes, then the endpoint changes and if the endpoint
 * changes then the timeSlots should change as well
 */

import React from 'react'

import { Customer, DeliveryEndpoint, Tracer, ActivityDeliveryTimeSlot } from "../../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../inputs/tracershop_input_group";
import { CustomerSelect } from "./customer_select";
import { EndpointSelect } from "./endpoint_select";
import { TimeSlotSelect } from "./timeslot_select";
import { getRelatedTimeSlots } from '../../../lib/data_structures';
import propType from 'prop-types'

/**
 *
 * @param {{
 * ariaLabelCustomer : String | undefined,
 * ariaLabelEndpoint : String | undefined,
 * ariaLabelTimeSlot : String | undefined,
 * activeCustomer : Number,
 * activeEndpoint : Number,
 * activeTimeSlot : Number | undefined,
 * customer : Map<Number, Customer>,
 * endpoints : Map<Number, DeliveryEndpoint>,
 * timeSlots : Map<Number, ActivityDeliveryTimeSlot> | Array<ActivityDeliveryTimeSlot> | undefined,
 * setCustomer : Callable,
 * setEndpoint : Callable,
 * setTimeSlot : Callable | undefined,
 * }} param0
 * @returns {Element}
 */
export function DestinationSelect({activeCustomer, activeEndpoint, activeTimeSlot,
                                   ariaLabelCustomer, ariaLabelEndpoint, ariaLabelTimeSlot,
                                   customers, endpoints, timeSlots,
                                   setCustomer, setEndpoint, setTimeSlot }){
  const filteredEndpoints = [...endpoints.values()].filter(
    (endpoint) => {return activeCustomer == endpoint.owner;}
  );

  const withTimeSlots = setTimeSlot !== undefined && timeSlots !== undefined;

  function setTimeSlotToNewEndpoint(rawEndpointID){
    if(withTimeSlots){
      const newEndpointID = (rawEndpointID !== "") ? Number(rawEndpointID) : "";
      const newTimeSlots = getRelatedTimeSlots(timeSlots, newEndpointID);
      if(newTimeSlots.length === 0){
        setTimeSlot("");
      } else {
        setTimeSlot(newTimeSlots[0].id)
      }
    }
  }

  function setEndpointToNewCustomer(rawCustomerID){
    const newEndpoints = [...endpoints.values()].filter(
      (endpoint) => {
        return rawCustomerID === endpoint.owner
      })

    let newEndpointID = (0 === newEndpoints.length) ? "" : newEndpoints[0].id;
    setEndpoint(newEndpointID);
    setTimeSlotToNewEndpoint(newEndpointID)
  }

  function onChangeCustomer(event){
    const newCustomerID = (event.target.value === "") ? "" : Number(event.target.value);
    setCustomer(newCustomerID);
    setEndpointToNewCustomer(newCustomerID)
  }

  function onChangeEndpoint(event){
    const newEndpointID = (event.target.value === "") ? "" : Number(event.target.value);
    setEndpoint(newEndpointID);
    setTimeSlotToNewEndpoint(newEndpointID);
  }

  let thirdColumn = "";
  if(withTimeSlots){
    function onChangeTimeSlot(event){
      const timeSlotID = (event.target.value === "") ? "" : Number(event.target.value)
      setTimeSlot(timeSlotID);
    }

    const filteredTimeSlots = getRelatedTimeSlots(timeSlots, activeEndpoint);

    thirdColumn = <TracershopInputGroup label="Leverings tid">
      <TimeSlotSelect
        aria-label={ariaLabelTimeSlot}
        deliver_times={filteredTimeSlots}
        value={activeTimeSlot}
        onChange={onChangeTimeSlot}
      />
    </TracershopInputGroup>
  }

  return (<div>
    <TracershopInputGroup label="Kunde">
      <CustomerSelect
        aria-label={ariaLabelCustomer}
        value={activeCustomer}
        customers={customers}
        onChange={onChangeCustomer}
      />
    </TracershopInputGroup>
    <TracershopInputGroup label="Destination">
      <EndpointSelect
        aria-label={ariaLabelEndpoint}
        delivery_endpoint={filteredEndpoints}
        value={activeEndpoint}
        onChange={onChangeEndpoint}
      />
    </TracershopInputGroup>
    {thirdColumn}
  </div>)
}

DestinationSelect.propType = {
  ariaLabelCustomer : propType.string,
  ariaLabelEndpoint :  propType.string,
  ariaLabelTimeSlot :  propType.string,
  activeCustomer :  propType.number.isRequired,
  activeEndpoint : propType.number.isRequired,
  activeTimeSlot : propType.number,
  customers : propType.instanceOf(Map).isRequired,
  endpoints : propType.instanceOf(Map).isRequired,
  timeSlots : propType.oneOfType([Map, propType.arrayOf(ActivityDeliveryTimeSlot)]),
  setCustomer : propType.func.isRequired,
  setEndpoint : propType.func.isRequired,
  setTimeSlot : propType.func,
}
