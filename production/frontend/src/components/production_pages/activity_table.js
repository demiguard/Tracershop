
import React, { Component, useState } from "react";
import { Row, Col, Table, Tab, Button, Container, Card, Collapse } from 'react-bootstrap'
import { renderStatusImage, renderTableRow } from "../../lib/rendering.js";
import { compareDates } from "../../lib/utils.js";
import { FormatDateStr, dateToDateString } from "../../lib/formatting.js";
import { CountMinutes, CalculateProduction } from "../../lib/physics.js";
import { ActivityModal } from "../modals/activity_modal.js";
import { CreateOrderModal } from "../modals/create_activity_modal.js";

import { LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, JSON_CUSTOMER, JSON_VIAL,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
  JSON_TRACER, WEBSOCKET_MESSAGE_MOVE_ORDERS, JSON_GHOST_ORDER, JSON_RUN, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,
  JSON_ACTIVITY_ORDER, JSON_DELIVER_TIME, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_ID, LEGACY_KEYWORD_CHARGE, LEGACY_KEYWORD_FILLTIME,
  LEGACY_KEYWORD_FILLDATE, LEGACY_KEYWORD_CUSTOMER, LEGACY_KEYWORD_ACTIVITY, LEGACY_KEYWORD_VOLUME,
  WEBSOCKET_MESSAGE_EDIT_STATE, LEGACY_KEYWORD_TRACER, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_WEBSOCKET, JSON_ISOTOPE, PROP_MODAL_ORDER, PROP_ORDER_MAPPING, PROP_ON_CLOSE, JSON_PRODUCTION, JSON_ENDPOINT, JSON_ORDERS, PROP_ON_CLICK, PROP_TIME_SLOT_ID, PROP_TIME_SLOT_MAPPING} from "../../lib/constants.js";

import SiteStyles from "/src/css/Site.module.css"
import { KEYWORD_ActivityDeliveryTimeSlot_DELIVERY_TIME, KEYWORD_ActivityDeliveryTimeSlot_DESTINATION, KEYWORD_ActivityDeliveryTimeSlot_PRODUCTION_RUN, KEYWORD_ActivityOrder_COMMENT, KEYWORD_ActivityOrder_ORDERED_ACTIVITY, KEYWORD_ActivityOrder_ORDERED_BY, KEYWORD_ActivityOrder_ORDERED_TIME_SLOT, KEYWORD_ActivityOrder_STATUS, KEYWORD_Customer_SHORT_NAME, KEYWORD_DeliveryEndpoint_NAME, KEYWORD_DeliveryEndpoint_OWNER } from "../../dataclasses/keywords.js";
import { ClickableIcon, StatusIcon } from "../injectable/icons.js";
import { renderComment } from "../../lib/rendering.js";
import { ActivityDeliveryTimeSlot, ActivityOrder, ActivityProduction, Tracer } from "../../dataclasses/dataclasses.js";

/*
  For the dataclasses described see Tracershop/production/lib/ProductionDataClasses.py
  The Dataclasses have been converted to native javascript Objects. Note these dataclasses doesn't exists
  in the javascript frame work at time of writing this doc.

  The props for this is the following:
            customer : Map <CustomerDataClass.ID, CustomerDataClass>
            date : Date Object - The day that the table is displaying
            deliverTimes : Map <DeliverTimeDataClass.DTID, DeliverTimeDataClass>
            employees : Map<EmployeeDataClass.OldTracerBaseID, EmployeeDataClass>
            isotopes :  Map<IsotopeDataClass.ID, IsotopeDataClass>
            orders : Map<ActivityOrderDataClass.oid, ActivityOrderDataClass>
            runs : Map<RunsDataClass.PTID, RunsDataClass>
            tracer : Number - An id to enter in the map tracers
            tracers : Map<TracerDataClass.id, TracerDataClass>
            t_orders : Map<InjectionOrderDataClass.oid, InjectionOrderDataClass>
            vials : Map<VialDataClass.ID, VialDataClass>
            username : Username of log in user, should be passed to Modal, for verification
            websocket : Active and connected Websocket Object from TracerWebsocket
*/

