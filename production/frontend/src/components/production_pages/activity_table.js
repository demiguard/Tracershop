
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button, Container } from 'react-bootstrap'
import { renderStatusImage, renderTableRow } from "../../lib/rendering.js";
import { compareDates } from "../../lib/utils.js";
import { FormatDateStr } from "../../lib/formatting.js";
import { CountMinutes, CalculateProduction } from "../../lib/physics.js";
import { ActivityModal } from "../modals/activity_modal.js";
import { CreateOrderModal } from "../modals/create_activity_modal.js";

import { LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_RUN, JSON_CUSTOMER, JSON_VIAL,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS,
  JSON_TRACER, WEBSOCKET_MESSAGE_MOVE_ORDERS, JSON_GHOST_ORDER, JSON_RUN, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,
  JSON_ACTIVITY_ORDER, JSON_DELIVER_TIME, LEGACY_KEYWORD_AMOUNT, LEGACY_KEYWORD_ID, LEGACY_KEYWORD_CHARGE, LEGACY_KEYWORD_FILLTIME,
  LEGACY_KEYWORD_FILLDATE, LEGACY_KEYWORD_CUSTOMER, LEGACY_KEYWORD_ACTIVITY, LEGACY_KEYWORD_VOLUME,
  WEBSOCKET_MESSAGE_EDIT_STATE, LEGACY_KEYWORD_TRACER, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_WEBSOCKET, JSON_ISOTOPE, PROP_MODAL_ORDER, PROP_ORDER_MAPPING, PROP_ON_CLOSE} from "../../lib/constants.js";

import SiteStyles from "/src/css/Site.module.css"

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
export class ActivityTable extends Component {
  constructor(props) {
    super(props);

    this.OrderMapping = this.createOrderMapping();

    this.state = {
      showModal : false,
      ModalOrder : null,
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
      this.OrderMapping = this.createOrderMapping();

    }
  }

  GetProductionDateTimeString(ProductionTime) {
    return String(this.props[PROP_ACTIVE_DATE].getFullYear()) + '-' +
      FormatDateStr(this.props[PROP_ACTIVE_DATE].getMonth() + 1) + '-' +
      FormatDateStr(this.props[PROP_ACTIVE_DATE].getDate()) + "T" +
      ProductionTime;
  }

  /** This constructs a data structure from the props: date, orders, deliverTimes, customers
   *  The Data struct is as follows:
   *  Map< keys:Customers.id, value:Map<
   *         keys:deliverTime.run, {MasterOrder - Optional[Number], extraOrders - Array[Number] , deliverTime - String}>
   *     >
   *
   *  The master order is the order that is expanded if other orders are moved to this time slot.
   *  extraOrders is a list of additional orders, that is / should be delivered in this time slot
   *  delivertime is the delivertime for this run.
   *
   * @returns Map as described above
   */
  createOrderMapping(){
    const today     = this.props[PROP_ACTIVE_DATE].getDay();
    const JanOne    = new Date(this.props[PROP_ACTIVE_DATE].getFullYear(),0,1);
    const NumDays   = Math.floor(this.props[PROP_ACTIVE_DATE] - JanOne) / (24 * 60 * 60 * 1000);
    const WeekNum   = Math.ceil((this.props[PROP_ACTIVE_DATE].getDay() + 1 + NumDays) / 7);
    const WeekNumIsEven = WeekNum % 2 === 0;

    const NewOrderMapping = new Map();

    for(const [customerID, _] of this.props[JSON_CUSTOMER]){
      NewOrderMapping.set(customerID, new Map());
    }

    for(const [DTID, deliverTime] of this.props[JSON_DELIVER_TIME]){
      // Check if date is ok?
      if (deliverTime.day !== today) continue;
      if (deliverTime.repeat_t === 2 && !WeekNumIsEven) continue;
      if (deliverTime.repeat_t === 3 && WeekNumIsEven) continue;
      const customerMap = NewOrderMapping.get(deliverTime.BID);
      if (customerMap === undefined){
        console.log("A Delivertime cannot be associated with customer"); // You should send a message that database is broken and an somebody should REEEEEALY fix it
        console.log(deliverTime);
        continue; // WHO CARES THAT STUFF DON'T WORK?
      }
      customerMap.set(deliverTime.run, {
        MasterOrder : null,
        extraOrders : [],
        deliverTime : this.GetProductionDateTimeString(deliverTime.dtime),
        DTID : DTID
      });
    }

    for(const [oid, Order] of this.props[JSON_ACTIVITY_ORDER]){
      // This just build things up with out checking for data integrety.
      // You might need to add some validation, that gives some sort of warning if stuff breaks.
      const orderDate = new Date(Order.deliver_datetime);
      if (!compareDates(this.props[PROP_ACTIVE_DATE], orderDate) || Order.tracer !== this.props[PROP_ACTIVE_TRACER]) continue;

      const customerMap = NewOrderMapping.get(Order.BID);
      if(customerMap === undefined){
        console.log("An order was made to an unknown customer");
        console.log(Order);
        console.log(NewOrderMapping);
        continue
      }
      const DeliverTimeStruct = customerMap.get(Order.run);
      // Note Here I need the timestring and not the Date Object
      if (DeliverTimeStruct) {
        if(Order.deliver_datetime == DeliverTimeStruct.deliverTime && DeliverTimeStruct.MasterOrder == null){
          DeliverTimeStruct.MasterOrder = oid;
        } else {
          DeliverTimeStruct.extraOrders.push(oid);
        }
      } else {
        console.log("An order was made to a known customer, but to an unknown time slot");
      }
    }
    return NewOrderMapping;
  }

