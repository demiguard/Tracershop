import React, { Component, useState } from "react";
import { Col, Container, Form, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";
import { Calender, getColorShop, standardOrderMapping } from "../injectable/calender.js";
import { Select } from '../injectable/select.js'
import { FutureBooking } from "./future_bookings.js";
import { OrderReview } from "./order_review.js";
import { db } from "../../lib/local_storage_driver.js";
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE, DATABASE_SHOP_ACTIVE_ENDPOINT, DATABASE_SHOP_CUSTOMER, DATABASE_SHOP_ORDER_PAGE, DATABASE_TODAY, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_CUSTOMER, JSON_DEADLINE, JSON_DELIVER_TIME, JSON_EMPLOYEE, JSON_ENDPOINT, JSON_INJECTION_ORDER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_RUN, JSON_SERVER_CONFIG, JSON_TRACER, JSON_TRACER_MAPPING, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE, PROP_USER, PROP_WEBSOCKET, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEEKLY_REPEAT_CHOICES } from "../../lib/constants.js";
import { ActivityOrder, ActivityDeliveryTimeSlot, DeliveryEndpoint, ActivityProduction, Tracer, ServerConfiguration, Deadline, InjectionOrder } from "../../dataclasses/dataclasses.js";
import { TracershopInputGroup } from "../injectable/tracershop_input_group.js";
import { expiredDeadline, getBitChain } from "../../lib/chronomancy.js";
import { getId } from "../../lib/utils.js";
import { DestinationSelect } from "../injectable/derived_injectables/destination_select.js";


const Content = {
  Manuel : OrderReview,
  Automatisk : FutureBooking,
};


export function ShopOrderPage (props){
    let activeCustomerInit = db.get(DATABASE_SHOP_CUSTOMER);

    if(activeCustomerInit === null){
      for(const [customerID, _customer] of props[JSON_CUSTOMER]){
        activeCustomerInit = customerID
        db.set(DATABASE_SHOP_CUSTOMER, customerID)
        break;
      }
    }

    let activeEndpointInit = db.get(DATABASE_SHOP_ACTIVE_ENDPOINT)
    for(const [endpointID, _endpoint] of props[JSON_ENDPOINT]){
      const /**@type {DeliveryEndpoint} */ endpoint = _endpoint;
      if(endpoint.owner === activeCustomerInit){
        if(activeEndpointInit === null){
          activeEndpointInit = endpointID
          db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, activeEndpointInit)
        }
      }
    }

    let today = db.get(DATABASE_TODAY);
    if(today === null){
      today = new Date();
      db.set(DATABASE_TODAY, today);
    }

    let viewIdentifier = db.get(DATABASE_SHOP_ORDER_PAGE);
    if (viewIdentifier === null){
      viewIdentifier = "Manuel";
      db.set(DATABASE_SHOP_ORDER_PAGE, viewIdentifier);
    }

  const [activeCustomer, _setActiveCustomer] = useState(activeCustomerInit);
  const [activeEndpoint, _setActiveEndpoint] = useState(activeEndpointInit);


  const [state, _setState] = useState({
    today : today,
    view : viewIdentifier,
  });

  function setState(newState){
    _setState({...state, ...newState});
  }

  function setActiveDate(NewDate) {
    db.set(DATABASE_TODAY, NewDate);
    setState({today : NewDate});
  }

  function setActiveMonth(NewMonth) {
    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    props[PROP_WEBSOCKET].send(message);
  }

  function setView(event){
    const newView = event.target.value;
    db.set(DATABASE_SHOP_ORDER_PAGE, newView);
    setState({view : newView});
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
  const /**@type {ServerConfiguration | undefined} */ serverConfig = props[JSON_SERVER_CONFIG].get(1);
  const /**@type {Deadline | undefined} */ activityDeadline = props[JSON_DEADLINE].get(serverConfig.global_activity_deadline);
  const /**@type {Deadline | undefined} */ injectionDeadline = props[JSON_DEADLINE].get(serverConfig.global_injection_deadline);


  const activityDeadlineExpired = activityDeadline ?
                                    expiredDeadline(activityDeadline,
                                                    state.today,
                                                    props[JSON_CLOSED_DATE])
                                    : false;
  const injectionDeadlineExpired = injectionDeadline ?
                                    expiredDeadline(injectionDeadline,
                                                    state.today,
                                                    props[JSON_CLOSED_DATE])
                                    : false;
  const timeSlots = [...props[JSON_DELIVER_TIME].values()].filter(
    (_timeSlot) => {
      const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = _timeSlot;
      return timeSlot.destination === activeEndpoint;
    });

  const bitChain = getBitChain(timeSlots, props[JSON_PRODUCTION]);

  const SiteOptions = [
    {id : "Manuel", name : "Ordre oversigt"},
    {id : "Automatisk", name : "Bookinger"}
  ]

  const Site = Content[state.view]
  const siteProps = {...props}

  siteProps[PROP_ACTIVE_DATE] = state.today;
  siteProps[PROP_ACTIVE_CUSTOMER] = activeCustomer;
  siteProps[PROP_ACTIVE_ENDPOINT] = activeEndpoint;
  siteProps[PROP_EXPIRED_ACTIVITY_DEADLINE] =  Boolean(activityDeadlineExpired);
  siteProps[PROP_EXPIRED_INJECTION_DEADLINE] = Boolean(injectionDeadlineExpired);

  const calenderTimeSlots = [...props[JSON_DELIVER_TIME].values()].filter(
    (timeSlot) => {return timeSlot.destination === activeEndpoint}
  )

  const calenderTimeSlotsIds = calenderTimeSlots.map(getId);

  const calenderActivityOrders = [...props[JSON_ACTIVITY_ORDER].values()].filter(
    (_activityOrder) => {
      const /**@type {ActivityOrder} */ activityOrder = _activityOrder
      return calenderTimeSlotsIds.includes(activityOrder.ordered_time_slot);
    });

  const calenderInjectionOrders = [...props[JSON_INJECTION_ORDER].values()].filter(
    (_injectionOrder) => {
      const /**@type {InjectionOrder} */ injectionOrder = _injectionOrder
      return injectionOrder.endpoint === activeEndpoint;
    });

  /** Relevant Bookings  */
  const calenderProps = {};

  calenderProps[CALENDER_PROP_DATE] = state.today;
  calenderProps[CALENDER_PROP_ON_DAY_CLICK] = setActiveDate;
  calenderProps[CALENDER_PROP_ON_MONTH_CHANGE] = setActiveMonth;
  calenderProps[CALENDER_PROP_GET_COLOR] = getColorShop(
    activityDeadline,
    injectionDeadline,
    calenderActivityOrders,
    props[JSON_CLOSED_DATE],
    calenderInjectionOrders,
    props[JSON_PRODUCTION],
    calenderTimeSlots
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
              customer={props[JSON_CUSTOMER]}
              endpoints={props[JSON_ENDPOINT]}
              setCustomer={setActiveCustomer}
              setEndpoint={setActiveEndpoint}
            />
            <TracershopInputGroup label="Side">
              <Select
                aria-label="site-select"
                options={SiteOptions}
                nameKey={"name"}
                valueKey={"id"}
                onChange={setView}
                value={state.view}
              />
            </TracershopInputGroup>
          </Container>
        </Row>
        <Row>
            <div><Calender {...calenderProps}/></div>
        </Row>
      </Col>
    </Row>
  </Container>);
}
