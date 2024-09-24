import React, { useState, useRef, useEffect, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Select, toOptions } from '../injectable/select.js'
import { FutureBooking } from "./future_bookings.js";
import { OrderReview } from "./order_review.js";
import { db } from "../../lib/local_storage_driver.js";
import { DATABASE_ACTIVE_TRACER, DATABASE_SHOP_ACTIVE_ENDPOINT, DATABASE_SHOP_CUSTOMER,
  DATABASE_SHOP_ORDER_PAGE, DATABASE_TODAY,  PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE,
  PROP_ACTIVE_ENDPOINT, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE,
  PROP_VALID_ACTIVITY_DEADLINE, PROP_VALID_INJECTION_DEADLINE,
  USER_GROUPS,
} from "../../lib/constants.js";
import { ActivityOrder, ActivityDeliveryTimeSlot, DeliveryEndpoint,
  ServerConfiguration, Deadline, InjectionOrder,
  Booking} from "../../dataclasses/dataclasses.js";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group.js";
import { expiredDeadline, getBitChain } from "../../lib/chronomancy.js";
import { getId } from "../../lib/utils.js";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select.js";
import { useTracershopDispatch, useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { ShopCalender } from "../injectable/derived_injectables/shop_calender.js";
import { BookingOverview } from "./booking_overview.js";
import { UpdateToday } from "~/lib/state_actions.js";
import { Optional } from "~/components/injectable/optional.js";
import { DATA_BOOKING, DATA_TRACER, WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_CREATE_BOOKING, WEBSOCKET_MESSAGE_DELETE_BOOKING, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js";
import { ParseDjangoModelJson } from "~/lib/formatting.js";
import { bookingFilter, timeSlotsFilter } from "~/lib/filters.js";
import { TracerCatalog } from "~/lib/data_structures.js";
import { useTracerCatalog } from "~/effects/tracerCatalog.js";

const Content = {
  Manuel : OrderReview,
  Automatisk : FutureBooking,
  Overview : BookingOverview,
};

export function ShopOrderPage ({relatedCustomer}){
  const state = useTracershopState();
  const dispatch = useTracershopDispatch();
  const websocket = useWebsocket();

  const tracerCatalog = useTracerCatalog();

  const init = useRef({
    activeCustomer : null,
    activeEndpoint : null,
    viewIdentifier : null,
    activeTracer : null
  });

  if (init.current.activeCustomer === null
    || init.current.activeEndpoint === null
    || init.current.viewIdentifier === null
    || init.current.activeTracer === null
  ){
    let activeCustomer = db.get(DATABASE_SHOP_CUSTOMER);

    if(activeCustomer === null){
      for(const customer of relatedCustomer.values()){
        activeCustomer = customer.id;
        db.set(DATABASE_SHOP_CUSTOMER, customer.id);
        break;
      }
    }

    let activeEndpoint = db.get(DATABASE_SHOP_ACTIVE_ENDPOINT)
    if(activeEndpoint === null){
    for(const endpoint of state.delivery_endpoint.values()){
      if(endpoint.owner === activeCustomer){
          activeEndpoint = endpoint.id;
          db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, activeEndpoint);
          break;
        }
      }
    }

    let viewIdentifier = db.get(DATABASE_SHOP_ORDER_PAGE);
    if (viewIdentifier === null || state.logged_in_user.user_group === USER_GROUPS.SHOP_EXTERNAL){
      viewIdentifier = "Manuel";
      db.set(DATABASE_SHOP_ORDER_PAGE, viewIdentifier);
    }
    const availableActivityTracers = tracerCatalog.getActivityCatalog(activeEndpoint);
    let activeTracerInit = -1;
    if (0 < availableActivityTracers.length){
      activeTracerInit = availableActivityTracers[0].id;
    }
    const local_stored_active_tracer = db.get(DATABASE_ACTIVE_TRACER);
    if(local_stored_active_tracer &&
        availableActivityTracers.includes(
          state.tracer.get(local_stored_active_tracer)
        )){
      activeTracerInit = local_stored_active_tracer;
    }

    init.current = {
      activeCustomer : activeCustomer,
      activeEndpoint : activeEndpoint,
      viewIdentifier : viewIdentifier,
      activeTracer : activeTracerInit,
    };
  }

  const [activeCustomer, _setActiveCustomer] = useState(init.current.activeCustomer);
  const [activeEndpoint, _setActiveEndpoint] = useState(init.current.activeEndpoint);
  const [viewIdentifier, setViewIdentifier] = useState(init.current.viewIdentifier);
  const [activeTracer, setActiveTracer] = useState(init.current.activeTracer);
  const [bookings, setBookings] = useState(new Map());
  const activeDate = state.today;

  function addBookingFromUpdate(message){
    if(message[WEBSOCKET_MESSAGE_TYPE] === WEBSOCKET_MESSAGE_CREATE_BOOKING){
      setBookings(oldBookings => {
        const newBookings = new Map(oldBookings);
        for(const serialized_booking of message[WEBSOCKET_DATA]){
          const booking = new Booking();
          Object.assign(booking, serialized_booking.fields);
          booking.id = serialized_booking.pk;
          newBookings.set(booking.id, booking);
        }
        const filteredBookings = bookingFilter(newBookings, {
          state : state,
          active_date : activeDate,
          active_endpoint : activeEndpoint,
        });

        for(const booking of filteredBookings){
          newBookings.set(booking.id, booking);
        }

        return newBookings;
      })
    } else if(message[WEBSOCKET_MESSAGE_TYPE] === WEBSOCKET_MESSAGE_DELETE_BOOKING){
      const /**@type {Array<Number>} */ deleted_bookings = message[WEBSOCKET_DATA_ID]
      setBookings(oldBookings => {
        const newBookings = new Map(oldBookings);
        for(const bookingID of deleted_bookings){
          newBookings.delete(bookingID);
        }
        return newBookings
      });
    }
  }

  useEffect(() => {
    let listenNumber = null;
    if(websocket){
      listenNumber = websocket.addListener(addBookingFromUpdate);
    }
    return () => {
      if(listenNumber !== null){
        websocket.removeListener(listenNumber);
      }
    }
  }, [websocket]);

  useEffect(() => {
    if(websocket !== null){
      websocket.sendGetBookings(
        activeDate, activeEndpoint
      ).then((data) => {
        if(data[WEBSOCKET_DATA]){
          const newBookings = new Map();

          for(const serialized_booking of data[WEBSOCKET_DATA]){
            const booking = new Booking();
            Object.assign(booking, serialized_booking.fields);
            booking.id = serialized_booking.pk;
            newBookings.set(booking.id, booking);
          }
          setBookings(newBookings);
        }
      });
    }
    return () => {
      setBookings(new Map());
    }
  }, [activeEndpoint, activeDate, websocket])

  function setActiveDate(newDate) {
    dispatch(new UpdateToday(newDate, websocket));
  }

  function setView(event){
    const newView = event.target.value;
    db.set(DATABASE_SHOP_ORDER_PAGE, newView);
    setViewIdentifier(newView);
  }

  function setActiveCustomer(newCustomer){
    db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, newCustomer);
    _setActiveCustomer(newCustomer);
  }
  function setActiveEndpoint(newEndpoint){
    db.set(DATABASE_SHOP_CUSTOMER, newEndpoint);
    _setActiveEndpoint(newEndpoint);
  }

  // End of function declarations
  const /**@type {ServerConfiguration | undefined} */ serverConfig = state.server_config.get(1);
  const /**@type {Deadline | undefined} */ activityDeadline = (serverConfig !== undefined) ?
                                                                  state.deadline.get(serverConfig.global_activity_deadline)
                                                                  : undefined;
  const /**@type {Deadline | undefined} */ injectionDeadline = (serverConfig !== undefined) ?
                                                                   state.deadline.get(serverConfig.global_injection_deadline)
                                                                   : undefined;

  const activityDeadlineExpired = activityDeadline ?
                                    expiredDeadline(activityDeadline,
                                                    state.today,
                                                    state.closed_date)
                                    : false;
  const injectionDeadlineExpired = injectionDeadline ?
                                    expiredDeadline(injectionDeadline,
                                                    state.today,
                                                    state.closed_date)
                                    : false;

  const SiteOptions = toOptions([
    {id : "Manuel", name : "Ordre oversigt"},
    {id : "Automatisk", name : "Bookinger"},
    {id : "Overview", name : "Booking Oversigt"},
  ]);

  const Site = Content[viewIdentifier];
  const siteProps = {
    [PROP_ACTIVE_DATE] : state.today,
    [PROP_ACTIVE_CUSTOMER] : activeCustomer,
    [PROP_ACTIVE_ENDPOINT] : activeEndpoint,
    [PROP_VALID_ACTIVITY_DEADLINE] :  !Boolean(activityDeadlineExpired),
    [PROP_VALID_INJECTION_DEADLINE] : !Boolean(injectionDeadlineExpired),
    [DATA_BOOKING] : [...bookings.values()],
    activeTracer : activeTracer,
    setActiveTracer : setActiveTracer,
  };

  const calenderTimeSlotIDs = timeSlotsFilter(state, {
    endpointID : activeEndpoint,
    tracerID : activeTracer,
  });

  return (
  <Container style={{padding : "0px"}}>
    <Row style={{margin : "0px"}}>
      <Col sm={8} style={{padding : "0px"}}>
        <Site {...siteProps} />
      </Col>
      <Col sm={1}/>
      <Col sm={3}>
        <Row>
          <Container>
            <DestinationSelect
              ariaLabelCustomer="customer-select"
              ariaLabelEndpoint="endpoint-select"
              activeCustomer={activeCustomer}
              activeEndpoint={activeEndpoint}
              customers={relatedCustomer}
              endpoints={state.delivery_endpoint}
              setCustomer={setActiveCustomer}
              setEndpoint={setActiveEndpoint}
            />
            <Optional exists={state.logged_in_user.user_group !== USER_GROUPS.SHOP_EXTERNAL}>
              <TracershopInputGroup label="Side">
                <Select
                  aria-label="site-select"
                  options={SiteOptions}
                  onChange={setView}
                  value={viewIdentifier}
                  />
              </TracershopInputGroup>
            </Optional>
          </Container>
        </Row>
        <Row>
          <div>
            <ShopCalender
              active_date={state.today}
              active_endpoint={activeEndpoint}
              on_day_click={setActiveDate}
              time_slots={calenderTimeSlotIDs}
            />
          </div>
        </Row>
      </Col>
    </Row>
  </Container>);
}
