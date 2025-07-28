import React from "react";
import Cookies from "js-cookie";

import { WEBSOCKET_MESSAGE_TYPE,  WEBSOCKET_DATA_ID,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_ID,
  WEBSOCKET_JAVASCRIPT_VERSION, JAVASCRIPT_VERSION, AUTH_IS_AUTHENTICATED, WEBSOCKET_MESSAGE_MODEL_EDIT,
  WEBSOCKET_MESSAGE_MODEL_DELETE, WEBSOCKET_MESSAGE_MODEL_CREATE, WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
  AUTH_PASSWORD, WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER, WEBSOCKET_SESSION_ID, WEBSOCKET_MESSAGE_AUTH_WHOAMI, AUTH_USER,
  WEBSOCKET_MESSAGE_READ_BOOKINGS, WEBSOCKET_DATE,   SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_SUCCESS,
  WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_READ_TELEMETRY,
  DATA_USER} from "~/lib/shared_constants.js";

import { User } from "~/dataclasses/dataclasses.js";
import { UpdateState, DeleteState, UpdateCurrentUser, ReducerAction, UpdateWebsocketConnectionState, UpdateError } from '~/lib/state_actions';
import { deserialize_single } from "./serialization";
import { DATABASE_CURRENT_USER } from "./constants";
import { db } from "./local_storage_driver";
import { createMessage, MESSAGE_AUTH_LOGOUT, MESSAGE_AUTH_RESPONSE, MESSAGE_CREATE_BOOKING, MESSAGE_DELETE_BOOKING, MESSAGE_DELETE_STATE, MESSAGE_ERROR, MESSAGE_READ_BOOKINGS, MESSAGE_READ_STATE, MESSAGE_READ_TELEMETRY, MESSAGE_UPDATE_PRIVILEGED_STATE, MESSAGE_UPDATE_STATE, MESSAGES } from "~/lib/incoming_messages";

const promise_resolve_timeout_ms = 150;

export class TracerWebSocket {
  /**@type {WebSocket} The naked websocket */ #ws
  /**@type {Map<Number, MessageChannel> } Mapping of outstanding messages, the message channel resolves a promise with the response */ #promiseMap
  /**@type {React.Dispatch<React.ReducerAction>} Function to trigger updates to the global state */ #dispatch
  /**@type {Map<Number, CallableFunction>} Mapping over  */ #listeners
  /**@type {Number} Increasing index number for listeners  */ #listerNumber

  /**
   * This is websocket that is the primary source of communication between the front and backend
   * @param {WebSocket} Websocket
   * @param {React.Dispatch<React.ReducerAction>} dispatch
   */
  constructor(websocket, dispatch){
    this.#promiseMap = new Map();
    this.#listeners = new Map();
    this.#listerNumber = 1; // Gotta start at 1 otherwise if conditions fails
    this.#dispatch = dispatch
    this.initializeWebsocket(websocket) // sets .#ws
  }

  close(){
    this.#ws.close();
  }

  /** Creates a message object, that latter can be send by the websocket
   *
   * @param {String} messageType - a WEBSOCKET_MESSAGE_* constants
   * @returns {Object} on json format, still need to add the data for the message
   */
  getMessage(messageType) {
    return {
      [WEBSOCKET_MESSAGE_TYPE] : messageType,
    };
  }

  async safeSend(message, websocket){
    let readyState = websocket.readyState;
    switch(readyState) {
      case WebSocket.CONNECTING:
        let iter = 0;
        while(iter < 10 && websocket.readyState === WebSocket.CONNECTING){
          await new Promise(r => setTimeout(r, 100));
        }
        /* istanbul ignore if */
        if(websocket.readyState !== WebSocket.OPEN){
          /* istanbul ignore next */
          throw {
            columnNumber : "",
            fileName : "",
            lineLumber : "",
            message : "The Websocket is disconnected from the server",
            stack : "",
          }
        }
      // Deliberate fall through
      case WebSocket.OPEN:
        websocket.send(JSON.stringify(message));
        break;
      /* istanbul ignore next */
      default:
        throw {
          columnNumber : "",
          fileName : "",
          lineLumber : "",
          message : "The Websocket is disconnected from the server",
          stack : "",
        };
    };
  }

