import React, { Component } from "react";
import { db } from "../lib/local_storage_driver.js";
import { TracerWebSocket } from "../lib/tracer_websocket.js";
import { ParseDjangoModelJson, ParseJSONstr } from "../lib/formatting.js";
import {JSON_ADDRESS, JSON_CUSTOMER, JSON_ACTIVITY_ORDER, JSON_DATABASE, JSON_DELIVER_TIME,
        JSON_EMPLOYEE, JSON_ISOTOPE, JSON_RUN, JSON_SERVER_CONFIG, JSON_TRACER,
        JSON_INJECTION_ORDER, JSON_VIAL, WEBSOCKET_MESSAGE_GREAT_STATE, DATABASE_ACTIVITY_ORDER, DATABASE_ADDRESS, DATABASE_CUSTOMER, DATABASE_DATABASE,
        DATABASE_DELIVER_TIME, DATABASE_EMPLOYEE, DATABASE_INJECTION_ORDER, DATABASE_ISOTOPE,
        DATABASE_IS_AUTH, DATABASE_PRODUCTION, LEGACY_KEYWORD_USERGROUP, USER_GROUPS, WEBSOCKET_MESSAGE_AUTH_LOGIN,
        DATABASE_TRACER, DATABASE_SERVER_CONFIG, DATABASE_VIAL, WEBSOCKET_MESSAGE_AUTH_LOGOUT, WEBSOCKET_MESSAGE_AUTH_WHOAMI,
        AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, JSON_AUTH, LEGACY_KEYWORD_CUSTOMER, WEBSOCKET_SESSION_ID, DATABASE_USER,
        DATABASE_TRACER_MAPPING, JSON_TRACER_MAPPING, LEGACY_KEYWORD_CUSTOMER_ID, LEGACY_KEYWORD_TRACER_ID, ERROR_INVALID_JAVASCRIPT_VERSION, ERROR_INSUFFICIENT_PERMISSIONS, DATABASE_CLOSED_DATE, JSON_CLOSED_DATE, PROP_USER, PROP_WEBSOCKET, PROP_NAVBAR_ELEMENTS, PROP_LOGOUT, PROP_SET_USER, WEBSOCKET_MESSAGE_GET_STATE, JSON_KEYWORDS
      } from "../lib/constants.js";
import { User } from "../dataclasses/user.js";
import { TracerShop } from "./sites/tracer_shop.js";

export { App }

export default class App extends Component {
  constructor(props) {
    super(props);
    // Init old state



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
    // Updating State with Keywords
    for(const keyword of JSON_KEYWORDS){
      state[keyword] = this.getDatabaseMap(keyword)
    }



    state[DATABASE_ADDRESS] = address;
    state[DATABASE_CLOSED_DATE] = closed_date;
    state[DATABASE_CUSTOMER] = customer;
    state[DATABASE_DATABASE] = databases;
    state[DATABASE_DELIVER_TIME] = deliverTimes;
    state[DATABASE_EMPLOYEE] = employees;
    state[DATABASE_ISOTOPE] = isotopes;
    state[DATABASE_ACTIVITY_ORDER] = orders;
    state[DATABASE_PRODUCTION] = runs;
    state[DATABASE_INJECTION_ORDER] = injection_orders;
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
        this.MasterSocket.getMessage(WEBSOCKET_MESSAGE_GET_STATE));
    }
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
                        data[LEGACY_KEYWORD_USERGROUP],
                        data[LEGACY_KEYWORD_CUSTOMER],
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
    const dbmap = db.get(databaseField);
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

  updateState(state){
    const appState = {...state}
    for (const key of state){
      const modelMap = ParseDjangoModelJson(state[key]);
      state[key] = modelMap
      db.set(key, modelMap)
    }
    this.setState(appState);
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
    // This is because javascript is fucking stupid
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