  // State Changing Functions
  /**
   * This function is called in response to a user accepting an order
   * It updates the status from 1 to 2 and sends it to server causing a response giving a
   * site wide change
   *
   * @param {Number} oid  Order ID to be accepted.
   */
  AcceptOrder(oid) {
    const Order = this.props[JSON_ACTIVITY_ORDER].get(oid);
    Order.status = 2

    const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
    message[WEBSOCKET_DATA] = Order;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;

    this.props[PROP_WEBSOCKET].send(message);
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
    const DeliverTimeMapping = this.OrderMapping.get(Customer.ID);

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
    this.setState({...this.state,
      showModal : false,
      ModalOrder : null,
      Modal : null,
    });
  }

  /**
   * Changes the internal state such that the modal for the request oid is displayed
   * @param {number} oid
   */
  activateOrderModal(oid){
    this.setState({...this.state,
      showModal : true,
      ModalOrder : oid,
      Modal : ActivityModal
    });
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
    const CustomerSpecificOrderMapping = this.OrderMapping.get(Order.BID); //Date filtering is done under construction of Order mapping
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


  renderPendingOrder(Order) {
    const OrderDT   = new Date(Order.deliver_datetime)
    const OrderTime = FormatDateStr(OrderDT.getHours()) + ":" + FormatDateStr(OrderDT.getMinutes())
    const Run       = this.renderRun(Order);
    const customer = this.props[JSON_CUSTOMER].get(Order.BID)
    const CustomerName = (customer !== undefined) ? customer.UserName : Order.BID;
    const TotalAmount  = (Order.COID === -1) ? Math.floor(Order.total_amount) : "Flyttet til:" + Order.COID;
    const TotalAmountO = (Order.COID === -1) ? Math.floor(Order.total_amount * (1 + customer.overhead / 100)) : "";

    return renderTableRow(Order.oid, [renderStatusImage(Order.status, () => this.activateOrderModal(Order.oid)),
      Order.oid,
      CustomerName,
      Math.floor(Order.amount),
      TotalAmount,
      TotalAmountO,
      OrderTime,
      Run,
      this.renderAcceptButtons(Order),
      this.renderRejectButton(Order)]);

  }

  renderTotal(Production) {
    let total = 0;
    let total_o = 0
    const tracer = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER]);
    const isotope = this.props[JSON_ISOTOPE].get(tracer.isotope);
    for(const [_, DeliverTimeMap] of this.OrderMapping){
      const RelvantDeliverTime = DeliverTimeMap.get(Production.run);
      const ProductionDatetime = new Date(
        this.props[PROP_ACTIVE_DATE].getFullYear(),
        this.props[PROP_ACTIVE_DATE].getMonth(),
        this.props[PROP_ACTIVE_DATE].getDate(),
        Number(Production.ptime.substring(0,2)),
        Number(Production.ptime.substring(3,5))
        )

      if(RelvantDeliverTime){ // If there's mapping else It doesn't matter
        if(RelvantDeliverTime.MasterOrder) {
          const MasterOrder = this.props[JSON_ACTIVITY_ORDER].get(RelvantDeliverTime.MasterOrder);
          const MasterOrderCustomer = this.props[JSON_CUSTOMER].get(MasterOrder.BID);
          if(MasterOrder === undefined){
            console.log(this.props[JSON_ACTIVITY_ORDER])
            console.log(DeliverTimeMap);
            console.log(RelvantDeliverTime);
          }
          const TimeDelta = CountMinutes(ProductionDatetime, new Date(MasterOrder.deliver_datetime));
          total += CalculateProduction(isotope.halflife, TimeDelta, MasterOrder.total_amount);
          total_o += CalculateProduction(isotope.halflife, TimeDelta, MasterOrder.total_amount * (1 + MasterOrderCustomer.overhead / 100));
        }
        for(const OrderID of RelvantDeliverTime.extraOrders){
          const ExtraOrder = this.props.orders.get(OrderID);
          const ExtraOrderCustomer = this.props.customers.get(ExtraOrder.BID);
          const TimeDelta = CountMinutes(ProductionDatetime, new Date(ExtraOrder.deliver_datetime));
          total += CalculateProduction(isotope.halflife, TimeDelta, ExtraOrder.total_amount);
          total_o += CalculateProduction(isotope.halflife, TimeDelta, ExtraOrder.total_amount * (1 + ExtraOrderCustomer.overhead / 100))
        }
      }
    }