  /**
   * Sends some data to backend
   * @param {Object} data
   * @returns {Promise}
   */
  send(data){
    // Note that this function is just a wrapper around safe_send
    // Message ID is the method, that allows us to asynchronous resolve the correct Promise
    const messageID = (() => {
      if(data.hasOwnProperty(WEBSOCKET_MESSAGE_ID)){
        return data[WEBSOCKET_MESSAGE_ID];
      }
      const messageID = Math.floor(Math.random() * 2147483647);

      data[WEBSOCKET_MESSAGE_ID] = messageID;

      return messageID;
    })();

    if (!data.hasOwnProperty(WEBSOCKET_JAVASCRIPT_VERSION)){
      data[WEBSOCKET_JAVASCRIPT_VERSION] = JAVASCRIPT_VERSION
    }

    /* istanbul ignore if */
    if(this.#ws.readyState === WebSocket.CLOSING ||
       this.#ws.readyState === WebSocket.CLOSED
     ) {
       this.initializeWebsocket(new WebSocket("ws://" + window.location.host + "/ws/"));
     }

    const promiseMap = this.#promiseMap;

    // Note that this function actually does the sending
    // The promises is just to call an async function.
    new Promise(() => this.safeSend(data, this.#ws));
    const promise = new Promise(async function (resolve) {
      const pipe = new MessageChannel();
      pipe.port1.onmessage = function (messageEvent) {
        // NO FUCKING CLUE WHY WE THROW AWAY CLASSES HERE???
        // Might be because it's a copy of the original data and the meta data
        // such as the .__proto__ isn't copied
        resolve(createMessage(messageEvent.data));
      }
      promiseMap.set(messageID, pipe);
    }.bind(this));

    return promise;
  }

  sendEditModel(modelType, models){
    return this.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_EDIT,
      [WEBSOCKET_DATA] : models,
      [WEBSOCKET_DATATYPE] : modelType,
    });
  }

  sendCreateModel(modelType, models){
    const message_to_send = {
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_CREATE,
      [WEBSOCKET_DATA] : models,
      [WEBSOCKET_DATATYPE] : modelType,
    };

    return this.send(message_to_send);
  }

