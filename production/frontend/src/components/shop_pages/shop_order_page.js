import React, { Component, useState } from "react";
import { Col, Container, Form, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";
import { Calender, getColorShop, standardOrderMapping } from "../injectable/calender.js";
import { Select } from '../injectable/select.js'
import { FutureBooking } from "./future_bookings.js";
import { OrderReview } from "./order_review.js";
import { db } from "../../lib/local_storage_driver.js";
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE, DATABASE_SHOP_ACTIVE_ENDPOINT, DATABASE_SHOP_CUSTOMER, DATABASE_SHOP_ORDER_PAGE, DATABASE_TODAY, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_CUSTOMER, JSON_DEADLINE, JSON_DELIVER_TIME, JSON_EMPLOYEE, JSON_ENDPOINT, JSON_INJECTION_ORDER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_RUN, JSON_SERVER_CONFIG, JSON_TRACER, JSON_TRACER_MAPPING, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE, PROP_USER, PROP_WEBSOCKET, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEEKLY_REPEAT_CHOICES } from "../../lib/constants.js";
import { ActivityOrder, Customer, ActivityDeliveryTimeSlot, DeliveryEndpoint, ActivityProduction, Tracer, ServerConfiguration, Deadline, InjectionOrder } from "../../dataclasses/dataclasses.js";
import { changeState } from "../../lib/state_management.js";
import { TracershopInputGroup } from "../injectable/tracershop_input_group.js";
import { calculateDeadline, evalBitChain, expiredDeadline, getBitChain, getDay, getToday, getWeekNumber } from "../../lib/chronomancy.js";
import { getId } from "../../lib/utils.js";
import { CustomerSelect } from "../injectable/derived_injectables/customer_select.js";
import { EndpointSelect } from "../injectable/derived_injectables/endpoint_select.js";


const Content = {
  Manuel : OrderReview,
  Automatisk : FutureBooking,
};


export function ShopOrderPage (props){
    let activeCustomer = db.get(DATABASE_SHOP_CUSTOMER);
    const representingCustomer = []

    if(activeCustomer === null){
      for(const [customerID, _customer] of props[JSON_CUSTOMER]){
        activeCustomer = customerID
        db.set(DATABASE_SHOP_CUSTOMER, customerID)
        break;
      }
    }

    let activeEndpoint = db.get(DATABASE_SHOP_ACTIVE_ENDPOINT)
    const customerEndpoints = []
    for(const [endpointID, _endpoint] of props[JSON_ENDPOINT]){
      const /**@type {DeliveryEndpoint} */ endpoint = _endpoint;
      if(endpoint.owner === activeCustomer){
        if(activeEndpoint === null){
          activeEndpoint = endpointID
          db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, activeEndpoint)
        }
      }
    }

    let today = db.get(DATABASE_TODAY);
    if(today === null || today === undefined){
      today = new Date();
      db.set(DATABASE_TODAY, today)
    }

    let viewIdentifier = db.get(DATABASE_SHOP_ORDER_PAGE)
    if (viewIdentifier === null){
      viewIdentifier = "Manuel";
      db.set(DATABASE_SHOP_ORDER_PAGE, viewIdentifier);
    }


  const [state, _setState] = useState({
    activeCustomer : activeCustomer,
    activeEndpoint : activeEndpoint,
    today : today,
    view : viewIdentifier,
  });

  function setState(newState){
    _setState({...state, ...newState})
  }

  function setActiveDate(NewDate) {
    db.set("today", NewDate);
    setState({today : NewDate})
  }

  function setActiveMonth(NewMonth) {
    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    props[PROP_WEBSOCKET].send(message);
  }

  function setActiveCustomer(event){
    const NewCustomerID = Number(event.target.value);

    db.set(DATABASE_SHOP_CUSTOMER, NewCustomerID);

    const endpoints = [...props[JSON_ENDPOINT].values()].filter(
      (_endpoint) => {
        const /**@type {DeliveryEndpoint} */ endpoint = _endpoint;
        return endpoint.owner === NewCustomerID;
    })

    const endpointID = endpoints[0].id
    db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, endpointID);

    setState({
      activeCustomer : NewCustomerID,
      activeEndpoint : endpointID,
    });
  }

  function setView(event){
    const newView = event.target.value;
    db.set(DATABASE_SHOP_ORDER_PAGE, newView);
    setState({view : newView});
  }

  function setActiveEndpoint(event){
    const newEndpointID = Number(event.target.value);
    db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, newEndpointID);
    setState({activeEndpoint : newEndpointID})
  }

  const /**@type {ServerConfiguration} */ serverConfig = props[JSON_SERVER_CONFIG].get(1);
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
      return timeSlot.destination === state.activeEndpoint;
    });

  const bitChain = getBitChain(timeSlots, props[JSON_PRODUCTION]);
  const ActivityDeadline = activityDeadlineExpired && evalBitChain(bitChain, state.today);
  const InjectionDeadline = injectionDeadlineExpired;

  const validEndpoints = [...props[JSON_ENDPOINT].values()].filter(
      (endpoint) => {return endpoint.owner === state.activeCustomer}
  )

  const SiteOptions = [
    {id : "Manuel", name : "Ordre oversigt"},
    {id : "Automatisk", name : "Bookinger"}
  ]

  const Site = Content[state.view]
  const siteProps = {...props}

  siteProps[PROP_ACTIVE_DATE] = state.today;
  siteProps[PROP_ACTIVE_CUSTOMER] = state.activeCustomer;
  siteProps[PROP_ACTIVE_ENDPOINT] = state.activeEndpoint;
  siteProps[PROP_EXPIRED_ACTIVITY_DEADLINE] =  Boolean(ActivityDeadline);
  siteProps[PROP_EXPIRED_INJECTION_DEADLINE] = Boolean(InjectionDeadline);

  const calenderTimeSlots = [...props[JSON_DELIVER_TIME].values()].filter(
    (timeSlot) => {return timeSlot.destination === state.activeEndpoint}
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
      return injectionOrder.endpoint === state.activeEndpoint;
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
            <TracershopInputGroup label="Kunde:">
              <CustomerSelect
                customer={props[JSON_CUSTOMER]}
                value={state.activeCustomer}
                onChange={setActiveCustomer}
              />
            </TracershopInputGroup>
            <TracershopInputGroup label="Leverings Sted:">
              <EndpointSelect
                deliveryEndpoint={validEndpoints}
                value={state.activeEndpoint}
                onChange={setActiveEndpoint}
              />
            </TracershopInputGroup>
            <TracershopInputGroup label="Side">
              <Select
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