    return (
    <Row key={Production.run}>
      Kørsel : {Production.run} - {Production.ptime} : {Math.floor(total)} MBq / Overhead : {Math.floor(total_o)} MBq
    </Row>);
  }

  render() {
    const FinishedOrders = [];
    const pendingOrders = [];
    const Tracer = this.props[JSON_TRACER].get(this.props[PROP_ACTIVE_TRACER]);

    // This Object is newer than the state version
    // Yeah so this is really anonying here is why
    // So There might be a solution to make it variable that's not state, since it technically isn't a state,
    // But an object that's dependant on props
    this.OrderMapping = this.createOrderMapping();
    const Orders = [...this.props[JSON_ORDERS].values()].sort((order_1, order_2) => {
      if (order_1.BID < order_2.BID) {
        return -1;
      } else if (order_1.BID > order_2.BID){
        return 1;
      } else {
        // order.BID equals
        if (order_1.deliver_datetime < order_2.deliver_datetime){
          return -1;
        } else {
          return 1;
        }
      }
    });

    for (const order of Orders){
      const orderDate = new Date(order.deliver_datetime);
      if (compareDates(this.props[PROP_ACTIVE_DATE], orderDate) && order.tracer == this.props[PROP_ACTIVE_TRACER] ){
        (order.status == 3) ?
          FinishedOrders.push(this.renderFinishedOrder(order)) :
          pendingOrders.push(this.renderPendingOrder(order));
      }
    }

    const RenderedRuns = [];
    /*
    for (const [PTID, run] of this.props.runs) {
      if (run.day === this.props.date.getDay()){
        RenderedRuns.push(this.renderTotal(run));
      }
    }
    */

    const modalProps = {}
    modalProps[PROP_MODAL_ORDER] = this.state[PROP_MODAL_ORDER]
    modalProps[PROP_ORDER_MAPPING] = this.OrderMapping
    modalProps[PROP_ON_CLOSE] = this.closeModal.bind(this)

    modalProps[PROP_WEBSOCKET] = this.props[PROP_WEBSOCKET]
    modalProps[PROP_ACTIVE_DATE] = this.props[PROP_ACTIVE_DATE]
    modalProps[PROP_ACTIVE_TRACER] = this.props[PROP_ACTIVE_TRACER]
    modalProps[JSON_TRACER] = this.props[JSON_TRACER]
    modalProps[JSON_ISOTOPE] = this.props[JSON_ISOTOPE]
    modalProps[JSON_ACTIVITY_ORDER] = this.props[JSON_ACTIVITY_ORDER]
    modalProps[JSON_VIAL] = this.props[JSON_VIAL]
    modalProps[JSON_CUSTOMER] = this.props[JSON_CUSTOMER]

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
      { pendingOrders.length ? // This statement makes it so the table is conditionally render on the number of orders
        <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Kunde</th>
            <th>Bestilt </th>
            <th>Total Bestilling</th>
            <th>Med Overhead</th>
            <th>tid</th>
            <th>Kørsel</th>
            <th>Accept</th>
            <th>Afvis</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders}
        </tbody>
      </Table> : null
      }
      { FinishedOrders.length ?
        <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Kunde</th>
            <th>Ønsket Aktivitet</th>
            <th>Frigivet Aktivitet</th>
            <th>Frigivet kl:</th>
            <th>Tid</th>
            <th>Frigivet af</th>
          </tr>
        </thead>
        <tbody>
          {FinishedOrders}
        </tbody>
      </Table> : null
    }
    { FinishedOrders.length == 0 && pendingOrders == 0 ?
    <div>
      <p className={SiteStyles.mariLfont}>Der er ingen {Tracer.name} Ordre til den {this.props[PROP_ACTIVE_DATE].getDate()}/{this.props[PROP_ACTIVE_DATE].getMonth() + 1}/{this.props.date.getFullYear()}</p>
    </div> :
      null
    }

    { this.state.showModal ?
      <this.state.Modal
        {...modalProps}
      />
    : null }
    </div>
    );
  }
}