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
      const newCustomerMap = new Map(this.state.customer);
      for(const Customer of newCustomerMap.entries()){
        Customer.productions = [];
      }
      this.InsertProductions(newCustomerMap, data["productions"]);
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
        run    : Production.run
      });
      Customer.productions.sort((p1, p2) => (p1.run > p2.run) ? 1 : -1);
    }
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


  // State Changing Functions 
  // Accepting Order Functions AKA An order Going from Status 1 to Status 2
  AcceptOrder(oid) {
    const Order = this.state.orders.get(Order.oid);
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
    Order        = {...Order};
    const NewOrders    = new Map(this.state.orders);
    const NewCustomers = new Map(this.state.customer);
    // Set New object in Customer Map
    const Customer     = NewCustomers.get(Order.BID);
    const Produtions   = Customer.productions[Order.run - 1];
    const pOrders       = Produtions.orders;
    var oldOrderI;
    for(let pOrderI in pOrders) {
      const pOrder = pOrders[pOrderI];
      if (pOrder.oid === Order.oid) {
        oldOrderI = pOrderI;
        break
      }
    }
    pOrders[oldOrderI] = Order
    // Set new object
    NewOrders.set(Order.oid, Order);
    this.SetOrdersCustomers(NewOrders, NewCustomers);
    
  }


  // Change the Run value of a Order:
  ChangeRun(newRun, oid) {
    const Order = {...this.state.orders.get(oid)};
    const Customer = this.state.customer.get(Order.BID);
    const NewProduction = Customer.productions[newRun - 1];
    
    const ProductionDateTimeString =
      String(this.props.date.getFullYear()) + '-' +
      FormatDateStr(this.props.date.getMonth() + 1) + '-' +
      FormatDateStr(this.props.date.getDate()) + "T" +  
      NewProduction.dtime;

    const NewProductionDT = new Date(ProductionDateTimeString);
    const OrderTime       = new Date(Order.deliver_datetime);


    console.log(NewProductionDT)
    console.log(OrderTime)

    if (NewProductionDT <= OrderTime) {
      console.log("Nooo Problem");
      Order.run = newRun;
      this.SetOrder(Order);
      this.updateAmountForCustomer(Customer.BID);
    } else {
      console.log("Biiig problem");
      //TODO: Post Error as you cannot deliver this.
      throw "This should not happen, you need to update your rendering"
    }


    
  }

  updateAmountForCustomer(BID){
    //This function calculates 
  }



  renderRun(Run) {
    return (<option value={Run.run} key={Run.run}>{Run.run}</option>)
  }

  // Renders 
  renderRunSelect(init, oid) {
    
    const Day  = this.props.date.getDay();
    const Runs = this.state.runs.get(Day);
    
    const options = [];
    for (const Run of Runs) {
      options.push(this.renderRun(Run));
    }

    return (
      <select 
        defaultValue={init}
        onChange={(event) => this.ChangeRun(Number(event.target.value), oid)}
      >
        {options}
      </select>
    )
  }

  renderAcceptButtons(status,oid) {
    if (status == 1) return (<td><Button variant="light" onClick={() => this.AcceptOrder(oid)}><img className="statusIcon" src="/static/images/accept.svg"></img></Button></td>)
    if (status == 2) return (<td><Button variant="light" onClick={() => {}}><img className="statusIcon" src="/static/images/accept.svg"></img></Button></td>)
    if (status == 3) return (<td></td>)
  }


  renderOrder(Order) {
    const OrderDT   = new Date(Order.deliver_datetime) 
    const OrderTime = FormatDateStr(OrderDT.getHours()) + ":" + FormatDateStr(OrderDT.getMinutes())
    var Run;
    if (Order.status === 1) Run = ""
    if (Order.status === 2) Run = this.renderRunSelect(Order.run, Order.oid)
    if (Order.status === 3) Run = String(Order.run)

    const customer = this.state.customer.get(Order.BID)
    var Kunde;
    (customer !== undefined) ? Kunde = customer.username : Kunde = Order.BID

    return (
    <tr key={Order.oid}> 
      <td>{renderStatusImage(Order.status)}</td>
      <td>{Order.oid}</td>
      <td>{Kunde}</td>
      <td>{Order.amount}</td>
      <td>{Order.total_amount}</td>
      <td>{OrderTime}</td>
      <td>{Run}</td>
      {this.renderAcceptButtons(Order.status,Order.oid)}
      <td><Button variant="light"><img className="statusIcon" src="/static/images/decline.svg"></img></Button></td>
    </tr>)
  }

  render() {
    const orders = [];
    for (const [oid, order] of this.state.orders.entries()){
      orders.push(this.renderOrder(order))
    }

    console.log(this.state)

    return (
      <Table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Order ID</th>
            <th>Kunde</th>
            <th>Bestilt</th>
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