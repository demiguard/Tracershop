import { ajax, parseJSON } from "jquery";
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button } from 'react-bootstrap'
import { renderStatusImage, renderTableRow } from "./lib/Rendering";
import { TracerWebSocket } from "./lib/TracerWebsocket";
import { CompareDates } from "./lib/utils";
import { FormatDateStr, ParseJSONstr } from "./lib/formatting";
import { CountMinutes, CalculateProduction } from "./lib/physics";
import { ActivityModal } from "./ActivityModal.js";
import { JSON_CUSTOMER, JSON_ORDERS, JSON_PRODUCTIONS, JSON_RUNS, JSON_VIALS, 
  WEBSOCKET_DATA_ORDER, WEBSOCKET_DATA_ORDERS, WEBSOCKET_DATA_VIAL, WEBSOCKET_DATA_VIALS, 
  WEBSOCKET_DATA_TRACER, WEBSOCKET_MESSAGE_CREATE_VIAL, WEBSOCKET_MESSAGE_EDIT_VIAL, 
  WEBSOCKET_MESSAGE_FREE_ORDER, WEBSOCKET_MESSAGE_UPDATEORDERS, JSON_EMPLOYEE,
} from "./lib/constants";


export { ActivityTable }

/*
  As all documentation in code, this might be out of date, 
  
  This Table is starting to become really complicated...
  
  you can find the true answer in the SQLController / SQLLegacyController file
  Orders are Native Objects on the format: 
  {
    status       : Int
    oid          : Int
    run          : Int
    BID          : Int
    amount       : Float
    total_amount : Float
    deliver_datetime : Str //note it's on a date time format where you can call new Date(orders.delivers_datetime)

  }

  ***** IDIOT NOTICE *****
    So some genious figure out, Hey this websocket is kinda smart lets not use it. Instead lets use normal AJAX calls

    So a massive TODO is removing all the AJAX calls and instead make them over the websocket
    websockets are harder better faster stronger, Also we need to do some encryption...
*/



class ActivityTable extends Component {
  constructor(props) {
    super(props);

    this.websocket = new TracerWebSocket("ws://" + window.location.host + "/ws/activity/" + this.props.tracer.id + "/", this);

    this.state = {
      orders    : new Map(),
      runs      : new Map(),
      customer  : new Map(),
      vial      : new Map(),
      employees : new Map(),

      showModal : false,
      ModalOrder : null,
      ModalCustomer : null,
    }

    ajax({
      url:`api/getActivityTable/${this.props.tracer.id}/${this.props.date.getFullYear()}/${this.props.date.getMonth() + 1}/${this.props.date.getDate()}`,
      type:"get",
    }).then((data) => {
      const CustomerMap = new Map();
      for (let CustomerString of data[JSON_CUSTOMER]) {
        const Customer = ParseJSONstr(CustomerString)
        CustomerMap.set(Customer.ID, {
          username : Customer.UserName,
          ID       : Customer.ID,
          overhead : Customer.overhead,
          productions : [],
          CustomerNumber : Customer.CustomerNumber,
          Name   : Customer.Name,
        });
      }
      const Productions = []
      for(const ProductionStr of data[JSON_PRODUCTIONS]){
        Productions.push(ParseJSONstr(ProductionStr));
      }

      const Orders = []
      for(const OrderStr of data[JSON_ORDERS]) {
        Orders.push(ParseJSONstr(OrderStr))
      }

      this.InsertProductions(CustomerMap, Productions);

      // These are the attual productions runs
      const RunMap = new Map();
      for (let RunStr of data[JSON_RUNS]) {
        const Run = ParseJSONstr(RunStr)
        if (RunMap.has(Run.day)){
          //Remake list ahear to the principle of purity
          const Runs = [...RunMap.get(Run.day)] 
          Runs.push(Run)
          Runs.sort((r1, r2) => (r1.ptime > r2.ptime) ? 1 : -1)
          RunMap.set(Run.day, Runs)
        } else {
          RunMap.set(Run.day, [Run])
        }
      }

      const newOrders = this.InsertOrders(CustomerMap, Orders)      

      const NewVials = new Map();
      for(let vialStr of data[JSON_VIALS]) {
        const vial = ParseJSONstr(vialStr)
        NewVials.set(vial.ID, vial);
      }

      const NewEmployee = new Map();
      for (let employeeStr of data[JSON_EMPLOYEE]) {
        const employee = ParseJSONstr(employeeStr);
        NewEmployee.set(employee.OldTracerBaseID, employee);
      }
      

      const newState = {
        ...this.state,
        runs   : RunMap,
        orders : newOrders,
        customer : CustomerMap,
        vial : NewVials,
        employees : NewEmployee
      };
      this.setState(newState);
    });    
  }


