import React, { Component } from "react";
import { Col, Container, Form, FormGroup, Row } from "react-bootstrap";
import { Calender, standardOrderMapping } from "../injectables/calender";
import { FutureBooking } from "./FutureBookings";
import { OrderReview } from "./OrderReview";
import { db } from "../../lib/localStorageDriver";
import { DATABASE_SHOP_CUSTOMER, DATABASE_TODAY, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS } from "../../lib/constants";



export { ShopOrderPage }

const Content = {
  Manuel : OrderReview,
  Automatisk : FutureBooking
};


class ShopOrderPage extends Component {
  constructor(props){
    super(props);

    var customer = db.get(DATABASE_SHOP_CUSTOMER);
    if(customer === undefined){
      for(const [CID, _customer] of this.props.customers){
        db.set(DATABASE_SHOP_CUSTOMER, CID)
        customer = CID
        break;
      }
    }

    var today = db.get(DATABASE_TODAY);
    if(today === null || today === undefined){
      today = new Date();
      db.set(DATABASE_TODAY, today)
    }

    var View = Content["Manuel"] // Move this to database setting

    this.state = {
      activeCustomer : customer,
      today : today,
      View : View
    }
  }

  setActiveDate(NewDate) {
    db.set("today", NewDate);
    this.setState({...this.state, today : NewDate})
  }

  setActiveMonth(NewMonth) {
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
    message[WEBSOCKET_DATE] = NewMonth;
    this.props.websocket.send(message);
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
    var activeCustomer = this.props.customers.get(Number(this.state.activeCustomer));
    if (activeCustomer == undefined){
      console.log("Undefined Customer not found")
      for(const [ID, customer] of this.props.customers){
        activeCustomer = customer;
        db.set(DATABASE_SHOP_CUSTOMER, ID);
        break;
      }
    }
    const customer = activeCustomer;

    const day = this.state.today.getDay(); // WELL WELL WELL, IT LOOKS LIKE THERE'S DISAGREEMENTS WITH THE BACKEND WHAT SUNDAY IS CALLED.

    const oneJan = new Date(this.state.today.getFullYear(),0,1);
    const numberOfDays = Math.floor((this.state.today - oneJan) / (24 * 60 * 60 * 1000));
    const WeekNumber = Math.ceil(( this.state.today.getDay() + 1 + numberOfDays) / 7);

    const RelevantDeliverTimes = Array.from(this.props.deliverTimes.values()).filter((DT) => {
      var WeeklyOrdering = true;
      switch(DT.repeat){
        case 2:
          WeeklyOrdering = WeekNumber % 2 == 0;
        break;
        case 3:
          WeeklyOrdering = WeekNumber % 2 == 1;
        break;
      }

      return DT.day == day &&
             DT.BID == customer.ID &&
             WeeklyOrdering;
    });

    const RelevantOrders = Array.from(this.props.orders.values()).filter((order) => {
      return order.BID == customer.ID;
    });

    const RelevantTOrders = Array.from(this.props.t_orders.values()).filter((t_order) => {
        t_order.BID == customer.ID;
    });

    const RelevantTracerMapping = Array.from(this.props.tracerMapping.values()).filter((tracerMapping) => {
      return tracerMapping.customer_id == customer.ID
    })

    /** Relevant Bookings  */


    // Re-Maping the arrays with a map

    const deliverTimes = new Map(RelevantDeliverTimes.map((DT) => [DT.DTID, DT]));
    const orders = new Map(RelevantOrders.map((order) => [order.oid, order]));
    const tOrders = new Map(RelevantTOrders.map((tOrder) => [tOrder.oid, tOrder]));
    const tracerMapping = new Map(RelevantTracerMapping.map((TM) => [TM.ID, TM]))

    const customerOptions = [];
    for(const [_CID, customer] of this.props.customers){ // Note new namespace for customer
      customerOptions.push(<option key={customer.ID} value={customer.ID}>{customer.UserName}</option>)
    } // End customer namespace

    return (
    <div>
      <Row>
        <Col sm={8}>
          <Row></Row>
          <Row>
            <this.state.View
              orders={orders}
              tOrders={tOrders}
              deliverTimes={deliverTimes}
              tracerMapping={tracerMapping}
              activeCustomer={this.state.activeCustomer}
              // State injection
              date={this.state.today}
              // Props injection
              closeddates={this.props.closeddates}
              customers={this.props.customers}
              employee={this.props.employee}
              isotopes={this.props.isotopes}
              runs={this.props.runs}
              tracers={this.props.tracers}
              websocket={this.props.websocket}
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
              <div className="CustomerSelectArea">
                <FormGroup className="input-group">
                  <FormGroup className="input-group-prepend">
                    <label className="input-group-text">Kunde:</label>
                  </FormGroup>
                  <Form.Select
                    value={this.state.activeCustomer}
                    onChange={this.setActiveCustomer(this)}
                    >
                    {customerOptions}
                  </Form.Select>
                </FormGroup>
              </div>
            </Row>
            <Row>
              <div>
                <Calender
                  date={this.state.today}
                  getColor={standardOrderMapping(orders, tOrders, this.props.runs, this.props.closeddates)}
                  onDayClick={this.setActiveDate.bind(this)}
                  onMonthChange={this.setActiveMonth.bind(this)}
                />
              </div>
            </Row>
          </Container>
        </Col>
      </Row>
    </div>);
  }
}