function OrderRow(props){
  return (<Row>
    <Col><StatusIcon status={props.order[KEYWORD_ActivityOrder_STATUS]}/></Col>
    <Col>Order ID: {props.order.id}</Col>
    <Col>{props.order[KEYWORD_ActivityOrder_ORDERED_ACTIVITY]} MBq</Col>
    <Col>{props.order[KEYWORD_ActivityOrder_COMMENT] ? renderComment(props.order[KEYWORD_ActivityOrder_COMMENT]) : ""}</Col>
  </Row>)
}

function RenderedTimeSlot(props){
  const [open, setOpen] = useState(false);

  const timeSlot = props[JSON_DELIVER_TIME].get(props.timeSlotID);
  const endpoint = props[JSON_ENDPOINT].get(timeSlot.destination);
  const owner    = props[JSON_CUSTOMER].get(endpoint[KEYWORD_DeliveryEndpoint_OWNER]);

  let mbq = 0;
  let minimum_status = 3
  const OrderData = [];

  for(const order of props[JSON_ACTIVITY_ORDER]){
    mbq += order[KEYWORD_ActivityOrder_ORDERED_ACTIVITY]
    minimum_status = Math.min(minimum_status, order.status);
    OrderData.push(<OrderRow
      key={order.id}
      order={order}
    />
    )
  }

  return (
    <Card>
      <Card.Header>
        <Row>
          <Col><StatusIcon status={minimum_status}/></Col>
          <Col>{endpoint[KEYWORD_DeliveryEndpoint_NAME]}</Col>
          <Col>{timeSlot[KEYWORD_ActivityDeliveryTimeSlot_DELIVERY_TIME]}</Col>
          <Col> {mbq} MBq</Col>
          <Col><ClickableIcon
              src={"/static/images/pen.svg"}
              onClick={() => props[PROP_ON_CLICK](props['timeSlotID'])}
            /></Col>
          <Col>
            <ClickableIcon
            src={"/static/images/next.svg"}
            onClick={() => {setOpen(!open)}}
            />
          </Col>
        </Row>
      </Card.Header>

      <Collapse in={open}>
        <Card.Body>
          {OrderData}
        </Card.Body>
      </Collapse>
    </Card>)

}



export class ActivityTable extends Component {
  constructor(props) {
    super(props);

    this.customerTimeSlotMapping = this.createCustomerTimeSlotMapping();

    this.state = {
      showModal : false,
      timeSlotID : null,
      ModalCustomer : null,
      Modal: null
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props[PROP_ACTIVE_DATE] !== prevProps[PROP_ACTIVE_DATE] ||
       this.props[JSON_ACTIVITY_ORDER] !== prevProps[JSON_ACTIVITY_ORDER] ||
       this.props[JSON_CUSTOMER] !== prevProps[JSON_CUSTOMER] ||
       this.props[JSON_DELIVER_TIME] !== prevProps[JSON_DELIVER_TIME]
      ){
      this.customerTimeSlotMapping = this.createCustomerTimeSlotMapping();

    }
  }

  GetProductionDateTimeString(ProductionTime) {
    return String(this.props[PROP_ACTIVE_DATE].getFullYear()) + '-' +
      FormatDateStr(this.props[PROP_ACTIVE_DATE].getMonth() + 1) + '-' +
      FormatDateStr(this.props[PROP_ACTIVE_DATE].getDate()) + "T" +
      ProductionTime;
  }

  createCustomerTimeSlotMapping(){
    const OrderMapping = new Map()

    for(const [activityDeliveryTimeSlotId,activityDeliveryTimeSlot] of this.props[JSON_DELIVER_TIME]){
      const production = this.props[JSON_PRODUCTION].get(activityDeliveryTimeSlot[KEYWORD_ActivityDeliveryTimeSlot_PRODUCTION_RUN])
      if(production === undefined || production.production_day !== ((this.props[PROP_ACTIVE_DATE].getDay() + 6) % 7)){
        continue
      }
      const endpoint = this.props[JSON_ENDPOINT].get(activityDeliveryTimeSlot[KEYWORD_ActivityDeliveryTimeSlot_DESTINATION])
      const owner = this.props[JSON_CUSTOMER].get(endpoint.owner);
      if(owner === undefined){
        console.log("STUFF IS WRONG") // THIS SHOULDN*T HAPPEN
      }
      if(OrderMapping.has(owner.id)){
        OrderMapping.get(owner.id).push(activityDeliveryTimeSlot);
        OrderMapping.get(owner.id).sort((a,b) => {
          return (a < b) ? 1 : -1;
        });
      } else {
        OrderMapping.set(owner.id, [activityDeliveryTimeSlot])
      }
    }
    return OrderMapping;
  }