  //Updating Calender
  componentDidUpdate(prevProps) {
    if (this.props.date !== prevProps.date) {
      this.updateOrders(this.props.date)
    }
  }

  updateOrders(newDate) {
    ajax({
      url:`api/getActivityOrders/${this.props.tracer.id}/${newDate.getFullYear()}/${newDate.getMonth() + 1}/${newDate.getDate()}`,
      type:"get"
    }).then((data) => {
      var newCustomerMap = new Map(this.state.customer);
      for(var [BID, Customer] of newCustomerMap.entries()){
        var Customer = {...Customer};
        Customer.productions = [];
        newCustomerMap.set(BID, Customer);
      }
      const Productions = [];
      for(const ProductionStr of data[JSON_PRODUCTIONS]){
        Productions.push(ParseJSONstr(ProductionStr));
      }
      const Orders = [];
      for(const OrderStr of data[JSON_ORDERS]){
        Orders.push(ParseJSONstr(OrderStr));
      }

      newCustomerMap  = this.InsertProductions(newCustomerMap, Productions);
      const newOrders = this.InsertOrders(newCustomerMap, Orders);
      this.SetOrdersCustomers(newOrders, newCustomerMap);

      const newVials = new Map();
      if (data[JSON_VIALS]) for(let vialStr of data[JSON_VIALS]){
        const vial = ParseJSONstr(vialStr);
        newVials.set(vial.ID, vial);
      }
      this.setState({...this.state, vial: newVials});
    });
  }

  
  //This is primary the message filter if a message is relevant.
  ShouldOrdersUpdate(newDate) {
    return CompareDates(newDate, this.props.date) 
  }

  InsertProductions(CustomerMap, Productions) {
    const today     = this.props.date.getDay();
    const JanOne    = new Date(this.props.date.getFullYear(),0,1);
    const NumDays   = Math.floor(this.props.date - JanOne) / (24 * 60 * 60 * 1000);
    const WeekNum   = Math.ceil((this.props.date.getDay() + 1 + NumDays) / 7);
    const WeekNumIsEven = WeekNum % 2 === 0
    for (let Production of Productions) {
      if (Production.day !== today)                  continue;
      if (Production.repeat === 2 && !WeekNumIsEven) continue;
      if (Production.repeat === 3 && WeekNumIsEven)  continue;
      const Customer = CustomerMap.get(Production.BID);
      if (Customer === undefined) continue;
      Customer.productions.push({
        orders : [],
        dtime  : Production.dtime,
        run    : Production.run,
      });
      Customer.productions.sort((p1, p2) => (p1.run > p2.run) ? 1 : -1);
    }
    return CustomerMap;
  }

  InsertOrders(CustomerMap, Orders) {
    const newOrders = new Map();
    for (const Order of Orders) {
      newOrders.set(Order.oid, Order);
      const Customer   = CustomerMap.get(Order.BID);
      const Production = Customer.productions[Order.run - 1];
      if (Production === undefined) continue;
      Production.orders.push(Order);
    }
    return newOrders;
  }


  SetOrdersCustomers(newOrders, newCustomerMap) {
    const newState = {
      ...this.state,
      orders : newOrders,
      customer : newCustomerMap
    };
    this.setState(newState);
  }


