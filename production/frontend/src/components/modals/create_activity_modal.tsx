import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, FormControl, Row, Container, Col } from "react-bootstrap";

import { Calculator } from "../injectable/calculator";
import { dateToDateString } from "~/lib/formatting";
import { ActivityDeliveryTimeSlot, ActivityOrder, Booking, DeliveryEndpoint, TracershopState } from "~/dataclasses/dataclasses";
import { CalculatorIcon, ClickableIcon } from "../injectable/icons";
import { TracershopInputGroup } from '../injectable/inputs/tracershop_input_group'
import { compareTimeStamp, getDay, TimeStamp } from "~/lib/chronomancy";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";
import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { setStateToEvent } from "~/lib/state_management";
import { BookingStatus, DATA_ACTIVITY_ORDER, DATA_BOOKING } from "~/lib/shared_constants";
import { NEW_LOCAL_ID, ORDER_STATUS } from "~/lib/constants";
import { Optional } from "~/components/injectable/optional";
import { FONT, JUSTIFY, MARGIN } from "~/lib/styles";
import { timeSlotFilter } from "~/lib/filters";
import { MESSAGE_READ_BOOKINGS } from "~/lib/incoming_messages";
import { TimeSlotMapping } from "~/lib/data_structures";
import { ArrayMap } from "~/lib/array_map";
import { reverse } from "~/lib/utils";
import { TimeDisplay } from "../injectable/data_displays/time_display";
import { MBqDisplay } from "../injectable/data_displays/mbq_display";
import { ProcedureFinder, useProcedureFinder } from "~/contexts/procedure_context";
import { decayCorrect } from "~/lib/physics";
import { DateDisplay } from "../injectable/data_displays/date_display";


type ActivityTimeSlotProps = {
  timeSlot : ActivityDeliveryTimeSlot,
  bookings : Array<Booking>,
  halflife : number
}

function ActivityTimeSlot({timeSlot, bookings, halflife}: ActivityTimeSlotProps){
  const procedureFinder = useProcedureFinder();
  let activity = 0;

  const timeSlotTimeStamp = new TimeStamp(timeSlot.delivery_time);

  for(const booking of bookings){
    const procedure = procedureFinder.find(booking);

    if(procedure === null){
      console.log("Didn't find the procedure!");
      continue;
    }

    const bookingTime = new TimeStamp(booking.start_time)
    bookingTime.addMinutes(procedure.delay_minutes);

    const decay_minutes = compareTimeStamp(bookingTime, timeSlotTimeStamp).toMinutes();

    activity += decayCorrect(halflife, decay_minutes,procedure.tracer_units)
  }

  return (<Row>
    <Container>
      <TimeDisplay time={timeSlot.delivery_time} /> - <MBqDisplay activity={activity}/>
    </Container>
  </Row>);
}

function selectTimeSlot(timeSlots: Array<ActivityDeliveryTimeSlot>,
  booking: Booking,
  procedureFinder : ProcedureFinder
){
  const procedure = procedureFinder.find(booking);
  const bookingTimeStamp = new TimeStamp(booking.start_time);
  bookingTimeStamp.addMinutes(procedure.delay_minutes)
  for(const timeSlot of reverse(timeSlots)){
    const timeSlotTimeStamp = new TimeStamp(timeSlot.delivery_time);
    if(bookingTimeStamp.lessThan(timeSlotTimeStamp)){
      continue;
    }

    return timeSlot;
  }

  return null;
}

export function buildBookingMap(
  timeSlotMapping : TimeSlotMapping,
  endpoint: DeliveryEndpoint,
  bookings : Array<Booking>,
  procedureFinder : ProcedureFinder
){
  const bookingMap = new ArrayMap<number, Booking>();

  const timeSlots = timeSlotMapping.getTimeSlots(endpoint);

  for(const booking of bookings){
    const timeSlot = selectTimeSlot(timeSlots, booking, procedureFinder )

    if(timeSlot !== null){
      bookingMap.set(timeSlot.id, booking);
    }
  }

  return bookingMap;
}

type CreateOrderModalProps = {
  active_tracer : number,
  on_close : () => void,
  timeSlotMapping : TimeSlotMapping
}

