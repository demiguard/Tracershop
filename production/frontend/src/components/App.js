import React, { Component } from "react";
import {Button, Container} from "react-bootstrap";

import { getSession, handlePasswordChange, handleUserNameChange, isResponseOk, login_auth, login, logout } from "/src/lib/authentication.js"
import { Navbar } from "/src/components/injectables/Navbar.js";
import { ConfigPage } from "/src/components/pages/ConfigPage.js";
import { OrderPage } from '/src/components/pages/OrderPage.js';
import { CustomerPage } from "/src/components/pages/CustomerPage.js";
import { EmailSetupPage } from "/src/components/pages/EmailSetupPage.js";
import { ServerConfigPage } from "/src/components/pages/ServerConfig.js";
import { Authenticate } from "/src/components/injectables/Authenticate.js";
import { ajaxSetup } from "jquery";
import { get as getCookie } from 'js-cookie';
import { CloseDaysPage } from "/src/components/pages/CloseDaysPage";
import { VialPage } from "/src/components/pages/VialPage.js";
import { db } from "/src/lib/localStorageDriver.js";
import { TracerWebSocket, safeSend } from "/src/lib/TracerWebsocket.js";
import {JSON_ADDRESS, JSON_CUSTOMER,JSON_INJECTION_ORDERS, JSON_ACTIVITY_ORDER, JSON_DATABASE, JSON_DELIVERTIMES,
        JSON_EMPLOYEES, JSON_ISOTOPE, JSON_ORDERS, JSON_RUNS, JSON_SERVER_CONFIG, JSON_TRACER,
        JSON_T_ORDERS, JSON_VIALS, WEBSOCKET_MESSAGE_GREAT_STATE } from "/src/lib/constants.js";
import { ParseDjangoModelJson, ParseJSONstr } from "/src/lib/formatting.js";

export {App}

const Pages = {
  Ordre : OrderPage,
  Kunder : CustomerPage,
  Tracers : ConfigPage,
  Email : EmailSetupPage,
  Lukkedage : CloseDaysPage,
  Vial : VialPage,
  Indstillinger : ServerConfigPage,
}

export default class App extends Component {
  constructor(props) {
    super(props);
    // Init old state
    var isAuth = db.get("isAuth") ? true : false;

    const address  = this.getDatabaseMap("addresses");
    const customer = this.getDatabaseMap("customer");
    const databases = this.getDatabaseMap("databases");
    const deliverTimes = this.getDatabaseMap("deliverTimes");
    const employees = this.getDatabaseMap("employees");
    const isotopes  = this.getDatabaseMap("isotopes");
    const orders    = this.getDatabaseMap("orders");
    const runs      = this.getDatabaseMap("runs");
    const t_orders  = this.getDatabaseMap("t_orders");
    const tracers   = this.getDatabaseMap("tracers");
    var ServerConfig = db.get("serverConfig");
    if(!ServerConfig){
      ServerConfig = undefined;
    }

    const vials     = this.getDatabaseMap("vials");

    this.state = {
      activePage : OrderPage,
      isAuthenticated : isAuth,
      username        : "",
      password        : "",
      error           : "",
      address         : address,
      customer        : customer,
      database        : databases,
      deliverTimes    : deliverTimes,
      employees       : employees,
      isotopes        : isotopes,
      orders          : orders,
      runs            : runs,
      t_orders        : t_orders,
      tracers         : tracers,
      vials           : vials,
      serverConfig    : ServerConfig,

    };
    this.MasterSocket = new TracerWebSocket("ws://" + window.location.host + "/ws/", this);
    const Message = this.MasterSocket.getMessage(WEBSOCKET_MESSAGE_GREAT_STATE);
    const updateMessage = new Promise(() => {safeSend(Message, this.MasterSocket)});

    this.setActivePage = this.setActivePage.bind(this);

    /**** AUTHENTICATION METHODS ****/
    this.getSession = getSession.bind(this);
    this.handlePasswordChange = handlePasswordChange.bind(this);
    this.handleUserNameChange = handleUserNameChange.bind(this);
    this.isResponseOk = isResponseOk.bind(this);
    this.login_auth = login_auth.bind(this);
    this.login = login.bind(this);
    this.logout = logout.bind(this);

    ajaxSetup({
      headers: {
        "X-CSRFToken": getCookie("csrftoken")
      }
    });
  }

  getDatabaseMap(databaseField){
    var dbmap = db.get(databaseField);
    if(!dbmap){
      return new Map();
    }
    return dbmap;
  }

  /********* Websocket Methods *********/
  // These methods are called by the websocket to invoke a state change