  GetProductionDateTimeString(Production) {
    return String(  this.props.date.getFullYear()) + '-' +
      FormatDateStr(this.props.date.getMonth() + 1) + '-' +
      FormatDateStr(this.props.date.getDate()) + "T" +  
      Production.dtime;
  }


  // State Changing Functions 
  // Accepting Order Functions AKA An order Going from Status 1 to Status 2
  AcceptOrder(oid) {
    const Order = this.state.orders.get(oid);
    Order.status = 2
    this.SetOrder(Order);
    //One needs this way of object constrution to have constants keys
    const jsonData = this.websocket.getDefaultMessage(this.props.date, WEBSOCKET_MESSAGE_UPDATEORDERS);
    jsonData[WEBSOCKET_DATA_ORDERS] = [Order]
    this.websocket.send(JSON.stringify(jsonData));
  }

  AcceptOrderIncoming(oid, messageDate) {
    if (this.ShouldOrdersUpdate(messageDate)) {
      const Order = this.state.orders.get(oid);
      Order.status = 2
      this.SetOrder(Order);
    }
  }
 
  SetOrder(Order) {
    //Note you should Look at liberay called immer
    //The Liberay deals with Updatling large objects, like the Customer Map
    console.log(Order);
    
    const NewOrder        = {...Order};
    const NewOrders    = new Map(this.state.orders);
    const NewCustomers = new Map(this.state.customer);
    // Set New object in Customer Map
    const Customer     = {...NewCustomers.get(Order.BID)};

    for (let ProductionI = 0; ProductionI < Customer.productions.length; ProductionI++) {
      const Production = Customer.productions[ProductionI];
      if (ProductionI === (Order.run - 1)) {
        const pOrders = Production.orders;
        var oldOrderI = undefined;
        for(let pOrderI in pOrders) {
          const pOrder = pOrders[pOrderI];
          if (pOrder.oid === NewOrder.oid) {
            oldOrderI = pOrderI;
            break;
          }
        }
        if (oldOrderI !== undefined) {
          pOrders[oldOrderI] = Order;
        } else {
          pOrders.push(Order);
        }
      } else {
        Customer.productions[ProductionI].orders = 
          Customer.productions[ProductionI].orders.filter(function(
            OldOrder, index, arr
          ){
          return OldOrder.oid !== Order.oid; 
        });
      }
      
    }
    
    // Set new object in NewOrders & NewCustomers
    NewOrders.set(Order.oid, Order); 
    NewCustomers.set(Customer.ID, Customer);
    this.SetOrdersCustomers(NewOrders, NewCustomers);
  }


  // Change the Run value of a Order:
  ChangeRun(newRun, oid) {
    const Order         = {...this.state.orders.get(oid)};
    const Customer      = {...this.state.customer.get(Order.BID)};
    const NewProduction = Customer.productions[newRun - 1];
    
    const ProductionDateTimeString = this.GetProductionDateTimeString(NewProduction)
    
    const NewProductionDT = new Date(ProductionDateTimeString);
    const OrderTime       = new Date(Order.deliver_datetime);
    
    if (NewProductionDT <= OrderTime) {
      Order.run = newRun;
      this.SetOrder(Order);
      
      this.updateAmountForCustomer(Customer.ID).then(
        ((UpdatedOrders) => {
          const jsonData = this.websocket.getDefaultMessage(
            this.props.date, WEBSOCKET_MESSAGE_UPDATEORDERS);
          jsonData[WEBSOCKET_DATA_ORDERS] = UpdatedOrders;
          this.websocket.send(JSON.stringify(jsonData));
        })
      );
    } else {
      //TODO: Post Error as you cannot deliver this.
      throw "This should not happen, you need to update your rendering"
    }
  }

  UpdateOrderFromWebsocket(newDate, UpdatedOrders){
    if(this.ShouldOrdersUpdate(newDate)){
      for(const Order of UpdatedOrders){
        this.SetOrder(Order);
      }
    }
  }

