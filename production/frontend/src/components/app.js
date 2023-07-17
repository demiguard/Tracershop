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
        AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, JSON_AUTH, LEGACY_KEYWORD_CUSTOMER, WEBSOCKET_SESSION_ID, DATABASE_CURRENT_USER,
        DATABASE_TRACER_MAPPING, JSON_TRACER_MAPPING, LEGACY_KEYWORD_CUSTOMER_ID, LEGACY_KEYWORD_TRACER_ID, ERROR_INVALID_JAVASCRIPT_VERSION, ERROR_INSUFFICIENT_PERMISSIONS, DATABASE_CLOSED_DATE, JSON_CLOSED_DATE, PROP_USER, PROP_WEBSOCKET, PROP_NAVBAR_ELEMENTS, PROP_LOGOUT, PROP_SET_USER, WEBSOCKET_MESSAGE_GET_STATE, JSON_KEYWORDS, JSON_PRODUCTION, AUTH_USER_ID
      } from "../lib/constants.js";
import { User } from "../dataclasses/user.js";
import { TracerShop } from "./sites/tracer_shop.js";

export { App }

export default class App extends Component {
  constructor(props) {
    super(props);
    // Init old state
    let user = db.get(DATABASE_CURRENT_USER)


    if(user && !(user instanceof User)){
      user = new User(user.username, user.user_group, user.customer, user.id);
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

    state[DATABASE_CURRENT_USER] = user;

    this.state = state;
    this.MasterSocket = new TracerWebSocket(
      new WebSocket("ws://" + window.location.host + "/ws/"), this);
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
                        data[AUTH_USER_ID]
        )
      } else {
        user = new User();
      }
      this.set_user(user)
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
    const dbObject = db.get(databaseField)
    if (!dbObject) return undefined
    return dbObject
  }

  deleteModels(key, ids){
    const newState = {...this.state}
    const newStateMap = new Map(newState[key])
    if (ids instanceof Array){
      for(const id of ids){
        newStateMap.delete(id)
      }
    } else {
      newStateMap.delete(ids)
    }
    newState[key] = newStateMap;
    this.setState(newState)

  }

  /**
   * Updates the global state, shared by all sites
   * @param {Map<Number, Object>} state - The new state to add or updated
   * @param {Boolean} refreshDatabase - True, discard the old database - False, keep the old database
   */
  updateState(state, refreshDatabase){
    const appState = {...this.state}
    for (const key of Object.keys(state)){
      let oldStateMap = appState[key];
      if(refreshDatabase){
        oldStateMap = null
      }
      const modelMap = ParseDjangoModelJson(state[key], oldStateMap);
      appState[key] = modelMap
      db.set(key, modelMap)
    }
    this.setState(appState);
  }


  set_user(user) {
    if(!user instanceof User){
      user = new User(user.username, user.user_group, user.customer, user.id);
    }
    if(user.user_group == USER_GROUPS.ANON){
      db.delete(DATABASE_CURRENT_USER);
    } else {
      db.set(DATABASE_CURRENT_USER, user);
    }

    const newState = {...this.state}
    newState[PROP_USER] = user;

    this.setState(newState);
    this.MasterSocket.send(this.MasterSocket.getMessage(WEBSOCKET_MESSAGE_GET_STATE));
  }

  componentDidMount() {
    this.whoami(); // This triggers a get state
  }

  createPropsWithStateDatabase() {
    const props = {}
    for (const keyword of JSON_KEYWORDS){
      props[keyword] = this.state[keyword]
    }

    return props
  }

  render() {
    const props = this.createPropsWithStateDatabase();
    // And also some none database props
    props[DATABASE_CURRENT_USER] = this.state[DATABASE_CURRENT_USER]
    props[PROP_NAVBAR_ELEMENTS] = [];
    props[PROP_LOGOUT] = this.logout.bind(this);
    props[PROP_SET_USER] = this.set_user.bind(this);
    props[PROP_WEBSOCKET] = this.MasterSocket;

    return (<TracerShop
      {...props}
      />);
    }
  }
