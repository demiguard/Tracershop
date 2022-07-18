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
import { TracerWebSocket } from "/src/lib/TracerWebsocket.js";
import { ParseDjangoModelJson, ParseJSONstr } from "/src/lib/formatting.js";
import {JSON_ADDRESS, JSON_CUSTOMER, JSON_ACTIVITY_ORDER, JSON_DATABASE, JSON_DELIVERTIME,
        JSON_EMPLOYEE, JSON_ISOTOPE, JSON_RUN, JSON_SERVER_CONFIG, JSON_TRACER,
        JSON_INJECTION_ORDER, JSON_VIAL, WEBSOCKET_MESSAGE_GREAT_STATE, DATABASE_ACTIVITY_ORDER, DATABASE_ADDRESS, DATABASE_CUSTOMER, DATABASE_DATABASE,
        DATABASE_DELIVER_TIME, DATABASE_EMPLOYEE, DATABASE_INJECTION_ORDER, DATABASE_ISOTOPE,
        DATABASE_IS_AUTH, DATABASE_PRODUCTION,
        DATABASE_TRACER, DATABASE_SERVER_CONFIG, DATABASE_VIAL } from "/src/lib/constants.js";


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
    var isAuth = db.get(DATABASE_IS_AUTH) ? true : false;
    const address  = this.getDatabaseMap(DATABASE_ADDRESS);
    const customer = this.getDatabaseMap(DATABASE_CUSTOMER);
    const databases = this.getDatabaseMap(DATABASE_DATABASE);
    const deliverTimes = this.getDatabaseMap(DATABASE_DELIVER_TIME);
    const employees = this.getDatabaseMap(DATABASE_EMPLOYEE);
    const isotopes  = this.getDatabaseMap(DATABASE_ISOTOPE);
    const orders    = this.getDatabaseMap(DATABASE_ACTIVITY_ORDER);
    const runs      = this.getDatabaseMap(DATABASE_PRODUCTION);
    const t_orders  = this.getDatabaseMap(DATABASE_INJECTION_ORDER);
    const tracers   = this.getDatabaseMap(DATABASE_TRACER);
    var ServerConfig = db.get(DATABASE_SERVER_CONFIG);
    if(!ServerConfig){
      ServerConfig = undefined;
    }
    const vials     = this.getDatabaseMap(DATABASE_VIAL);

    const state = {
      activePage : OrderPage,
      username        : "",
      password        : "",
      error           : "",
    };
    state[DATABASE_IS_AUTH] = isAuth,
    state[DATABASE_ADDRESS] = address,
    state[DATABASE_CUSTOMER] = customer,
    state[DATABASE_DATABASE] = databases,
    state[DATABASE_DELIVER_TIME] = deliverTimes,
    state[DATABASE_EMPLOYEE] = employees,
    state[DATABASE_ISOTOPE] = isotopes,
    state[DATABASE_ACTIVITY_ORDER] = orders,
    state[DATABASE_PRODUCTION] = runs,
    state[DATABASE_INJECTION_ORDER] = t_orders,
    state[DATABASE_TRACER] = tracers,
    state[DATABASE_SERVER_CONFIG] = ServerConfig,
    state[DATABASE_VIAL] = vials,

    this.state = state;
    this.MasterSocket = new TracerWebSocket("ws://" + window.location.host + "/ws/", this);
    this.MasterSocket.send(
      this.MasterSocket.getMessage(
        WEBSOCKET_MESSAGE_GREAT_STATE
      )
    );

    this.setActivePage = this.setActivePage.bind(this);

    /**** AUTHENTICATION METHODS ****/
    this.getSession = getSession.bind(this);
    //this.handlePasswordChange = handlePasswordChange.bind(this);
    //this.handleUserNameChange = handleUserNameChange.bind(this);
    this.isResponseOk = isResponseOk.bind(this);
    this.login_auth = login_auth.bind(this);
    //this.login = login.bind(this);
    this.logout = logout.bind(this);

    ajaxSetup({
      headers: {
        "X-CSRFToken": getCookie("csrftoken")
      }
    });
    this.getSession();
  }

  getDatabaseMap(databaseField){
    var dbmap = db.get(databaseField);
    if(!dbmap){
      return new Map();
    }
    return dbmap;
  }

  /********* Websocket Methods *********/
  // These methods are invoked by the websocket
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
    db.set(DATABASE_CUSTOMER, customers);
    //DeliverTimes
    const deliverTimes = new Map();
    for(const deliverTimeStr of greatState[JSON_DELIVERTIME]){
      const deliverTime = ParseJSONstr(deliverTimeStr);
      deliverTimes.set(deliverTime.DTID, deliverTime);
    }
    db.set(DATABASE_DELIVER_TIME, deliverTimes);
    //Employees
    const employees = new Map();
    for(const employeeStr of greatState[JSON_EMPLOYEE]){
      const employee = ParseJSONstr(employeeStr);
      employees.set(employee.OldTracerBaseID, employee);
    }
    db.set(DATABASE_EMPLOYEE, employees);
    //Isotopes
    const isotopes = new Map();
    for(const isotopeStr of greatState[JSON_ISOTOPE]){
      const isotope = ParseJSONstr(isotopeStr);
      isotopes.set(isotope.ID, isotope);
    }
    db.set(DATABASE_ISOTOPE, isotopes);
    //Orders
    const orders = new Map();
    for(const orderStr of greatState[JSON_ACTIVITY_ORDER]){
      const order = ParseJSONstr(orderStr);
      orders.set(order.oid, order);
    }
    db.set(DATABASE_ACTIVITY_ORDER, orders);
    //Runs
    const runs = new Map();
    for(const runStr of greatState[JSON_RUN]){
      const run = ParseJSONstr(runStr);
      runs.set(run.PTID, run);
    }
    db.set(DATABASE_PRODUCTION, runs);
    //T_Orders
    const t_orders = new Map();
    for(const t_orderStr of greatState[JSON_INJECTION_ORDER]){
      const t_order = ParseJSONstr(t_orderStr);
      t_orders.set(t_order.oid, t_order);
    }
    db.set(DATABASE_INJECTION_ORDER, t_orders);
    //Tracers
    const Tracers = new Map();
    for(const TracerStr of greatState[JSON_TRACER]){
      const Tracer = ParseJSONstr(TracerStr);
      Tracers.set(Tracer.id, Tracer);
    }
    db.set(DATABASE_TRACER, Tracers);
    //Vials
    const Vials = new Map();
    for(const VialStr of greatState[JSON_VIAL]){
      const Vial = ParseJSONstr(VialStr);
      Vials.set(Vial.ID, Vial);
    }
    db.set(DATABASE_VIAL, Vials);

    const Addresses = ParseDjangoModelJson(greatState[JSON_ADDRESS]);
    db.set(DATABASE_ADDRESS, Addresses);
    const Databases = ParseDjangoModelJson(greatState[JSON_DATABASE]);
    db.set(DATABASE_DATABASE, Databases);
    const ServerConfigMap = ParseDjangoModelJson(greatState[JSON_SERVER_CONFIG]);
    const ServerConfig = ServerConfigMap.get(1);
    db.set(DATABASE_SERVER_CONFIG, ServerConfig)

    const state = {...this.state}
    // State Updates
    state[DATABASE_ADDRESS] = Addresses,
    state[DATABASE_CUSTOMER] = customers  ,
    state[DATABASE_DATABASE] = Databases,
    state[DATABASE_DELIVER_TIME] = deliverTimes,
    state[DATABASE_EMPLOYEE] = employees,
    state[DATABASE_ISOTOPE] = isotopes,
    state[DATABASE_ACTIVITY_ORDER] = orders,
    state[DATABASE_PRODUCTION] = runs,
    state[DATABASE_INJECTION_ORDER] = t_orders,
    state[DATABASE_TRACER] = Tracers,
    state[DATABASE_SERVER_CONFIG] = ServerConfig,
    state[DATABASE_VIAL] = Vials,

    this.setState(state);
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
    console.log(this.state)
    if (this.state[DATABASE_IS_AUTH]){ // User is logged in
      return (
        <div>
        <Navbar
          Names={Object.keys(Pages)}
          setActivePage={this.setActivePage}
          username={this.state.username}
          logout={this.logout}
          isAuthenticated={this.state[DATABASE_IS_AUTH]}/>
        <Container className="navBarSpacer">
          <this.state.activePage
            username={this.state.username}
            address={this.state.address}
            customer={this.state.customer}
            database={this.state.database}
            deliverTimes={this.state.deliverTimes}
            employee={this.state.employee}
            isotopes={this.state.isotopes}
            orders={this.state.orders}
            runs={this.state.run}
            t_orders={this.state.t_orders}
            tracers={this.state.tracer}
            serverConfig={this.state.serverConfig}
            vials={this.state.vial}
            websocket={this.MasterSocket}
          />
        </Container>
      </div>
    );
    } else {
      return (
        <div>
          <Navbar
            Names={[]}
            setActivePage={() => {}}
            username={this.state.username}
            isAuthenticated={this.state[DATABASE_IS_AUTH]}
            logout={this.logout}/>
          <Container className="navBarSpacer">
            <Authenticate
              login_message="Log in"
              authenticate={this.login_auth.bind(this)}
              ErrorMessage={this.state.error}
              fit_in={true}
              websocket={this.websocket}
            />
          </Container>
        </div>
      )
    }
  }
}