export function CreateOrderModal({active_tracer, on_close, timeSlotMapping}: CreateOrderModalProps) {
  const state = useTracershopState();
  const procedureFinder = useProcedureFinder();

  const active_date = state.today;
  const websocket = useWebsocket();
  const init = useRef({
    active_customer : null,
    active_endpoint : null,
    active_timeSlot : null,
  });

  if(init.current.active_customer === null
     || init.current.active_endpoint === null
     || init.current.active_timeSlot === null){

      let endpointInit: number | string = ""
      let customerInit: number | string = ""
      let timeSlotIdInit: number | string = ""
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
  const [bookings, setBookings] = useState<Array<Booking>>([]);

  useEffect(() => {
    const endpointID = Number(activeEndpoint);
    if(isNaN(endpointID)){ return; }

    websocket.sendGetBookings(state.today, endpointID).then(
      (message) => {
        if(message instanceof MESSAGE_READ_BOOKINGS){
          setBookings(message.data[DATA_BOOKING]);
        } else {
          console.error("Server error?");
        }
      });
  }, [activeEndpoint]);


  function createOrder(){
    const [valid, amountNumber] = parseDanishPositiveNumberInput(amount, "Aktiviteten")

    if(!valid){
      setError(String(amountNumber));
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
  const filteredTimeSlots = timeSlotFilter(state, {
      state : state,
      tracerID : active_tracer,
      day : day
    }
  );

  const endpoint = state.delivery_endpoint.get(activeEndpoint);
  const canCreate = !((!!activeCustomer) && (!!activeEndpoint) && (!!activeTimeSlot) && (!showCalculator) && (!!amount));
  const tracer = state.tracer.get(active_tracer);
  const isotope = state.isotopes.get(tracer.isotope)
  const dateString = dateToDateString(active_date)
  const deliveryTimeSlot = state.deliver_times.get(activeTimeSlot);
  const deliveryTime = deliveryTimeSlot ? new Date(`${dateString} ${deliveryTimeSlot.delivery_time}`) : NaN;
  const canCalculator = !isNaN(Number(deliveryTime)); //@ts-ignore Note that js considers date object as numbers, and invalid dates are isomorphic to NaN

  // Booking Filters
  const relevantBookings = bookings.filter((booking) => {
    const procedure = procedureFinder.find(booking);

    if(procedure === null){
      return false;
    }

    return procedure.tracer === active_tracer && booking.status === BookingStatus.Initial;
  });

  const bookingMap = buildBookingMap(
    timeSlotMapping,
    endpoint,
    relevantBookings,
    procedureFinder
  )

  const renderedTimeSlots = timeSlotMapping.getTimeSlots(endpoint).map(
    (timeSlot, i) => {
      const bookings = bookingMap.has(timeSlot.id) ? bookingMap.get(timeSlot.id) : [];
      return <ActivityTimeSlot
                key={i}
                timeSlot={timeSlot}
                bookings={bookings}
                halflife={isotope.halflife_seconds}
              />;
    }
  );

  const bookingExplainerString = `Der er ${relevantBookings.length} ubestilte bookinger:`

  return (
      <Modal
        show={true}
        onHide={on_close}
        style={FONT.light}
      >
        <Modal.Header>
          <Row style={JUSTIFY.center}>
            <Col>
              <h2>
                Opret Order til <DateDisplay date={state.today}/>
              </h2>
            </Col>
          </Row>
        </Modal.Header>
        <Modal.Body>
          { showCalculator ?
          <Calculator
            isotopes={state.isotopes}
            tracer={tracer}
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
            <Optional exists={!!relevantBookings.length}>
              <Container>
                <Row> {bookingExplainerString}</Row>
                {renderedTimeSlots}
              </Container>
            </Optional>
          </Container>
          }

        </Modal.Body>
        <Modal.Footer>
          <Optional exists={!canCreate} alternative={
            <Button disabled={true}>Opret Ordre</Button>}>
            <Button onClick={createOrder}>Opret Ordre</Button>
          </Optional>
          <Optional exists={canCalculator && !showCalculator}>
            <CalculatorIcon
              data-testid="open-calculator"
              openCalculator={() => {setShowCalculator(true);}}
            />
          </Optional>
          <Button onClick={on_close}>Luk</Button>
        </Modal.Footer>
      </Modal>
    )
}
