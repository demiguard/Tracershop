import React, { Component } from "react";
import { Container} from "react-bootstrap";
import Cookies from "js-cookie";
import { ajaxSetup } from "jquery";

import { Navbar } from "./injectable/navbar.js";
import { Authenticate } from "./injectable/authenticate.js";
import { ErrorPage } from "./error_pages/error_page.js";
import InvalidVersionPage from "./error_pages/invalid_version_page.js"

import { db } from "../lib/local_storage_driver.js";
import { TracerWebSocket } from "../lib/tracer_websocket.js";
import { ParseDjangoModelJson, ParseJSONstr } from "../lib/formatting.js";
import {JSON_ADDRESS, JSON_CUSTOMER, JSON_ACTIVITY_ORDER, JSON_DATABASE, JSON_DELIVER_TIME,
        JSON_EMPLOYEE, JSON_ISOTOPE, JSON_RUN, JSON_SERVER_CONFIG, JSON_TRACER,
        JSON_INJECTION_ORDER, JSON_VIAL, WEBSOCKET_MESSAGE_GREAT_STATE, DATABASE_ACTIVITY_ORDER, DATABASE_ADDRESS, DATABASE_CUSTOMER, DATABASE_DATABASE,
        DATABASE_DELIVER_TIME, DATABASE_EMPLOYEE, DATABASE_INJECTION_ORDER, DATABASE_ISOTOPE,
        DATABASE_IS_AUTH, DATABASE_PRODUCTION, KEYWORD_USERGROUP, USER_GROUPS, WEBSOCKET_MESSAGE_AUTH_LOGIN,
        DATABASE_TRACER, DATABASE_SERVER_CONFIG, DATABASE_VIAL, WEBSOCKET_MESSAGE_AUTH_LOGOUT, WEBSOCKET_MESSAGE_AUTH_WHOAMI,
        AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, JSON_AUTH, KEYWORD_CUSTOMER, WEBSOCKET_SESSION_ID, DATABASE_USER,
        DATABASE_TRACER_MAPPING, JSON_TRACER_MAPPING, KEYWORD_CUSTOMER_ID, KEYWORD_TRACER_ID, ERROR_INVALID_JAVASCRIPT_VERSION, ERROR_INSUFFICIENT_PERMISSIONS, DATABASE_CLOSED_DATE, JSON_CLOSED_DATE, PROP_USER, PROP_WEBSOCKET, PROP_NAVBAR_ELEMENTS, PROP_LOGOUT, PROP_SET_USER
      } from "../lib/constants.js";
import { AdminSite } from "./sites/admin_site.js";
import { ProductionSite } from "./sites/production_site.js";
import { ShopSite } from "./sites/shop_site.js";
import { User } from "../dataclasses/user.js";
import { TracerShop } from "./sites/tracer_shop.js";

export { App }

export default class App extends Component {
  constructor(props) {
    super(props);
    // Init old state

    const address  = this.getDatabaseMap(DATABASE_ADDRESS);
    const closed_date = this.getDatabaseMap(DATABASE_CLOSED_DATE);
    const customer = this.getDatabaseMap(DATABASE_CUSTOMER);
    const databases = this.getDatabaseMap(DATABASE_DATABASE);
    const deliverTimes = this.getDatabaseMap(DATABASE_DELIVER_TIME);
    const employees = this.getDatabaseMap(DATABASE_EMPLOYEE);
    const isotopes = this.getDatabaseMap(DATABASE_ISOTOPE);
    const orders = this.getDatabaseMap(DATABASE_ACTIVITY_ORDER);
    const runs = this.getDatabaseMap(DATABASE_PRODUCTION);
    const t_orders = this.getDatabaseMap(DATABASE_INJECTION_ORDER);
    const tracers = this.getDatabaseMap(DATABASE_TRACER);
    const tracerMapping = this.getDatabaseMap(DATABASE_TRACER_MAPPING);
    const ServerConfig = this.getDatabaseObject(DATABASE_SERVER_CONFIG);
    let user = this.getDatabaseObject(DATABASE_USER)
    const vials = this.getDatabaseMap(DATABASE_VIAL);


    if(user && !(user instanceof User)){
      user = new User(user.username, user.user_group, user.customer);
    } else {
      user = new User();
    }

    const state = {
      login_error : "",
      site_error : "",
      site_error_info : "",
      spinner : false,
    };
    state[DATABASE_ADDRESS] = address;
    state[DATABASE_CLOSED_DATE] = closed_date;
    state[DATABASE_CUSTOMER] = customer;
    state[DATABASE_DATABASE] = databases;
    state[DATABASE_DELIVER_TIME] = deliverTimes;
    state[DATABASE_EMPLOYEE] = employees;
    state[DATABASE_ISOTOPE] = isotopes;
    state[DATABASE_ACTIVITY_ORDER] = orders;
    state[DATABASE_PRODUCTION] = runs;
    state[DATABASE_INJECTION_ORDER] = t_orders;
    state[DATABASE_TRACER] = tracers;
    state[DATABASE_TRACER_MAPPING] = tracerMapping;
    state[DATABASE_SERVER_CONFIG] = ServerConfig;
    state[DATABASE_VIAL] = vials;
    state[DATABASE_USER] = user

    this.state = state;
    this.MasterSocket = new TracerWebSocket(
      new WebSocket("ws://" + window.location.host + "/ws/"), this);
    if (user) {
      // If we know, that the client is not logged in,
      // Getting the great state will not be authorized
      this.MasterSocket.send(
        this.MasterSocket.getMessage(WEBSOCKET_MESSAGE_GREAT_STATE));
    }
    // While this is not needed, it's nice if the client start to use Ajax query again
    ajaxSetup({
      headers: {
        "X-CSRFToken": Cookies.get("csrftoken")
      }
    });
  }


