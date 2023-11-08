import React, { useState, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Select, toOptions } from '../injectable/select.js'
import { FutureBooking } from "./future_bookings.js";
import { OrderReview } from "./order_review.js";
import { db } from "../../lib/local_storage_driver.js";
import { DATABASE_SHOP_ACTIVE_ENDPOINT, DATABASE_SHOP_CUSTOMER,
  DATABASE_SHOP_ORDER_PAGE, DATABASE_TODAY,  PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE,
  PROP_ACTIVE_ENDPOINT, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE, PROP_VALID_ACTIVITY_DEADLINE, PROP_VALID_INJECTION_DEADLINE,
} from "../../lib/constants.js";
import { ActivityOrder, ActivityDeliveryTimeSlot, DeliveryEndpoint,
  ServerConfiguration, Deadline, InjectionOrder } from "../../dataclasses/dataclasses.js";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group.js";
import { expiredDeadline, getBitChain } from "../../lib/chronomancy.js";
import { getId } from "../../lib/utils.js";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { ShopCalender } from "../injectable/derived_injectables/shop_calender.js";

const Content = {
  Manuel : OrderReview,
  Automatisk : FutureBooking,
};

export function ShopOrderPage ({relatedCustomer}){
  const state = useTracershopState();

  let init = useRef({
    activeCustomer : null,
    activeEndpoint : null,
    today : null,
    viewIdentifier : null,
  })

  if (init.current.activeCustomer === null
    || init.current.activeEndpoint === null
    || init.current.today === null
    || init.current.viewIdentifier === null
  ){
    let activeCustomer = db.get(DATABASE_SHOP_CUSTOMER);

    if(activeCustomer === null){
      for(const customer of relatedCustomer){
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

    let /**@type {Date} */ today = db.get(DATABASE_TODAY);

    if(today === null || today === undefined){
      today = new Date();
      db.set(DATABASE_TODAY, today);
    } if (typeof(today) === 'string'){
      console.log(today.substring(1, today.length - 1))
      today = new Date(today.substring(1, today.length - 1));
    }

    let viewIdentifier = db.get(DATABASE_SHOP_ORDER_PAGE);
    if (viewIdentifier === null){
      viewIdentifier = "Manuel";
      db.set(DATABASE_SHOP_ORDER_PAGE, viewIdentifier);
    }

    init.current = {
      activeCustomer : activeCustomer,
      activeEndpoint : activeEndpoint,
      today : today,
      viewIdentifier : viewIdentifier,
    };
  }

  const [activeCustomer, _setActiveCustomer] = useState(init.current.activeCustomer);
  const [activeEndpoint, _setActiveEndpoint] = useState(init.current.activeCustomer);
  const [today, setToday] = useState(init.current.today);
  const [viewIdentifier, setViewIdentifier] = useState(init.current.viewIdentifier);

  function setActiveDate(NewDate) {
    db.set(DATABASE_TODAY, NewDate);
    setToday(NewDate);
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
                                                    today,
                                                    state.closed_date)
                                    : false;
  const injectionDeadlineExpired = injectionDeadline ?
                                    expiredDeadline(injectionDeadline,
                                                    today,
                                                    state.closed_date)
                                    : false;

  const SiteOptions = toOptions([
    {id : "Manuel", name : "Ordre oversigt"},
    {id : "Automatisk", name : "Bookinger"}
  ])

  const Site = Content[viewIdentifier]
  const siteProps = {
    [PROP_ACTIVE_DATE] : today,
    [PROP_ACTIVE_CUSTOMER] : activeCustomer,
    [PROP_ACTIVE_ENDPOINT] : activeEndpoint,
    [PROP_VALID_ACTIVITY_DEADLINE] :  !Boolean(activityDeadlineExpired),
    [PROP_VALID_INJECTION_DEADLINE] : !Boolean(injectionDeadlineExpired),
  }

  const calenderTimeSlots = [...state.deliver_times.values()].filter(
    (timeSlot) => {return timeSlot.destination === activeEndpoint}
  );

  return (
  <Container>
    <Row>
      <Col sm={8}>
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
            <TracershopInputGroup label="Side">
              <Select
                aria-label="site-select"
                options={SiteOptions}
                onChange={setView}
                value={state.view}
              />
            </TracershopInputGroup>
          </Container>
        </Row>
        <Row>
          <div>
            <ShopCalender
              active_date={today}
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