  sendDeleteModel(modelType, models){
    const ids = (() => {
      if (models instanceof Array){
        return models.map((model) => {return (typeof model === 'number') ? model : model.id});
      } else if (typeof models === 'number') {
        return [models];
      } else {
        return [models.id];
      }
    })();

    return this.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_DELETE,
      [WEBSOCKET_DATA_ID] : ids,
      [WEBSOCKET_DATATYPE] : modelType,
    });
  }

  sendChangePassword(userID, newPassword){
    return this.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
      [WEBSOCKET_DATA_ID] : userID,
      [AUTH_PASSWORD] : newPassword,
    });
  }

  sendCreateExternalUser(userSkeleton){
    return this.send({
      [WEBSOCKET_DATA] : userSkeleton,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,
    });
  }

  sendGetBookings(date, activeEndpoint){
    return this.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_READ_BOOKINGS,
      [WEBSOCKET_DATE] : date,
      [WEBSOCKET_DATA_ID] : activeEndpoint,
    })
  }

  sendGetTelemetry(){
    return this.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_READ_TELEMETRY
    });
  }

  /**
   * Dispatches safely to the consumer
   * @param {ReducerAction} action
   */
  dispatch(action){
    this.#dispatch(action);
  }

  addListener(func){
    this.#listeners.set(this.#listerNumber, func);
    this.#listerNumber++;

    return this.#listerNumber;
  }

  removeListener(listenNumber){
    this.#listeners.delete(listenNumber);
  }

  triggerListeners(data){
    for(const func of this.#listeners.values()){
      func(data);
    }
  }

  // Websocket message functions
  onMessage(messageEvent){
    const message_raw = JSON.parse(messageEvent.data);
    if(message_raw[WEBSOCKET_MESSAGE_SUCCESS] != WEBSOCKET_MESSAGE_SUCCESS){
      this.dispatch(new UpdateError(message_raw[WEBSOCKET_MESSAGE_ERROR]));
      return;
    }
    if (!(WEBSOCKET_MESSAGE_TYPE in message_raw)){
      console.error("Missing message type", message_raw)
      return;
    }
    if(!(message_raw[WEBSOCKET_MESSAGE_TYPE] in MESSAGES)){
      console.error("Invalid message type message", message_raw)
      return;
    }

    const message = createMessage(message_raw)


    const pipe = this.#promiseMap.get(message[WEBSOCKET_MESSAGE_ID]);
    if(pipe !== undefined){
      // So the class information doesn't get passed, so we have to reconstruct
      // on the other side of this port.
      pipe.port2.postMessage(message_raw);
      setTimeout(() => {
        pipe.port1.close();
        pipe.port2.close();
        this.#promiseMap.delete(message[WEBSOCKET_MESSAGE_ID]);
      }, promise_resolve_timeout_ms);
    }
    // If this websocket isn't the author of the request, then there's no
    // promise to update.
    // A websocket might receive a message from due to another persons update.
    // This is the state updating messages send by the server
    this.triggerListeners(message);

    switch(true) {
      case message instanceof MESSAGE_READ_STATE:
        // Even though it's "UpdateState" it's just a update of the local
        // state, hence not a modification of any truths
        if(message.status === SUCCESS_STATUS_CRUD.SUCCESS) {
          this.dispatch(new UpdateState(message.data, message.refresh));
        }
        break;
      case message instanceof MESSAGE_UPDATE_STATE:
        // Also
        if(message.status === SUCCESS_STATUS_CRUD.SUCCESS) {
          this.dispatch(new UpdateState(message.data, message.refresh));
        } else {
          console.error("A message wasn't proper:", message_raw)
        }
        break;
      case message instanceof MESSAGE_UPDATE_PRIVILEGED_STATE:
        if(message.isAuthenticated && message.status === SUCCESS_STATUS_CRUD.SUCCESS){
          this.dispatch(new UpdateState(message.data, message.refresh));
        }
        break;
      case message instanceof MESSAGE_DELETE_STATE:
        if(message.status === SUCCESS_STATUS_CRUD.SUCCESS){
          this.dispatch(new DeleteState(message.datatype, message.dataID))
        }
        break;
      case message instanceof MESSAGE_ERROR:
        break;
      case message instanceof MESSAGE_AUTH_LOGOUT:
        break;
      case message instanceof MESSAGE_AUTH_RESPONSE:
      case message instanceof MESSAGE_CREATE_BOOKING:
      case message instanceof MESSAGE_DELETE_BOOKING:
      case message instanceof MESSAGE_READ_BOOKINGS:
      case message instanceof MESSAGE_READ_TELEMETRY:
        // These messages doesn't modify the global state, therefore the should
        // have been handled by local handlers
        break;
      default:
        console.error("Unhandled message", message_raw[WEBSOCKET_MESSAGE_TYPE])
    }
  }

  onClose(Event) {
    this.dispatch(new UpdateWebsocketConnectionState(WebSocket.CLOSED));
    for(const [messageID, channel] of this.#promiseMap){
      channel.port1.close();
      channel.port2.close();
    }
  }

  onError(err) {
    console.log("Error code",err.code)
    console.log("Socket encounter error: ", err);
    this.#ws.close();
  }

  onOpen(){
    this.dispatch(new UpdateWebsocketConnectionState(WebSocket.OPEN));
    const message = this.getMessage(WEBSOCKET_MESSAGE_AUTH_WHOAMI);
    this._initializationPromise = this.send(message).then((data) => {
      const user = data[AUTH_IS_AUTHENTICATED] ? deserialize_single(data[DATA_USER]) : new User();
      db.set(DATABASE_CURRENT_USER, user);
      this.dispatch(new UpdateCurrentUser(user));
      if(data[WEBSOCKET_SESSION_ID]) {
        Cookies.set('sessionid', data[WEBSOCKET_SESSION_ID], {sameSite:'strict'});
      }
    });
  }

  initializeWebsocket(websocket){
    this._initializationPromise = null;
    this.#ws = websocket;
    this.#ws.onmessage = this.onMessage.bind(this)
    this.#ws.onopen = this.onOpen.bind(this)
    this.#ws.onerror = this.onError.bind(this)
    this.#ws.onclose = this.onClose.bind(this)
  }
}
