import React, { Component } from "react";
import { Col, Container, Form, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";
import { Calender, standardOrderMapping } from "../injectable/calender.js";
import { Select } from '../injectable/select.js'
import { FutureBooking } from "./future_bookings.js";
import { OrderReview } from "./order_review.js";
import { db } from "../../lib/local_storage_driver.js";
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE, DATABASE_SHOP_ACTIVE_ENDPOINT, DATABASE_SHOP_CUSTOMER, DATABASE_SHOP_ORDER_PAGE, DATABASE_TODAY, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_CUSTOMER, JSON_DEADLINE, JSON_DELIVER_TIME, JSON_EMPLOYEE, JSON_ENDPOINT, JSON_INJECTION_ORDER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_RUN, JSON_SERVER_CONFIG, JSON_TRACER, JSON_TRACER_MAPPING, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ACTIVE_ENDPOINT, PROP_EXPIRED_ACTIVITY_DEADLINE, PROP_EXPIRED_INJECTION_DEADLINE, PROP_USER, PROP_WEBSOCKET, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEEKLY_REPEAT_CHOICES } from "../../lib/constants.js";
import { ActivityOrder, Customer, ActivityDeliveryTimeSlot, DeliveryEndpoint, ActivityProduction, Tracer, ServerConfiguration, Deadline } from "../../dataclasses/dataclasses.js";
import { changeState } from "../../lib/state_management.js";
import { TracershopInputGroup } from "../injectable/tracershop_input_group.js";
import { _calculateDeadline, getDay, getToday } from "../../lib/chronomancy.js";
import { dateToDateString } from "../../lib/formatting.js";
import { getId } from "../../lib/utils.js";

export { ShopOrderPage }

const Content = {
  Manuel : OrderReview,
  Automatisk : FutureBooking
};


class ShopOrderPage extends Component {
  constructor(props){
    super(props);

    let activeCustomer = db.get(DATABASE_SHOP_CUSTOMER);
    this.representingCustomer = []

    if(activeCustomer === null){
      for(const [customerID, _customer] of this.props[JSON_CUSTOMER]){
        activeCustomer = customerID
        db.set(DATABASE_SHOP_CUSTOMER, customerID)
        break;
      }
    }

    let activeEndpoint = db.get(DATABASE_SHOP_ACTIVE_ENDPOINT)
    this.customerEndpoints = []
    for(const [endpointID, _endpoint] of this.props[JSON_ENDPOINT]){
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


    this.state = {
      activeCustomer : activeCustomer,
      activeEndpoint : activeEndpoint,
      today : today,
      view : viewIdentifier,
    };
  }

  setActiveDate(NewDate) {
    db.set("today", NewDate);
    this.setState({...this.state, today : NewDate})
  }

  setActiveMonth(NewMonth) {
    const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    this.props[PROP_WEBSOCKET].send(message);
  }

  setActiveCustomer(This){
    const retfunc = (event) => {
      const NewCustomerID = Number(event.target.value);

      db.set(DATABASE_SHOP_CUSTOMER, NewCustomerID);

      const endpoints = [...this.props[JSON_ENDPOINT].values()].filter(
        (_endpoint) => {
          const /**@type {DeliveryEndpoint} */ endpoint = _endpoint;
          return endpoint.owner === NewCustomerID;
      })

      const endpointID = endpoints[0].id
      db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, endpointID);

      This.setState({
        ...This.state,
        activeCustomer : NewCustomerID,
        activeEndpoint : endpointID,
      });
    }
    return retfunc
  }

  setActiveEndpoint(){
    const retFunc = (event) => {
      const newEndpointID = Number(event.target.value);
      db.set(DATABASE_SHOP_ACTIVE_ENDPOINT, newEndpointID);
      this.setState({...this.state, activeEndpoint : newEndpointID})
    }
    return retFunc
  }

  renderSelects(){
    const customerOptions = [];
    for(const [customerID, _customer] of this.props[JSON_CUSTOMER]){ // Note new namespace for customer
      const /**@type {Customer} */ customer = _customer
      customerOptions.push({id: customerID, name : customer.short_name})
    }
    let CustomerSelect
    if(customerOptions.length === 1){
      CustomerSelect = (<FormControl readOnly value={customerOptions[0].name}/>)
    } else {
      CustomerSelect = (
      <Select
        options={customerOptions}
        nameKey={'name'}
        valueKey={'id'}
        onChange={this.setActiveCustomer(this).bind(this)}
        value={this.state.activeCustomer}
      />)
    }
    const endpointOptions = []
    for(const [endpointID, _endpoint] of this.props[JSON_ENDPOINT]){
      const /**@type {DeliveryEndpoint} */ endpoint = _endpoint;
      if(endpoint.owner === this.state.activeCustomer){
        endpointOptions.push({
          id: endpointID, name : endpoint.name
        });
      }
    }
    let EndpointSelect
    if(endpointOptions.length === 1){
      EndpointSelect = (<FormControl readOnly value={endpointOptions[0].name}/>)
    } else {
      EndpointSelect =(<Select
        options={endpointOptions}
        nameKey={'name'}
        valueKey={'id'}
        onChange={changeState('activeEndpoint', this)}
        value={this.state.activeEndpoint}
      />)
    }

    let TracerOptions = []

    let SiteOptions = [
      {id : "Manuel", name : "Ordre oversigt"},
      {id : "Automatisk", name : "Bookinger"}
    ]

    return (
    <Container>
      <TracershopInputGroup
        label="Kunde:"
      >
        {CustomerSelect}
      </TracershopInputGroup>
      <TracershopInputGroup
        label="Leverings Sted:"
      >
        {EndpointSelect}
      </TracershopInputGroup>
      <TracershopInputGroup
        label="Side"
      >
        <Select
          options={SiteOptions}
          nameKey={"name"}
          valueKey={"id"}
          onChange={changeState('view', this)}
          value={this.state.view}
        />
      </TracershopInputGroup>

    </Container>)
  }