  logout(){
    const message = this.MasterSocket.getMessage(WEBSOCKET_MESSAGE_AUTH_LOGOUT);
    this.MasterSocket.send(message).then((data) => {
      this.set_user(new User());
    })
  }

  whoami(){
    const message = this.MasterSocket.getMessage(WEBSOCKET_MESSAGE_AUTH_WHOAMI)
    this.MasterSocket.send(message).then((data) => {
      let user;
      if (data[AUTH_IS_AUTHENTICATED]){
        user = new User(data[AUTH_USERNAME],
                        data[KEYWORD_USERGROUP],
                        data[KEYWORD_CUSTOMER],
        )
      } else {
        user = new User();
      }
      this.set_user(user)
    })
  }

  componentDidCatch(Error, errorInfo){
    this.setState({...this.state,
      site_error : Error,
      site_error_info : errorInfo,
    })
  }

  getDatabaseMap(databaseField){
    var dbmap = db.get(databaseField);
    if(!dbmap){
      return new Map();
    }
    return dbmap;
  }

  getDatabaseObject(databaseField){
    var dbObject = db.get(databaseField)
    if (!dbObject) return undefined
    return dbObject
  }

  setError(errorObject){
    this.setState({
      ...this.state, ...errorObject,
    })
  }

  /********* Websocket Methods *********/
  // These methods are invoked by the websocket
  updateGreatState(greatState){
    /* Note there's a good reason why the great state is multiple
     * Maps instead of an object with those maps.
     * The reason is to if a single map would be update, then to keep the
     * react model happy, one would have to recreate the object,
     * which is annoying, since most of the maps are (mostly) static
     */
    const closeddates = new Map();
    for(const closeddateStr of greatState[JSON_CLOSED_DATE]){
      const closeddate = ParseJSONstr(closeddateStr);
      closeddates.set(closeddate.BDID, closeddate);
    }
    db.set(DATABASE_CLOSED_DATE, closeddates)

    const customers = new Map();
    for(const customerStr of greatState[JSON_CUSTOMER]){
      const customer = ParseJSONstr(customerStr);
      customers.set(customer.ID, customer);
    }
    db.set(DATABASE_CUSTOMER, customers);
    //DeliverTimes
    const deliverTimes = new Map();
    for(const deliverTimeStr of greatState[JSON_DELIVER_TIME]){
      const deliverTime = ParseJSONstr(deliverTimeStr);
      deliverTimes.set(deliverTime.DTID, deliverTime);
    }
    db.set(DATABASE_DELIVER_TIME, deliverTimes);
    //Employees
    const employees = new Map();
    for(const employeeStr of greatState[JSON_EMPLOYEE]){
      const employee = ParseJSONstr(employeeStr);
      employees.set(employee.Id, employee);
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
    //Tracer Mapping
    const TracerMapping = new Map();

    for(const TracerMappingStr of greatState[JSON_TRACER_MAPPING]){
      const TracerMappingTuple = ParseJSONstr(TracerMappingStr)
      TracerMapping.set(TracerMappingTuple.ID, TracerMappingTuple)
    }
    db.set(DATABASE_TRACER_MAPPING, TracerMapping)

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
    state[DATABASE_ADDRESS] = Addresses;
    state[DATABASE_CLOSED_DATE] = closeddates;
    state[DATABASE_CUSTOMER] = customers;
    state[DATABASE_DATABASE] = Databases;
    state[DATABASE_DELIVER_TIME] = deliverTimes;
    state[DATABASE_EMPLOYEE] = employees;
    state[DATABASE_ISOTOPE] = isotopes;
    state[DATABASE_ACTIVITY_ORDER] = orders;
    state[DATABASE_PRODUCTION] = runs;
    state[DATABASE_INJECTION_ORDER] = t_orders;
    state[DATABASE_TRACER] = Tracers;
    state[DATABASE_TRACER_MAPPING] = TracerMapping;
    state[DATABASE_SERVER_CONFIG] = ServerConfig;
    state[DATABASE_VIAL] = Vials;

    this.setState(state);
  }

  UpdateMap(mapName, arrayNewObject, IDkey, KeepOld, DeleteKeys){
    const NewStateMap = (KeepOld) ? new Map(this.state[mapName]) : new Map();

    if(arrayNewObject) for(const obj of arrayNewObject){
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

  /**
   * 
   * @param {Array<string>} mapNames
   * @param {Array<Array<Object>>} mapsArrays 
   * @param {Array<string>} IDs 
   * @param {Array<boolean>} keepOlds 
   * @param {Array<Array<Number>>} deleteKeys 
   */
  UpdateMaps(mapNames, mapsArrays, IDs, keepOlds, deleteKeys){
    const newState = {...this.state};
    for(const mapIdx in mapNames){
      const mapName = mapNames[mapIdx];
      const ID = IDs[mapIdx];
      const keepOld = keepOlds[mapIdx];
      const objects = mapsArrays[mapIdx];
      const toBeDeleted = deleteKeys[mapIdx];

      const newStateMap = (keepOld) ? new Map(this.state[mapName]) : new Map();

      if(objects) for(const obj of objects){
        newStateMap.set(obj[ID], obj);
      }

      if(toBeDeleted) for(const deleteID of toBeDeleted){
        newStateMap.delete(deleteID);
      }
      newState[mapName] = newStateMap;
      db.set(mapName, newStateMap);
    }
    this.setState(newState);
  }

  set_user(user) {
    if(!user instanceof User){
      user = new User(user.username, user.user_group, user.customer);
    }
    if(user.user_group == USER_GROUPS.ANON){
      db.delete(DATABASE_USER);
    } else {
      db.set(DATABASE_USER, user);
    }

    this.setState({...this.state, user : user});
  }

  componentDidMount() {
    this.whoami();
  }

  render() {
    const props = {};

    props[JSON_ADDRESS] = this.state[JSON_ADDRESS];
    props[JSON_DATABASE] = this.state[JSON_DATABASE];
    props[JSON_CLOSED_DATE] = this.state[JSON_CLOSED_DATE];
    props[JSON_CUSTOMER] = this.state[JSON_CUSTOMER];
    props[JSON_DELIVER_TIME] = this.state[JSON_DELIVER_TIME];
    props[JSON_EMPLOYEE] = this.state[JSON_EMPLOYEE];
    props[JSON_ISOTOPE] = this.state[JSON_ISOTOPE];
    props[PROP_LOGOUT] = this.logout.bind(this);
    props[PROP_NAVBAR_ELEMENTS] = [];
    props[JSON_ACTIVITY_ORDER] = this.state[JSON_ACTIVITY_ORDER];
    props[JSON_RUN] = this.state[JSON_RUN];
    props[JSON_INJECTION_ORDER] = this.state[JSON_INJECTION_ORDER];
    props[JSON_TRACER] = this.state[JSON_TRACER];
    props[JSON_TRACER_MAPPING] = this.state[JSON_TRACER_MAPPING];
    props[JSON_SERVER_CONFIG] = this.state[JSON_SERVER_CONFIG];
    props[JSON_VIAL] = this.state[JSON_VIAL];
    props[PROP_SET_USER] = this.set_user.bind(this);
    props[PROP_USER] = this.state[PROP_USER]
    props[PROP_WEBSOCKET] = this.MasterSocket;

    return (<TracerShop
      {...props}
      />);
    }
  }
