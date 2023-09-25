import React, { Component } from "react";
import { db } from "../lib/local_storage_driver.js";
import { TracerWebSocket } from "../lib/tracer_websocket.js";
import { ParseDjangoModelJson } from "../lib/formatting.js";
import { LEGACY_KEYWORD_USERGROUP, USER_GROUPS, WEBSOCKET_MESSAGE_AUTH_LOGOUT,
  WEBSOCKET_MESSAGE_AUTH_WHOAMI,
  AUTH_IS_AUTHENTICATED, AUTH_USERNAME, LEGACY_KEYWORD_CUSTOMER, DATABASE_CURRENT_USER,
  PROP_USER, PROP_WEBSOCKET, PROP_NAVBAR_ELEMENTS, PROP_LOGOUT, PROP_SET_USER,
  WEBSOCKET_MESSAGE_GET_STATE, JSON_KEYWORDS, AUTH_USER_ID, WEBSOCKET_SESSION_ID
} from "../lib/constants.js";
import { User } from "../dataclasses/dataclasses.js";
import { TracerShop } from "./sites/tracer_shop.js";
import Cookies from "js-cookie";

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
      Cookies.remove('sessionid');
    })
  }

  whoami(){
    const message = this.MasterSocket.getMessage(WEBSOCKET_MESSAGE_AUTH_WHOAMI)
    this.MasterSocket.send(message).then((data) => {
      let user;
      if (data[AUTH_IS_AUTHENTICATED]){
        user = new User(undefined,
                        data[AUTH_USER_ID],
                        data[AUTH_USERNAME],
                        data[LEGACY_KEYWORD_USERGROUP])
      } else {
        user = new User();
      }
      this.set_user(user)
      if(data[WEBSOCKET_SESSION_ID]) {
        Cookies.set('sessionid', data[WEBSOCKET_SESSION_ID])
      }

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
        newStateMap.delete(id);
      }
    } else {
      newStateMap.delete(ids);
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
      user = new User(
        undefined,
        user.id,
        user.username, user.user_group);
    }
    if(user.UserGroup == USER_GROUPS.ANON){
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
    props[PROP_USER] = this.state[DATABASE_CURRENT_USER]
    props[PROP_NAVBAR_ELEMENTS] = [];
    props[PROP_LOGOUT] = this.logout.bind(this);
    props[PROP_SET_USER] = this.set_user.bind(this);
    props[PROP_WEBSOCKET] = this.MasterSocket;

    return (<TracerShop
      {...props}
      />);
    }
  }