  updateGreatState(greatState){
    /*
     *
     */
    //Customers
    const customers = new Map();
    for(const customerStr of greatState[JSON_CUSTOMER]){
      const customer = ParseJSONstr(customerStr);
      customers.set(customer.ID, customer);
    }
    db.set(JSON_CUSTOMER, customers);
    //DeliverTimes
    const deliverTimes = new Map();
    for(const deliverTimeStr of greatState[JSON_DELIVERTIMES]){
      const deliverTime = ParseJSONstr(deliverTimeStr);
      deliverTimes.set(deliverTime.DTID, deliverTime);
    }
    db.set(JSON_DELIVERTIMES, deliverTimes);
    //Employees
    const employees = new Map();
    for(const employeeStr of greatState[JSON_EMPLOYEES]){
      const employee = ParseJSONstr(employeeStr);
      employees.set(employee.OldTracerBaseID, employee);
    }
    db.set("employees", employees);
    //Isotopes
    const isotopes = new Map();
    for(const isotopeStr of greatState[JSON_ISOTOPE]){
      const isotope = ParseJSONstr(isotopeStr);
      isotopes.set(isotope.ID, isotope);
    }
    db.set("isotopes", isotopes);
    //Orders
    const orders = new Map();
    for(const orderStr of greatState[JSON_ACTIVITY_ORDER]){
      const order = ParseJSONstr(orderStr);
      orders.set(order.oid, order);
    }
    db.set("orders", orders);
    //Runs
    const runs = new Map();
    for(const runStr of greatState[JSON_RUNS]){
      const run = ParseJSONstr(runStr);
      runs.set(run.PTID, run);
    }
    db.set("runs", runs);
    //T_Orders
    const t_orders = new Map();
    for(const t_orderStr of greatState[JSON_INJECTION_ORDERS]){
      const t_order = ParseJSONstr(t_orderStr);
      orders.set(t_order.oid, t_order);
    }
    db.set("t_orders", t_orders);
    //Tracers
    const Tracers = new Map();
    for(const TracerStr of greatState[JSON_TRACER]){
      const Tracer = ParseJSONstr(TracerStr);
      Tracers.set(Tracer.id, Tracer);
    }
    db.set("tracers", Tracers);
    //Vials
    const Vials = new Map();
    for(const VialStr of greatState[JSON_VIALS]){
      const Vial = ParseJSONstr(VialStr);
      Vials.set(Vial.ID, Vial);
    }
    db.set("vials", Vials);

    const Addresses = ParseDjangoModelJson(greatState[JSON_ADDRESS]);
    db.set("addresses", Addresses);
    const Databases = ParseDjangoModelJson(greatState[JSON_DATABASE]);
    db.set("databases", Databases);
    const ServerConfigMap = ParseDjangoModelJson(greatState[JSON_SERVER_CONFIG]);
    const ServerConfig = ServerConfigMap.get(1);
    db.set("serverConfig", ServerConfig)

    this.setState({
      ...this.state,
      address         : Addresses,
      customer        : customers,
      database        : Databases,
      deliverTimes    : deliverTimes,
      employees       : employees,
      isotopes        : isotopes,
      orders          : orders,
      runs            : runs,
      t_orders        : t_orders,
      tracers         : Tracers,
      serverConfig    : ServerConfig,
      vials           : Vials,
    })
  }

  UpdateMap(mapName, ArrayNewObejct, IDkey, KeepOld, DeleteKeys){
    const NewStateMap = (KeepOld) ? new Map(this.state[mapName]) : new Map();

    if(ArrayNewObejct) for(const obj of ArrayNewObejct){
      NewStateMap.set(obj[IDkey], obj);
    }
    if(DeleteKeys) for(const id_to_delete of DeleteKeys){
      NewStateMap.delete(id_to_delete);
    }

    const newState = {...this.state}; // This Creates a new object
    newState[mapName] = NewStateMap;
    this.setState(newState); // Trigger Rerendering
    db.set(mapName, NewStateMap);
  }

  componentDidMount() {
    this.getSession();
  }

  setActivePage(NewPageName) {
    const NewPage = Pages[NewPageName];
    const NewState = {...this.state, activePage : NewPage};
    this.setState(NewState);
  }

  render() {
    if (this.state.isAuthenticated){ // User is logged in
      return (
        <div>
        <Navbar
          Names={Object.keys(Pages)}
          setActivePage={this.setActivePage}
          username={this.state.username}
          logout={this.logout}
          isAuthenticated={this.state.isAuthenticated}/>
        <Container className="navBarSpacer">
          <this.state.activePage
            username={this.state.username}
            address={this.state.address}
            customer={this.state.customer}
            database={this.state.database}
            deliverTimes={this.state.deliverTimes}
            employees={this.state.employees}
            isotopes={this.state.isotopes}
            orders={this.state.orders}
            runs={this.state.runs}
            t_orders={this.state.t_orders}
            tracers={this.state.tracers}
            serverConfig={this.state.serverConfig}
            vials={this.state.vials}
            websocket={this.MasterSocket}
          />
        </Container>
      </div>
    );
    } else {
      return (
        <div>
          <Navbar Names={[]} setActivePage={() => {}} username={this.state.username} logout={this.logout}/>
          <Container className="navBarSpacer">
            <Authenticate
              login_message="Log in"
              authenticate={this.login_auth.bind(this)}
              ErrorMessage={this.state.error}
              fit_in={true}
            />
          </Container>
        </div>
      )
    }
  }
}


