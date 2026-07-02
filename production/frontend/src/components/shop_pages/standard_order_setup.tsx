import React, { useMemo, useState } from "react";
import { Button, ButtonGroup, Col, Container, FormControl, InputGroup, Row } from "react-bootstrap";
import { useDeliveryCodex } from "~/contexts/delivery_codex";
import { useTracerCatalog } from "~/contexts/tracer_catalog";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { ActivityDeliveryTimeSlot, StandardOrder } from "~/dataclasses/dataclasses";
import { DAYS, DAYS_OBJECTS } from "~/lib/constants";
import { timeSlotFilter } from "~/lib/filters";
import { setStateToEvent } from "~/lib/state_management";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { CustomerSelect } from "../injectable/derived_injectables/customer_select";
import { CommitIcon } from "../injectable/commit_icon";
import { Optional } from "../injectable/optional";
import { DATA_STANDARD_ORDER } from "~/lib/shared_constants";
import { ErrorMonad, useErrorState } from "~/lib/error_handling";
import { parseDanish0OrPositiveNumberBind } from "~/lib/parsing";


type tsdProps = {
  timeslot : ActivityDeliveryTimeSlot,
  currentStandardOrder : (ts: ActivityDeliveryTimeSlot) => StandardOrder,
}

function TimeSlotDisplay({timeslot, currentStandardOrder} : tsdProps){
  const standardOrder = currentStandardOrder(timeslot)
  const defaultAmount = standardOrder.amount ? String(standardOrder.amount) : ""
  const AMOUNT_HEADER = "Standard Ordre"

  const [amount, setAmount] = useState(defaultAmount);
  const [amountError, setAmountError] = useErrorState();

  const dirty = amount != defaultAmount;

  console.log(`Standard Order ID ${standardOrder.id}`);

  function validate(){
    const m = new ErrorMonad()

    m.bind(
      parseDanish0OrPositiveNumberBind(amount, AMOUNT_HEADER)
    );

    if(m.registerErrors({
      [AMOUNT_HEADER] : setAmountError
    })){
      return false
    }

    const pAmount = m.get_value(AMOUNT_HEADER);


    const newStandardOrder = standardOrder.copy();

    newStandardOrder.amount = pAmount;
    newStandardOrder.destination = timeslot.id;

    return [true, newStandardOrder];
  }

  const actionButton = (
    <Optional exists={dirty}>
      <CommitIcon
        temp_object={standardOrder}
        object_type={DATA_STANDARD_ORDER}
        validate={validate}
      />
    </Optional>
  );

  return (
    <Row>
      <TracershopInputGroup label={timeslot.delivery_time} tail={actionButton} error={amountError}>
        <FormControl value={amount} onChange={setStateToEvent(setAmount)}/>
      </TracershopInputGroup>
    </Row>
  )
}

export function StandardOrderSetup({relatedCustomer}) {
  // Globals
  const state = useTracershopState();
  const deliveryCodex = useDeliveryCodex();
  const tracerCatalog = useTracerCatalog();


  // State
  const [activeCustomer, setActiveCustomer] = useState(() => {
      for(const customer of relatedCustomer.values()){
        return customer.id;
      }
    });

  const customerCodex = deliveryCodex.getTimeSlotsForCustomer(activeCustomer);
  const activityCatalog = tracerCatalog.getActivityCatalog(activeCustomer);

  const [endpoint, setEndpoint] = useState(() => {
    // Just a small note, nobody have 2 endpoints, but if they do, some stuff might have to change
    for(const [key, _] of customerCodex){
      return key;
    }
  });
  const [day, setDay] = useState(DAYS.MONDAY)
  const [tracerID, setTracerID] = useState(() => {
    for( const aTracerID of activityCatalog){ return aTracerID; }
  });

  // State extraction
  const deliveriesForEndpoint = customerCodex.get(endpoint);
  const allDeliveriesForDate = deliveriesForEndpoint[day];
  const displayDeliveries = timeSlotFilter(allDeliveriesForDate, {state : state, tracerID : tracerID})

  // Rendering
  const DaysButtons = DAYS_OBJECTS.map((({name, day : day_}) => {
    const dname = day === day_ ? <u>{name}</u> : <div>{name}</div>

    return (
      <Col style={{flex : "0 0 0"}} key={day_}>
        <Button onClick={() => {/*console.log(`Setting Day to ${day_}`);*/ setDay(day_)}}>
          {dname}
        </Button>
      </Col>
    );
  }));

  const TracerButtons = [...activityCatalog].map(
    (tracerID_) => {
      const tracer = state.tracer.get(tracerID_);
      const name = tracerID_ === tracerID ? <u>{tracer.shortname}</u> : <div>{tracer.shortname}</div>

      return (
        <Col key={tracerID_} style={{flex : "0 0 0"}}>
          <Button onClick={() => {setTracerID(tracerID_)}}>
            {name}
          </Button>
        </Col>
      );
    }
  );

  const currentStandardOrder = useMemo(() => {
    return function(timeslot){
      for(const standardOrder of state.standard_order.values()){
        if(standardOrder.destination === timeslot.id){
          return standardOrder
        }
      }
      return new StandardOrder();
    }
  }, [state.standard_order]);

  const changeCustomer = useMemo(() => {
    return (newCustomer: React.ChangeEvent<HTMLInputElement>) => {
      const newActiveCustomer = Number(newCustomer.target.value)
      setActiveCustomer(newActiveCustomer);
      const customerCodex = deliveryCodex.getTimeSlotsForCustomer(newActiveCustomer);
      setEndpoint(() => {
        for(const [key, _] of customerCodex){
         return key;
        }
      })

      const activityCatalog = tracerCatalog.getActivityCatalog(newActiveCustomer);
      setTracerID(() => {
        for( const aTracerID of activityCatalog){ return aTracerID; }
      })
    }
  }, [customerCodex, activityCatalog])


  const timeSlotDisplays = displayDeliveries.map(
    (timeslot) => {
      return <TimeSlotDisplay
        key={timeslot.id}
        timeslot={timeslot}
        currentStandardOrder={currentStandardOrder}
      />
    }
  );

  return (
    <Container>
      <Row>
        <TracershopInputGroup label="Kunde">
          <CustomerSelect
            customers={relatedCustomer}
            value={activeCustomer}
            onChange={changeCustomer}
          />
        </TracershopInputGroup>
      </Row>
      <Row className="justify-content-md-left" style={{
        marginTop : "1vh",
        marginBottom : "1vh"
      }}>
        {DaysButtons}
      </Row>
      <Row className="justify-content-md-left" style={{
        marginTop : "1vh",
        marginBottom : "1vh"
      }}>
        {TracerButtons}
      </Row>
      <Container>
        {timeSlotDisplays}
      </Container>
    </Container>
  );
}