  render(){
    const /**@type {ServerConfiguration} */ serverConfig = this.props[JSON_SERVER_CONFIG].get(1);
    const /**@type {Deadline} */ activityDeadline = this.props[JSON_DEADLINE].get(serverConfig.global_activity_deadline);
    const /**@type {Deadline} */ injectionDeadline = this.props[JSON_DEADLINE].get(serverConfig.global_injection_deadline);
    const today = getToday()

    const activityDeadlineDate = _calculateDeadline(activityDeadline, this.state.today)
    const injectionDeadlineDate = _calculateDeadline(injectionDeadline, this.state.today)

    const ActivityDeadlineExpired = activityDeadlineDate < today;
    const InjectionDeadlineExpired = injectionDeadlineDate < today;

    const Site = Content[this.state.view]
    const siteProps = {...this.props}

    siteProps[PROP_ACTIVE_DATE] = this.state.today;
    siteProps[PROP_ACTIVE_CUSTOMER] = this.state.activeCustomer;
    siteProps[PROP_ACTIVE_ENDPOINT] = this.state.activeEndpoint;
    siteProps[PROP_EXPIRED_ACTIVITY_DEADLINE] = ActivityDeadlineExpired
    siteProps[PROP_EXPIRED_INJECTION_DEADLINE] = InjectionDeadlineExpired


    let activeCustomer = this.props[JSON_CUSTOMER].get(Number(this.state.activeCustomer));
    if (activeCustomer == undefined){
      console.log("Undefined Customer not found")
      for(const [ID, customer] of this.props[JSON_CUSTOMER]){
        activeCustomer = customer;
        db.set(DATABASE_SHOP_CUSTOMER, ID);
        break;
      }
    }
    const /**@type { Customer } */ customer = activeCustomer;

    const day = getDay(this.state.today)
    const oneJan = new Date(this.state.today.getFullYear(),0,1);
    const numberOfDays = Math.floor((this.state.today - oneJan) / (24 * 60 * 60 * 1000));
    const WeekNumber = Math.ceil(( this.state.today.getDay() + 1 + numberOfDays) / 7);

    const RelevantDeliverTimes = [...this.props[JSON_DELIVER_TIME].values()].filter(
      (_DT) => {
        const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = _DT;
        const /**@type {ActivityProduction} */ production = this.props[JSON_PRODUCTION].get(timeSlot.production_run)
        let WeeklyOrdering = true;
        switch(timeSlot.weekly_repeat){
          case WEEKLY_REPEAT_CHOICES.EVEN:
            WeeklyOrdering = WeekNumber % 2 == 0;
          break;
          case WEEKLY_REPEAT_CHOICES.ODD:
            WeeklyOrdering = WeekNumber % 2 == 1;
          break;
        }

        return production.production_day == day &&
              this.customerEndpoints.includes(timeSlot.destination) &&
              WeeklyOrdering;
    }).map(getId);

    const /**@type {Array<ActivityOrder>} */ relevantActivityOrders = [...this.props[JSON_ACTIVITY_ORDER].values()].filter(
      (_order) => {
        const /**@type {ActivityOrder} */ order = _order;
        return RelevantDeliverTimes.includes(order.ordered_time_slot)
      }
    )




    /** Relevant Bookings  */
    const calenderProps = {};

    calenderProps[CALENDER_PROP_DATE] = this.state.today;
    calenderProps[CALENDER_PROP_ON_DAY_CLICK] = this.setActiveDate.bind(this);
    calenderProps[CALENDER_PROP_ON_MONTH_CHANGE] = this.setActiveMonth.bind(this);
    calenderProps[CALENDER_PROP_GET_COLOR] = (dateString) => {
      const date = new Date(dateString);

      let dateStatusActivity = 0;
      let dateStatusInjection = 0

      const activityDeadlineDate = _calculateDeadline(activityDeadline, date)
      const injectionDeadlineDate = _calculateDeadline(injectionDeadline, date)

      if(activityDeadlineDate < today){
        dateStatusActivity = 5
      }

      if(injectionDeadlineDate < today){
        dateStatusInjection = 5
      }


      return `date-status${dateStatusInjection}${dateStatusActivity}`
    }

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
              {this.renderSelects()}
            </Container>
          </Row>
          <Row>
              <div><Calender {...calenderProps}/></div>
          </Row>
        </Col>
      </Row>
    </Container>);
  }
}


