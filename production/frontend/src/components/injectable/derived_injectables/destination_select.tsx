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

type DestinationSelectProps = {
  activeCustomer :  number | string,
  activeEndpoint :  number | string,
  activeTimeSlot? : number | string,
  ariaLabelCustomer? : string ,
  ariaLabelEndpoint? : string ,
  ariaLabelTimeSlot? : string ,
  customers : Map<number, Customer>,
  endpoints : Map<number, DeliveryEndpoint>,
  timeSlots? : Map<number, ActivityDeliveryTimeSlot> | Array<ActivityDeliveryTimeSlot>,
  setCustomer :  (id : number | string) => void,
  setEndpoint :  (id : number | string) => void,
  setTimeSlot? : (id : number | string) => void
}


export function DestinationSelect({activeCustomer, activeEndpoint, activeTimeSlot,
                                   ariaLabelCustomer, ariaLabelEndpoint, ariaLabelTimeSlot,
                                   customers, endpoints, timeSlots,
                                   setCustomer, setEndpoint, setTimeSlot } : DestinationSelectProps){
  const filteredEndpoints = [...endpoints.values()].filter(
    (endpoint) => {return activeCustomer == endpoint.owner;}
  );

  const withTimeSlots = setTimeSlot !== undefined && timeSlots !== undefined;

  function setTimeSlotToNewEndpoint(rawEndpointID){
    if(withTimeSlots){
      const newEndpointID = (rawEndpointID !== "") ? Number(rawEndpointID) : 0;
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

  let thirdColumn = <div></div>;
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
