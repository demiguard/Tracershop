import React, { useState, useRef, useEffect, useMemo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Select, toOptions } from '../injectable/select.js'
import { FutureBooking } from "./future_bookings.js";
import { OrderReview } from "./order_review.js";
import { db } from "../../lib/local_storage_driver.js";
import { DATABASE_ACTIVE_TRACER, DATABASE_SHOP_ACTIVE_ENDPOINT, DATABASE_SHOP_CUSTOMER,
  DATABASE_SHOP_ORDER_PAGE,  PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE,
  PROP_ACTIVE_ENDPOINT, PROP_VALID_ACTIVITY_DEADLINE, PROP_VALID_INJECTION_DEADLINE,
  USER_GROUPS,
} from "../../lib/constants.js";
import { ServerConfiguration, Deadline, Booking} from "../../dataclasses/dataclasses.js";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group.js";
import { expiredDeadline } from "../../lib/chronomancy.js";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select.js";
import { useTracershopDispatch, useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context.js";
import { ShopCalender } from "../injectable/derived_injectables/shop_calender.js";
import { BookingOverview } from "./booking_overview.js";
import { UpdateToday } from "~/lib/state_actions.js";
import { Optional } from "~/components/injectable/optional.js";
import { DATA_BOOKING } from "~/lib/shared_constants.js";
import { bookingFilter, timeSlotsFilter } from "~/lib/filters.js";
import { useTracerCatalog } from "~/contexts/tracer_catalog.js";
import { MESSAGE_CREATE_BOOKING, MESSAGE_DELETE_BOOKING, MESSAGE_READ_BOOKINGS } from "~/lib/incoming_messages.js";
import { numberfy, toMapping } from "~/lib/utils.js";
import { useUpdatingEffect } from "~/effects/updating_effect.js";
import { PRODUCT_TYPES, ProductReference } from "~/dataclasses/references/product_reference.js";
import { StateType } from "~/lib/constants.js";

const Content = {
  Manuel : OrderReview,
  Automatisk : FutureBooking,
  Overview : BookingOverview,
};

/**
 *
 * @param {Map<Number, Customer>} param0
 * @returns
 */
export function ShopOrderPage ({relatedCustomer}){
  const state = useTracershopState();
  const dispatch = useTracershopDispatch();
  const websocket = useWebsocket();
  const tracerCatalog = useTracerCatalog();

  const /** @type {StateType<Number>} */ [activeCustomer, _setActiveCustomer] = useState(() => {
    let activeCustomer = db.get(DATABASE_SHOP_CUSTOMER);
    if(activeCustomer !== null){
      if(!relatedCustomer.has(activeCustomer)){
        activeCustomer = null;
      }
    }

    if(activeCustomer === null){
      for(const customer of relatedCustomer.values()){
        activeCustomer = customer.id;
        db.set(DATABASE_SHOP_CUSTOMER, customer.id);
        break;
      }
    }

    return activeCustomer;
  });

  const /** @type {StateType<Number>} */ [activeEndpoint, _setActiveEndpoint] = useState(() => {
    let activeEndpoint = db.get(DATABASE_SHOP_ACTIVE_ENDPOINT);
    // This check is here to see t
    if(activeEndpoint !== null){
      const endpoint = state.delivery_endpoint.get(activeEndpoint);
      if (endpoint.owner !== activeCustomer){
        activeEndpoint = null;
      }
    }

    if(activeEndpoint === null){
    for(const endpoint of state.delivery_endpoint.values()){
      if(endpoint.owner === activeCustomer){
          activeEndpoint = endpoint.id;
          db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, activeEndpoint);
          break;
        }
      }
    }
    return activeEndpoint
  });

  const [viewIdentifier, setViewIdentifier] = useState(() => {
    let viewIdentifier = db.get(DATABASE_SHOP_ORDER_PAGE);
    if (viewIdentifier === null || state.logged_in_user.user_group === USER_GROUPS.SHOP_EXTERNAL){
      viewIdentifier = "Manuel";
      db.set(DATABASE_SHOP_ORDER_PAGE, viewIdentifier);
    }
    return viewIdentifier;

  });
  const catalog = tracerCatalog.getCatalog(activeEndpoint);
  const availableProducts = [...catalog.tracerCatalogActivity, ...catalog.isotopeCatalog];

  const [activeProduct, _setActiveProduct] = useState(() => {
    const local_stored_active_tracer = db.get(DATABASE_ACTIVE_TRACER);

    if(local_stored_active_tracer === null){
      return ProductReference.fromProduct(availableProducts[0]);
    }
    if(/.\-\d+/.test(local_stored_active_tracer)){
      return ProductReference.fromValue(local_stored_active_tracer);
    }
    return ProductReference.fromProduct(availableProducts[0])
  });

  const [bookings, setBookings] = useState(new Map());
  const activeDate = state.today;

  function addBookingFromUpdate(message){
    if(message instanceof MESSAGE_CREATE_BOOKING){
      setBookings(oldBookings => {
        const newBookings = new Map(oldBookings);
        const incomingBookings = message.data[DATA_BOOKING]
        const filteredBookings = bookingFilter(incomingBookings, {
          state : state,
          active_date : activeDate,
          active_endpoint : activeEndpoint,
        });

        for(const booking of filteredBookings){
          newBookings.set(booking.id, booking);
        }
        return newBookings;
      })
    } else if(message instanceof MESSAGE_DELETE_BOOKING){
      const /**@type {Array<Number>} */ deleted_bookings = message.dataID
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
    const listenNumber = websocket ? websocket.addListener(addBookingFromUpdate) : null;
    return () => {
      if(listenNumber !== null){
        websocket.removeListener(listenNumber);
      }
    }
  }, [websocket]);

  useUpdatingEffect(function changeRelatedCustomer() {
    if(!relatedCustomer.has(activeCustomer)){
      let newActiveCustomer = null;

      for(const customer of relatedCustomer.values()){
        newActiveCustomer = customer.id;
        break;
      }

      let newActiveEndpoint = null;
      for(const endpoint of state.delivery_endpoint.values()){
        if(endpoint.owner === newActiveCustomer){
          newActiveEndpoint = endpoint.id;
          break;
        }
      }
      setActiveCustomer(newActiveCustomer);
      setActiveEndpoint(newActiveEndpoint);
    }

  }, [relatedCustomer])

  useEffect(function getBookings () {
    if(websocket !== null){
      websocket.sendGetBookings(activeDate, activeEndpoint).then((message) => {
        if(message instanceof MESSAGE_READ_BOOKINGS){
          setBookings(toMapping(message.data[DATA_BOOKING]));
        } else {
          console.error("Server error?")
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

  function setActiveProduct(product){
    const productReference = ProductReference.fromProduct(product);
    db.set(DATABASE_ACTIVE_TRACER, productReference.to_value());
    _setActiveProduct(productReference);
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
    productState : [activeProduct, setActiveProduct],
  };

  const calenderTimeSlots = activeProduct.filterDeliveries(state, activeEndpoint);

  return (
  <Container fluid="xxl" style={{padding : "0px"}}>
    <Row style={{margin : "0px"}}>
      <Col sm={8} style={{padding : "0px"}}>
        <Site {...siteProps} />
      </Col>
      <Col sm={4}>
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
              time_slots={calenderTimeSlots}
            />
          </div>
        </Row>
      </Col>
    </Row>
  </Container>);
}
