import { ajax } from "jquery";
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button } from 'react-bootstrap'
import { renderStatusImage } from "./lib/Rendering";
import { TracerWebSocket } from "./lib/TracerWebsocket";
import { CompareDates } from "./lib/utils";
import { FormatDateStr } from "./lib/formatting";
import { CountMinutes, CalculateProduction } from "./lib/physics";


export { FDGTable }

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
*/



export default class FDGTable extends Component {
  constructor(props) {
    super(props);

    this.websocket = new TracerWebSocket("ws://" + window.location.host + "/ws/FDG/", this);

    this.state = {
      orders   : new Map(),
      runs     : new Map(),
      customer : new Map(),
    }

    ajax({
      url:"api/getinitialinformation",
      type:"post",
      dataType : "json",
      data     : JSON.stringify({
        year  : this.props.date.getFullYear(),
        month : this.props.date.getMonth() + 1,
        day   : this.props.date.getDate(),
      })
    }).then((data) => {

      const CustomerMap = new Map();
      for (let Customer of data["customers"]) {
        CustomerMap.set(Customer.ID, {
          username : Customer.UserName,
          ID       : Customer.ID,
          overhead : Customer.overhead,
          productions : []
        });
      }

      this.InsertProductions(CustomerMap, data["productions"])


      // These are the attual productions runs
      const RunMap = new Map();
      for (let Run of data["Runs"]) {
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

      const newOrders = this.InsertOrders(CustomerMap, data["Orders"])      

      const newState = {
        ...this.state,
        runs   : RunMap,
        orders : newOrders,
        customer : CustomerMap
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
      url:"api/getFDGOrders",
      type:"post",
      dataType : "json",
      data : JSON.stringify({
        year : newDate.getFullYear(),
        month : newDate.getMonth() + 1,
        day : newDate.getDate(),
      })
    }).then((data) => {
      var newCustomerMap = new Map(this.state.customer);
      for(var [BID, Customer] of newCustomerMap.entries()){
        var Customer = {...Customer};
        Customer.productions = [];
        newCustomerMap.set(BID, Customer);
      }
      newCustomerMap  = this.InsertProductions(newCustomerMap, data["productions"]);
      const newOrders = this.InsertOrders(newCustomerMap, data["Orders"]);

      this.SetOrdersCustomers(newOrders, newCustomerMap);
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
        contribution : 0
      });
      Customer.productions.sort((p1, p2) => (p1.run > p2.run) ? 1 : -1);
    }
    return CustomerMap;
  }

  InsertOrders(CustomerMap, Orders) {
    const newOrders = new Map();
    for (const Order of Orders) {
      newOrders.set(Order.oid, Order);
      const Customer    = CustomerMap.get(Order.BID);
      const Production = Customer.productions[Order.run - 1];
      if (Production === undefined) continue;
      Production.orders.push(Order);
    }
    return newOrders
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
    return String(this.props.date.getFullYear()) + '-' +
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

    this.websocket.send(JSON.stringify({
      "date"         : this.props.date,
      "oid"          : oid,
      "messageType"  : "AcceptOrder"
    }));
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
      
      const UpdatedOrders = this.updateAmountForCustomer(Customer.ID);

      this.websocket.send(JSON.stringify({
        "date" : this.props.date,
        "messageType" : "ChangeRun",
        "UpdatedOrders" : UpdatedOrders
      }));
    } else {
      //TODO: Post Error as you cannot deliver this.
      throw "This should not happen, you need to update your rendering"
    }
  }

  ChangeRunIncoming(newDate, UpdatedOrders){
    if(this.ShouldOrdersUpdate(newDate)){
      for(const Order of UpdatedOrders){
        this.SetOrder(Order);
      }
    }
  }

  updateAmountForCustomer(ID){
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
        //Create a new order
      } else if (MasterOrder === null && ServantOrders.length === 0) {
        
      } else {
        MasterOrder.total_amount = MasterOrder.amount;
        MasterOrder.COID = -1;
        for (const SOrder of ServantOrders) {
          const MinDiff = CountMinutes(
            ProductionDateTime, 
            new Date(SOrder.deliver_datetime)
          );
          
          const OrderContribution = CalculateProduction("FDG", MinDiff, SOrder.amount);
          //Updating Orders
          MasterOrder.total_amount += OrderContribution;
          SOrder.total_amount = 0;
          SOrder.total_amount_o = 0;
          SOrder.COID = MasterOrder.oid;
          //We can update the order now, because we are not touching it later in the function
          NewOrders.set(SOrder.oid, SOrder);
          ChangedOrders.push(SOrder);
        }
        MasterOrder.total_amount_o = MasterOrder.total_amount * (1 + Customer.overhead/100)
        Production.contribution = MasterOrder.total_amount_o;
        NewOrders.set(MasterOrder.oid, MasterOrder);
        ChangedOrders.push(MasterOrder);
      }
      Customer.productions[ProductionI] = Production;
    }
    const NewCustomerMap = new Map(this.state.customer);
    NewCustomerMap.set(Customer.ID, Customer);
    this.SetOrdersCustomers(NewOrders, NewCustomerMap);

    return ChangedOrders
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
    if (Order.status == 1) return (<td><Button variant="light" onClick={() => this.AcceptOrder(Order.oid)}><img className="statusIcon" src="/static/images/accept.svg"></img></Button></td>);
    if (Order.status == 2) return (<td><Button variant="light" onClick={() => {}}><img className="statusIcon" src="/static/images/accept.svg"></img></Button></td>);
    if (Order.status == 3) return (<td></td>);
  }

  renderRun(Order){
    if (Order.status === 1) return ""
    if (Order.status === 2) return this.renderRunSelect(Order)
    if (Order.status === 3) return String(Order.run)

  }


  renderOrder(Order) {
    const OrderDT   = new Date(Order.deliver_datetime) 
    const OrderTime = FormatDateStr(OrderDT.getHours()) + ":" + FormatDateStr(OrderDT.getMinutes())
    const Run       = this.renderRun(Order); 
    
    const customer = this.state.customer.get(Order.BID)
    const CustomerName = (customer !== undefined) ? customer.username : Order.BID;
    const TotalAmount  = (Order.COID === -1) ? Order.total_amount : "Flyttet til:" + Order.COID;
    const TotalAmountO = (Order.COID === -1) ? Order.total_amount_o : "";

    return (
    <tr key={Order.oid}> 
      <td>{renderStatusImage(Order.status)}</td>
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

  render() {
    const orders = [];
    for (const [oid, order] of this.state.orders.entries()){
      orders.push(this.renderOrder(order))
    }

    return (
      <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Kunde</th>
            <th>Bestilt</th>
            <th>Total Bestilling</th>
            <th>Med Overhead</th>
            <th>tid</th>
            <th>Kørsel</th>
            <th>Accept</th>
            <th>Afvis</th>
          </tr>
        </thead>
        <tbody>
          {orders}
        </tbody>
      </Table>
    );
  }
}