  /** This Function Moves an order from one Production run to another. It also updates dependant orders.
   *
   * @param {Number} newRun - New run that the order is being moved to.
   * @param {Number} oid - ID of Order being moved
   */
  ChangeRun(newRun, oid) {
    /** So this works for 2 production, however there's so much more fun when you have 3 productions
     *
     * Okay So here is a fun bug / I dunno what happens:
     * Lets say we have 3 Deliver Times
     * 2 gets mapped to 1 -> No problem, however 2 no longer have a master Order
     * 3 gets mapped to 2 -> Big problem, Since there's no master order for DT 2, a new order is created, since there's no master order a new one is created
     * 2 gets mapped to 2 -> Biggest problem, there's now three orders: a ghost order, 2, 3.
     *
     * Now This might not be a problem, there might be some wierd reason why Production might want this, however if Order 2 is moved back, then the orders should be merged
     * Really this is something that might best be handled on the backend
     * Also this is not a problem since for now there's only 2 productions per day, however This will be a problem someday!
     */
    const Order         = this.props[JSON_ACTIVITY_ORDER].get(oid);
    const OrderDate     = new Date(Order.deliver_datetime);
    const Customer      = this.props[JSON_CUSTOMER].get(Order.BID);
    const Tracer        = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER]);
    const isotope       = this.props[JSON_ISOTOPE].get(Tracer.isotope);

    // Find Master Order
    const DeliverTimeMapping = this.customerTimeSlotMapping.get(Customer.ID);

    if(!DeliverTimeMapping){
      console.log(Customer);
      console.log(Order);
      throw "An Order doesn't have a deliverTime mapping for a customer";
    }

    const DeliverTimeObejct = DeliverTimeMapping.get(newRun);

    if (!DeliverTimeObejct){
      console.log(Customer);
      console.log(Order);
      throw "A user is trying to map to a delivertime that doesn't exists for that user!";
    }

    if(DeliverTimeObejct.MasterOrder == null){
      if(DeliverTimeObejct.deliverTime == Order.deliver_datetime){
        // This was an old master Order that is now being moved back
        if(Order.COID === -1){
          throw "You got some data corruption in your orders! Because this should already be a master Order";
        }
        let OldMasterOrder   = this.props[JSON_ACTIVITY_ORDER].get(Order.COID);
        while (OldMasterOrder.COID !== -1){ // There might be a chain of orders
          OldMasterOrder = this.props[JSON_ACTIVITY_ORDER].get(OldMasterOrder.COID);
        }
        const OldMasterOrderDate = new Date(OldMasterOrder.deliver_datetime);
        const OldMinutes = CountMinutes(OldMasterOrderDate, OrderDate);

        const lessActivity = CalculateProduction(isotope.halflife, OldMinutes, Order.amount)
        const lessActivityOverhead = CalculateProduction(isotope.halflife, OldMinutes, Order.amount_o)

        OldMasterOrder.total_amount -= lessActivity;
        OldMasterOrder.total_amount_o -= lessActivityOverhead;

        Order.total_amount = Order.amount;
        Order.total_amount_o = Order.amount_o;
        Order.run = newRun;
        Order.COID = -1;

        const Orders = [Order, OldMasterOrder];

        const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MOVE_ORDERS);
        message[JSON_ACTIVITY_ORDER] = Orders;
        this.props[PROP_WEBSOCKET].send(message);

      } else {
        // Create a ghost order
        const GhostOrderDate = new Date(DeliverTimeObejct.deliverTime);
        const GhostOrderMinutes = CountMinutes(GhostOrderDate, OrderDate);

        const GhostOrderActivity = CalculateProduction(isotope.halflife, GhostOrderMinutes, Order.amount);
        const GhostOrderActivityOverhead = CalculateProduction(isotope.halflife, GhostOrderMinutes, Order.amount_o);

        const GhostOrderData = {
          GhostOrderActivity : GhostOrderActivity,
          GhostOrderActivityOverhead : GhostOrderActivityOverhead,
          GhostOrderDeliverTime : DeliverTimeObejct.deliverTime,
          GhostOrderRun : newRun,
          Tracer : this.props[PROP_ACTIVE_TRACER],
          MappedOrder : Order.oid, // Because the server needs to create the order
          CustomerID : Order.BID
        }

        Order.run = newRun;
        Order.total_amount = 0;
        Order.total_amount_o = 0;
        // Can't set COID since it's an ID for a new Order

        const Orders = [Order];

        if(Order.COID !== -1){
          let OldMasterOrder   = this.props[JSON_ACTIVITY_ORDER].get(Order.COID);
          while (OldMasterOrder.COID !== -1){
            OldMasterOrder = this.props[JSON_ACTIVITY_ORDER].get(OldMasterOrder.COID);
          }

          const OldMasterOrderDate = new Date(OldMasterOrder.deliver_datetime);
          const OldMinutes = CountMinutes(OldMasterOrderDate, OrderDate);

          const lessActivity = CalculateProduction(isotope.halflife, OldMinutes, Order.total_amount);
          const lessActivityOverhead = CalculateProduction(isotope.halflife, OldMinutes, Order.total_amount_o);

          OldMasterOrder.total_amount -= lessActivity;
          OldMasterOrder.total_amount_o -= lessActivityOverhead;

          Orders.push(OldMasterOrder);
        }
        const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MOVE_ORDERS);
        message[JSON_ACTIVITY_ORDER] = Orders;
        message[JSON_GHOST_ORDER] = GhostOrderData;
        this.props[PROP_WEBSOCKET].send(message);
      }

    } else {
      //This is updates the Master and Original Order
      const OldMasterOrderID = Order.COID;
      const MasterOrder = this.props[JSON_ACTIVITY_ORDER].get(DeliverTimeObejct.MasterOrder);
      const MasterOrderDate = new Date(MasterOrder.deliver_datetime);

      const Minutes = CountMinutes(MasterOrderDate, OrderDate);
      console.log(MasterOrderDate, OrderDate, Minutes)
      const AdditionalActivity = CalculateProduction(isotope.halflife, Minutes, Order.total_amount)
      const AdditionalActivityOverhead = CalculateProduction(isotope.halflife, Minutes, Order.total_amount_o)

      MasterOrder.total_amount   += AdditionalActivity;
      MasterOrder.total_amount_o += AdditionalActivityOverhead;

      Order.total_amount = 0;
      Order.total_amount_o = 0;
      Order.COID = MasterOrder.oid;
      Order.run = newRun;

      const Orders = [Order, MasterOrder];

      if(OldMasterOrderID !== -1){
        let OldMasterOrder   = this.props[JSON_ACTIVITY_ORDER].get(OldMasterOrderID);
        while (OldMasterOrder.COID !== -1){
          OldMasterOrder = this.props[JSON_ACTIVITY_ORDER].get(OldMasterOrder.COID);
        }

        const OldMasterOrderDate = new Date(OldMasterOrder.deliver_datetime);
        const OldMinutes = CountMinutes(OldMasterOrderDate, OrderDate);

        const lessActivity = CalculateProduction(isotope.halflife, OldMinutes, Order.amount_total);
        const lessActivityOverhead = CalculateProduction(isotope.halflife, OldMinutes, Order.amount_total_o);

        OldMasterOrder.total_amount -= lessActivity
        OldMasterOrder.total_amount_o -= lessActivityOverhead

        Orders.push(OldMasterOrder);
      }


      const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_MOVE_ORDERS);
      message[JSON_ACTIVITY_ORDER] = Orders;
      this.props[PROP_WEBSOCKET].send(message);
    }
  }


  // Modal Functions
  /**
   * Changes internal state such that the modal for an order is no longer displayed
   */
  closeModal(){
    console.log("close modal");
    this.setState({...this.state,
      showModal : false,
      ModalOrder : null,
      Modal : null,
      timeSlotID: null,
    });
  }

  /**
   * Changes the internal state such that the modal for a timeSlot is displayed
   * @param {Number} - timeSlotID - ID of the timeSlot, that user will operate on.
   *    */
  activateOrderModal(timeSlotID){
    const newState = {...this.state};
    newState.showModal = true;
    newState.Modal = ActivityModal,
    newState[PROP_TIME_SLOT_ID] = timeSlotID;
    this.setState(newState);
  }

  activateCreateModal(){
    this.setState({
      ...this.state,
      Modal : CreateOrderModal,
      showModal : true,
    })
  }




  // Renders
  renderRunSelect(Order) {
    const CustomerSpecificOrderMapping = this.customerTimeSlotMapping.get(Order.BID); //Date filtering is done under construction of Order mapping
    if(!CustomerSpecificOrderMapping) return Order.run; // Most likely, OrderMapping have not been initialized
    const OrderDT = new Date(Order.deliver_datetime);


    const options = []
    for(const [run, DeliverTime] of CustomerSpecificOrderMapping) {
      const ProductionDT = new Date(DeliverTime.deliverTime);
      if (OrderDT >= ProductionDT) {
        options.push((<option key={run} value={run}>{run}</option>));
      }
    }
    if (options.length > 1) {
      //Daily philosophy: When you only have 1 choice you have no choice.
      return (
        <select
        value={Order.run}
        onChange={(event) => this.ChangeRun(Number(event.target.value), Order.oid)}
        >
        {options}
      </select>
    )
    } else {
      return Order.run;
    }
  }

  renderRejectButton(Order){
    if (Order.COID !== -1 || Order.status === 3) return ("");
    return (
        <Button variant="light">
          <img className="statusIcon" src="/static/images/decline.svg"/>
        </Button>
    );
  }

  renderAcceptButtons(Order) {
    if (Order.COID !== -1) return ("");
    if (Order.status == 1) return (<Button variant="light" onClick={
      () => {this.AcceptOrder(Order.oid).bind(this)}}>
        <img className="statusIcon" src="/static/images/accept.svg"></img></Button>);
    if (Order.status == 2) return (<Button variant="light" onClick={
      () => {this.activateOrderModal(Order.oid)}}>
      <img className="statusIcon" src="/static/images/accept.svg"></img></Button>);
    if (Order.status == 3) return ("");
  }

  renderRun(Order){
    if (Order.status === 1) return ""
    if (Order.status === 2) return this.renderRunSelect(Order)
    if (Order.status === 3) return String(Order.run)
  }

  renderFinishedOrder(order) {
    const OrderDT   = new Date(order.deliver_datetime)
    const OrderTime = FormatDateStr(OrderDT.getHours()) + ":" + FormatDateStr(OrderDT.getMinutes())

    const FreeDT    = (order.frigivet_datetime) ? new Date(order.frigivet_datetime) : "-";
    const FreeTime  = (FreeDT != "-") ? FormatDateStr(FreeDT.getHours()) + ":" + FormatDateStr(FreeDT.getMinutes()) : FreeDT

    const Employee     = undefined; // this.props.employee.get(order.frigivet_af);
    const EmployeeName = (Employee) ? Employee.Username : "Ny bruger";

    const customer = this.props[JSON_CUSTOMER].get(order.BID)
    const CustomerName = (customer !== undefined) ? customer.UserName : order.BID;
    const TotalAmount  = (order.COID === -1) ? Math.floor(order.total_amount * (1 + customer.overhead / 100)) : "Flyttet til: " + order.COID;

    return renderTableRow(order.oid, [
      renderStatusImage(order.status, () => this.activateOrderModal(order.oid)),
      order.oid,
      CustomerName,
      TotalAmount,
      order.frigivet_amount,
      FreeTime,
      OrderTime,
      EmployeeName
    ])
  }


  renderPendingOrder(order) {
    const timeSlot = this.props[JSON_DELIVER_TIME].get(order[KEYWORD_ActivityOrder_ORDERED_TIME_SLOT])
    const endpoint = this.props[JSON_ENDPOINT].get(timeSlot[KEYWORD_ActivityDeliveryTimeSlot_DESTINATION])
    const owner = this.props[JSON_CUSTOMER].get(endpoint.owner)

    const OrderDT   = new Date(order.deliver_datetime)
    const OrderTime = FormatDateStr(OrderDT.getHours()) + ":" + FormatDateStr(OrderDT.getMinutes())
    const Run       = this.renderRun(order);

    return renderTableRow(order.id, [
      <StatusIcon
        status={order.status}
        onClick ={() => this.activateOrderModal(order.id)}/>,
      order.id,
      owner[KEYWORD_Customer_SHORT_NAME],
      Math.floor(order[KEYWORD_ActivityOrder_ORDERED_ACTIVITY]),
      0,
      0,
      OrderTime,
      Run,
      this.renderAcceptButtons(order),
      this.renderRejectButton(order)]);

  }

  renderTotal(Production) {
    let total = 0;
    let total_o = 0
    const tracer = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER]);
    const isotope = this.props[JSON_ISOTOPE].get(tracer.isotope);


    return (
    <Row key={Production.id}>
      Kørsel {Production.production_time} : {Math.floor(total)} MBq / Overhead : {Math.floor(total_o)} MBq
    </Row>);
  }

  render() {
    console.log(this.props)
    const FinishedOrders = [];
    const pendingOrders = [];
    const /**@type {Tracer} */ tracer = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER]);

    // This Object is newer than the state version
    // Yeah so this is really anonying here is why
    // So There might be a solution to make it variable that's not state, since it technically isn't a state,
    // But an object that's dependant on props
    //this.OrderMapping = this.createCustomerTimeSlotMapping();
    const /**@type {Array<ActivityOrder>} */ all_orders = [...this.props[JSON_ACTIVITY_ORDER].values()]
    const todays_orders = all_orders.filter((order) => {
      const /**@type {ActivityDeliveryTimeSlot} */ timeSlot = this.props[JSON_DELIVER_TIME].get(order.ordered_time_slot);
      const /**@type {ActivityProduction} */ production = this.props[JSON_PRODUCTION].get(timeSlot.production_run)

      return order.delivery_date === dateToDateString(this.props[PROP_ACTIVE_DATE]) &&
        production.tracer == this.props[PROP_ACTIVE_TRACER]
    })

    const TimeSlotMapping = new Map()
    for(const order of todays_orders){
      if (TimeSlotMapping.has(order[KEYWORD_ActivityOrder_ORDERED_TIME_SLOT])){
        TimeSlotMapping.get(order[KEYWORD_ActivityOrder_ORDERED_TIME_SLOT]).push(order)
      } else {
        TimeSlotMapping.set(order[KEYWORD_ActivityOrder_ORDERED_TIME_SLOT], [order])
      }
    }

    const renderedTimeSlots = []
    for(const [timeSlotID, orders] of TimeSlotMapping){
      const RenderedTimeSlotProps = {};
      RenderedTimeSlotProps[JSON_ENDPOINT] = this.props[JSON_ENDPOINT];
      RenderedTimeSlotProps[JSON_CUSTOMER] = this.props[JSON_CUSTOMER];
      RenderedTimeSlotProps[JSON_DELIVER_TIME] = this.props[JSON_DELIVER_TIME];
      RenderedTimeSlotProps[JSON_ACTIVITY_ORDER] = orders;
      RenderedTimeSlotProps[PROP_ON_CLICK] = this.activateOrderModal.bind(this);

      RenderedTimeSlotProps['timeSlotID'] = timeSlotID;
      RenderedTimeSlotProps['key'] = timeSlotID;

      const element = <RenderedTimeSlot
        {...RenderedTimeSlotProps}
      />
      renderedTimeSlots.push(element)
    }


    const RenderedRuns = [];
    for (const [PTID, production] of this.props[JSON_PRODUCTION]) {
      if (production.production_day === (this.props[PROP_ACTIVE_DATE].getDay() + 6) % 7){
        RenderedRuns.push(this.renderTotal(production));
      }
    }

    const modalProps = {...this.props}
    modalProps[PROP_ORDER_MAPPING] = this.customerTimeSlotMapping
    modalProps[PROP_ON_CLOSE] = this.closeModal.bind(this)
    modalProps[PROP_TIME_SLOT_ID] = this.state[PROP_TIME_SLOT_ID]
    modalProps[PROP_TIME_SLOT_MAPPING] = TimeSlotMapping

    return (<div>
      <Container>
        <Row>
          <Col sm={10}>
            <Row>Produktioner - {this.props[PROP_ACTIVE_DATE].getDate()}/{this.props[PROP_ACTIVE_DATE].getMonth() + 1}/{this.props[PROP_ACTIVE_DATE].getFullYear()}:</Row>
            {RenderedRuns}
          </Col>
          <Col sm={2}>
            <Button name="createOrder" onClick={this.activateCreateModal.bind(this)}>Opret ny ordre</Button>
          </Col>
        </Row>
      </Container>
      <Container>
        {renderedTimeSlots}
      </Container>

    { this.state.showModal ?
      <this.state.Modal
        {...modalProps}
      />
    : null }
    </div>
    );
  }
}