  async createNewOrder(CustomerID, Production){
    const orderDateTime = this.GetProductionDateTimeString(Production)
    // There's some code smell here
    const newOrder = await ajax({
      url : "api/createEmptyActitityOrder",
      type:"POST",
      datatype:"json",
      data:JSON.stringify({
        CustomerID    : CustomerID,
        orderDateTime : orderDateTime,
        run           : Production.run
      })
    });
    this.SetOrder(newOrder);
    return newOrder;
  }

  async updateAmountForCustomer(ID){
    //This function updates the values FDG amount,
    //such that the orders are in a consistent state 
    
    const Customer = {...this.state.customer.get(ID)};
    const NewOrders = new Map(this.state.orders);
    if (Customer === undefined) {
      throw "Customer Not found";
    }
    const ChangedOrders = []
    for (const ProductionI in Customer.productions) {
      const Production = {...Customer.productions[ProductionI]};
      var MasterOrder = null; //Order to the given time slot
      const ServantOrders = []; //Orders outside the time slot
      const ProductionDateTimeString = this.GetProductionDateTimeString(Production);
      const ProductionDateTime = new Date(ProductionDateTimeString);
      for (const orderI in Production.orders) {
        const order = {...Production.orders[orderI]};
        if (order.deliver_datetime === ProductionDateTimeString) {
          MasterOrder = {...order};
        } else {
          ServantOrders.push({...order});
        }
        Production.orders[orderI] = order;
      }

      if (MasterOrder === null && ServantOrders.length > 0) {
        MasterOrder = await this.createNewOrder(ID,Production);
        //Create a new order
      } else if (MasterOrder === null && ServantOrders.length === 0) {
        continue;
      }
      MasterOrder.total_amount = MasterOrder.amount;
      MasterOrder.COID = -1;
      for (const SOrder of ServantOrders) {
        const MinDiff = CountMinutes(
          ProductionDateTime, 
          new Date(SOrder.deliver_datetime)
        );
          
        const OrderContribution = CalculateProduction(this.props.tracer.halflife, MinDiff, SOrder.amount);
          //Updating Orders
        MasterOrder.total_amount += OrderContribution;
        SOrder.total_amount = 0;
        SOrder.total_amount_o = 0;
        SOrder.COID = MasterOrder.oid;
          //We can update the order now, because we are not touching it later in the function
        NewOrders.set(SOrder.oid, SOrder);
        ChangedOrders.push(SOrder);
      }
      MasterOrder.total_amount_o = MasterOrder.total_amount * (1 + Customer.overhead/100);
      NewOrders.set(MasterOrder.oid, MasterOrder);
      ChangedOrders.push(MasterOrder);
      
      Customer.productions[ProductionI] = Production;
    }
    const NewCustomerMap = new Map(this.state.customer);
    NewCustomerMap.set(Customer.ID, Customer);
    this.SetOrdersCustomers(NewOrders, NewCustomerMap);

    return ChangedOrders
  }

  // Modal Functions
  /**
   * Changes internal state such that the modal for an order is no longer displayed
   */
  closeModal(){
    this.setState({...this.state,
      showModal : false,
      ModalOrder : null,
      ModalCustomer : null,
    });
  }

  /**
   * Changes the internal state such that the modal for the request oid is displayed
   * @param {number} oid 
   */
  activateModal(oid){
    const Order = this.state.orders.get(oid);
    if(Order === null) throw "Order is null";
    if(Order === undefined) throw "Order is undefined";
    const Customer = this.state.customer.get(Order.BID)

    this.setState({...this.state,
      showModal : true,
      ModalOrder : Order,
      ModalCustomer : Customer,
    });
  }

