import React, { Component } from "react";
import { Col, Container, Form, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";
import { Calender, standardOrderMapping } from "../injectable/calender.js";
import { Select } from '../injectable/select.js'
import { FutureBooking } from "./future_bookings.js";
import { OrderReview } from "./order_review.js";
import { db } from "../../lib/local_storage_driver.js";
import { CALENDER_PROP_DATE, CALENDER_PROP_GET_COLOR, CALENDER_PROP_ON_DAY_CLICK, CALENDER_PROP_ON_MONTH_CHANGE, DATABASE_SHOP_ACTIVE_ENDPOINT, DATABASE_SHOP_CUSTOMER, DATABASE_SHOP_ORDER_PAGE, DATABASE_TODAY, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_CUSTOMER, JSON_DELIVER_TIME, JSON_EMPLOYEE, JSON_ENDPOINT, JSON_INJECTION_ORDER, JSON_ISOTOPE, JSON_PRODUCTION, JSON_RUN, JSON_TRACER, JSON_TRACER_MAPPING, PROP_USER, PROP_WEBSOCKET, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEEKLY_REPEAT_CHOICES } from "../../lib/constants.js";
import { ActivityOrder, Customer, ActivityDeliveryTimeSlot, DeliveryEndpoint, ActivityProduction } from "../../dataclasses/dataclasses.js";

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

    if(activeCustomer === undefined){
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
        if(activeEndpoint === undefined){
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
    if (viewIdentifier === undefined){
      viewIdentifier = "Manuel"
    }
    let View = Content[viewIdentifier];

    this.state = {
      activeCustomer : activeCustomer,
      activeEndpoint : activeEndpoint,
      today : today,
      View : View,
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
      db.set(DATABASE_SHOP_CUSTOMER, Number(event.target.value));
      This.setState({
        ...This.state,
        activeCustomer : Number(event.target.value)
      });
    }
    return retfunc
  }

  render(){
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

    // WELL WELL WELL, IT LOOKS LIKE THERE'S DISAGREEMENTS WITH THE BACKEND WHAT SUNDAY IS CALLED.
    // LETS FIX THAT
    const day = (this.state.today.getDay() + 6) % 7;

    const oneJan = new Date(this.state.today.getFullYear(),0,1);
    const numberOfDays = Math.floor((this.state.today - oneJan) / (24 * 60 * 60 * 1000));
    const WeekNumber = Math.ceil(( this.state.today.getDay() + 1 + numberOfDays) / 7);

    const RelevantDeliverTimes = Array.from(this.props[JSON_DELIVER_TIME].values()).filter((_DT) => {
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
    });

    const RelevantOrders = Array.from(this.props[JSON_ACTIVITY_ORDER].values()).filter((_order) => {
      const /**@type {ActivityOrder} */ order = _order
      return order.ordered_time_slot 
    });

    const RelevantTOrders = Array.from(this.props[JSON_INJECTION_ORDER].values()).filter((t_order) => {
        t_order.BID == customer.ID;
    });

    const RelevantTracerMapping = Array.from(this.props[JSON_TRACER_MAPPING].values()).filter((tracerMapping) => {
      return tracerMapping.customer_id == customer.ID
    })

    /** Relevant Bookings  */



    const customerOptions = [];
    for(const [customerID, _customer] of this.props[JSON_CUSTOMER]){ // Note new namespace for customer
      const /**@type {Customer} */ customer = _customer
      customerOptions.push({id: customer, name : customer.short_name})
    } // End customer namespace

    let CustomerSelect
    if(customerOptions.length === 1){
      CustomerSelect = <InputGroup>
        <InputGroup.Text>Kunde:</InputGroup.Text>
        <FormControl readOnly value={customerOptions[0].name}/>
      </InputGroup>
    } else {
      CustomerSelect = <Select/>

    }

    const viewProps = {...this.props};

    const calenderProps = {};

    calenderProps[CALENDER_PROP_DATE] = this.state.today;
    calenderProps[CALENDER_PROP_ON_DAY_CLICK] = this.setActiveDate.bind(this);
    calenderProps[CALENDER_PROP_ON_MONTH_CHANGE] = this.setActiveMonth.bind(this);
    calenderProps[CALENDER_PROP_GET_COLOR] = () => {return ""}

    return (
    <div>
      <Row>
        <Col sm={8}>
          <Row></Row>
          <Row>
            <this.state.View
              {...viewProps}
              />
          </Row>
        </Col>
        <Col>
          <Container
            style={{
              width : '350px'
            }}
          >
            <Row>
              <CustomerSelect></CustomerSelect>
            </Row>
            <Row>
                <Calender
                  {...calenderProps}
                />
            </Row>
          </Container>
        </Col>
      </Row>
    </div>);
  }
}