  createVial(
    Charge,
    FillTime,
    Volume,
    Activity, 
    CustomerNumber
  ){
    const FillDate = String(this.props.date.getFullYear()) + '-' +
      FormatDateStr(this.props.date.getMonth() + 1) + '-' +
      FormatDateStr(this.props.date.getDate());

      const jsonData = this.websocket.getDefaultMessage(
        this.props.date, WEBSOCKET_MESSAGE_CREATE_VIAL);
      jsonData[WEBSOCKET_DATA_VIAL] = {
        "charge" : Charge,
        "filltime" : FillTime,
        "filldate" : FillDate, 
        "customer" : CustomerNumber,
        "activity" : Activity,
        "volume" : Volume
      };
    this.websocket.send(JSON.stringify(jsonData));
  }

  recieveVial(Vial){
    const TodayStr = String(this.props.date.getFullYear()) + '-' +
      FormatDateStr(this.props.date.getMonth() + 1) + '-' +
      FormatDateStr(this.props.date.getDate());
    
    if (Vial.filldate == TodayStr)  {
      const NewVials = new Map(this.state.vial);
      NewVials.set(Vial.ID, Vial);
      this.setState({...this.state, vial : NewVials});
    }
  }

  editVial(ID,
    Charge,
    FillTime,
    Volume,
    Activity, 
    CustomerNumber)
  {
    const FillDate = `${this.props.date.getFullYear()}-${FormatDateStr(this.props.date.getMonth() + 1)}-${FormatDateStr(this.props.date.getDate())}`;
    const jsonData = this.websocket.getDefaultMessage(this.props.date, WEBSOCKET_MESSAGE_EDIT_VIAL)
    jsonData[WEBSOCKET_DATA_VIAL] = {
      "ID"     : ID,
      "charge" : Charge,
      "filltime" : FillTime,
      "filldate" : FillDate, 
      "customer" : CustomerNumber,
      "activity" : Activity,
      "volume" : Volume
    };
    
    this.websocket.send(JSON.stringify(jsonData)); 
  }

  /**
   * This function takes a validated order and send the information back to  
   * @param {number} orderID 
   * @param {Set<number>} vialSet 
   */
  FreeOrder(orderID, vialSet){
    console.log(vialSet);
    const vialIDs = [...vialSet];
    const vials = vialIDs.map(id => this.state.vial.get(id));
    const order = this.state.orders.get(orderID);
    this.closeModal();
    const jsonData = this.websocket.getDefaultMessage(this.props.date, WEBSOCKET_MESSAGE_FREE_ORDER);
    jsonData[WEBSOCKET_DATA_VIALS] = vials;
    jsonData[WEBSOCKET_DATA_TRACER] = this.props.tracer.id;
    jsonData[WEBSOCKET_DATA_ORDER] = order;
    this.websocket.send(JSON.stringify(jsonData));
  }

  // Renders 
  renderRunSelect(Order) {
    const Day  = this.props.date.getDay();
    const Customer = this.state.customer.get(Order.BID);

    const OrderDT = new Date(Order.deliver_datetime);


    const options = []
    for(const Production of Customer.productions) {
      const ProductionDT = new Date(this.GetProductionDateTimeString(Production))
      if (OrderDT >= ProductionDT) {
        options.push((<option key={Production.run} value={Production.run}>{Production.run}</option>));
      }
    }

    if (options.length > 1) { 
      //Daily philosophy: When you only have 1 chocie you have no chocie.
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
    if (Order.COID !== -1 || Order.status === 3) return (<td></td>);
    return (
      <td>
        <Button variant="light">
          <img className="statusIcon" src="/static/images/decline.svg"/>
        </Button>
      </td>
    );
  }

  renderAcceptButtons(Order) {
    if (Order.COID !== -1) return (<td></td>); 
    if (Order.status == 1) return (<td><Button variant="light" onClick={() => {this.AcceptOrder(Order.oid)}}><img className="statusIcon" src="/static/images/accept.svg"></img></Button></td>);
    if (Order.status == 2) return (<td><Button variant="light" onClick={() => {this.activateModal(Order.oid)}}><img className="statusIcon" src="/static/images/accept.svg"></img></Button></td>);
    if (Order.status == 3) return (<td></td>);
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

    const Employee     = this.state.employees.get(order.frigivet_af)
    const EmployeeName = (Employee) ? Employee.Username : "Ny bruger";

    const customer = this.state.customer.get(order.BID)
    const CustomerName = (customer !== undefined) ? customer.username : order.BID;
    const TotalAmount  = (order.COID === -1) ? order.total_amount_o : "Flyttet til:" + order.COID;

    return renderTableRow(order.oid, [
      renderStatusImage(order.status, () => this.activateModal(order.oid)),
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
    
    const customer = this.state.customer.get(Order.BID)
    const CustomerName = (customer !== undefined) ? customer.username : Order.BID;
    const TotalAmount  = (Order.COID === -1) ? Order.total_amount : "Flyttet til:" + Order.COID;
    const TotalAmountO = (Order.COID === -1) ? Order.total_amount_o : "";

    return (
    <tr key={Order.oid}> 
      <td>{renderStatusImage(Order.status, () => this.activateModal(Order.oid))}</td>
      <td>{Order.oid}</td>
      <td>{CustomerName}</td>
      <td>{Order.amount}</td>
      <td>{TotalAmount}</td>
      <td>{TotalAmountO}</td>
      <td>{OrderTime}</td>
      <td>{Run}</td>
      {this.renderAcceptButtons(Order)}
      {this.renderRejectButton(Order)}
    </tr>)
  }

  renderTotal(run, _index, _arr) {
    var total = 0;
    var total_o = 0
    const runDateString = String(this.props.date.getFullYear() + '-' +
      FormatDateStr(this.props.date.getMonth() + 1)) + '-' +
      FormatDateStr(this.props.date.getDate()) + "T" + run.ptime;
    const runDate = new Date(runDateString);
    for(const [_BID, Customer ] of this.state.customer.entries()){
      for(const Production of Customer.productions){
        if (Production.run === run.run) {
          var contribution = 0;
          for (const Order of Production.orders) {
            contribution += Order.total_amount;
          }
          if(contribution === 0) continue;
          
          const ProductionDatetime = new Date(this.GetProductionDateTimeString(Production));
          const MinDiff = CountMinutes(runDate, ProductionDatetime);
          const TimeCorrectedContribution = CalculateProduction(this.props.tracer.halflife, MinDiff, contribution);
          total += TimeCorrectedContribution;
          total_o += Math.floor(TimeCorrectedContribution * (1 + Customer.overhead / 100));
        }
      }
    }

    return (
    <div key={run.run}>
      Kørsel : {run.run} - {run.ptime} : {total} MBq / Overhead : {total_o} MBq
    </div>);
  }


  render() {
    const FinishedOrders = [];
    const pendingOrders = [];
    for (const [oid, order] of this.state.orders.entries()){
      if (order.status == 3) {
        FinishedOrders.push(this.renderFinishedOrder(order))
      } else 
      pendingOrders.push(this.renderPendingOrder(order))
    }

    const dailyRuns = this.state.runs.get(this.props.date.getDay());
    const RenderedRuns = []
    if (dailyRuns !== undefined) {
      for (const run of dailyRuns) {
        RenderedRuns.push(this.renderTotal(run));
      }
    }

    console.log(this.state)
    
    return (<div>
      <div> Produktioner: <br/>
        {RenderedRuns}
      </div>
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
      </Table> : <div/>
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
      </Table> : <div/>
    }
    { this.state.showModal ? 
      <ActivityModal
        show={this.state.showModal}
        Order={this.state.ModalOrder}
        vials={this.state.vial}
        customer={this.state.ModalCustomer}
        onClose={this.closeModal.bind(this)}
        createVial={this.createVial.bind(this)}
        editVial={this.editVial.bind(this)}
        AcceptOrder={this.FreeOrder.bind(this)}
      />
    : null }
    </div>
    );
  }
}