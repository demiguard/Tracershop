import React from "react";
import Cookies from "js-cookie";

import { WEBSOCKET_MESSAGE_TYPE,  WEBSOCKET_DATA_ID,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_UPDATE_STATE,
  WEBSOCKET_JAVASCRIPT_VERSION, JAVASCRIPT_VERSION, AUTH_IS_AUTHENTICATED, WEBSOCKET_MESSAGE_MODEL_EDIT,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_FREE_INJECTION, WEBSOCKET_REFRESH,
  WEBSOCKET_MESSAGE_MODEL_DELETE, WEBSOCKET_MESSAGE_MODEL_CREATE, WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
  AUTH_PASSWORD, WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER, WEBSOCKET_SESSION_ID, WEBSOCKET_MESSAGE_AUTH_WHOAMI, AUTH_USER, WEBSOCKET_MESSAGE_GET_STATE } from "~/lib/shared_constants.js";

import { ParseJSONstr } from "~/lib/formatting.js";
import { User } from "~/dataclasses/dataclasses.js";
import { UpdateState, DeleteState, UpdateCurrentUser, ReducerAction } from '~/lib/state_actions';
import { deserialize_single } from "./serialization";
import { DATABASE_CURRENT_USER } from "./constants";
import { db } from "./local_storage_driver";

export class TracerWebSocket {
  /**@type {WebSocket} */ _ws
  /**@type {React.Dispatch<React.ReducerAction>} */ _dispatch

  /**
   * This is websocket that is the primary source of communication between the front and backend
   * @param {WebSocket} Websocket
   * @param {React.Dispatch<React.ReducerAction>} dispatch
   */
  constructor(websocket, dispatch){
    this._PromiseMap = new Map();
    this._ws = websocket;
    this._dispatch = dispatch

    /** This function is called, when a message is received through the websocket from the server.
     *  This function handles all the different messages.
     *  Therefore it's basicly a big switch statement on each message type
     *
     * Note that websockets works syncronized, and the callback is fucked.
     * I think it's because I define a onmessage function in the websocket
     * This means that you can't add an function argument
     * Jesus javascript, this is stupid
     * So there's one way I get around this, by injecting this class with the parents class
     * This means that the program have access to the state of the program but not any smaller sites
     * Such effect means that It should cause a site wide change for all users connected.
     *
     * @param {*} messageEvent - Message that is received
     */
    this._ws.onmessage = function(messageEvent) {
      const message = JSON.parse(messageEvent.data);
      const pipe = this._PromiseMap.get(message[WEBSOCKET_MESSAGE_ID]);
      // If this websocket isn't the author of the request, then there's no promise to update.
      // A websocket might receive a message from due to another persons update.

      /**This is the state updating messages send by the server */
      switch(message[WEBSOCKET_MESSAGE_TYPE]) {
        case WEBSOCKET_MESSAGE_UPDATE_STATE:
          /**Assumes message is on format:
           * WEBSOCKET_DATA - {
           *   DATA_XXX : List of Objects
           * }
           */
          const state = ParseJSONstr(message[WEBSOCKET_DATA])
            this._dispatch(new UpdateState(state, message[WEBSOCKET_REFRESH]));
          break;
        case WEBSOCKET_MESSAGE_MODEL_DELETE: {
            if(message[WEBSOCKET_DATA]){ // if the delete was successful or not
              this._dispatch(new DeleteState(message[WEBSOCKET_DATATYPE], message[WEBSOCKET_DATA_ID]))
            }

        }
        break;
        case WEBSOCKET_MESSAGE_FREE_INJECTION:
        case WEBSOCKET_MESSAGE_FREE_ACTIVITY:
        {
          if(message[AUTH_IS_AUTHENTICATED]){
            const state = ParseJSONstr(message[WEBSOCKET_DATA]);

            this._dispatch(new UpdateState(state, message[WEBSOCKET_REFRESH]));
          }
        }
        break;
      }
      if(pipe != undefined){
        pipe.port2.postMessage(message);
      }
    }

    this._ws.onclose = function(e) {
      for(const [messageID, channel] of this._PromiseMap){
        channel.port1.close();
        channel.port2.close();
      }
    }

    this._ws.onerror = function(err) {
      console.error("Socket encounter error: ", err);
      this._ws.close();
    }

    this._ws.onopen = function (){
      const message = this.getMessage(WEBSOCKET_MESSAGE_AUTH_WHOAMI);
      this.send(message).then((data) => {
        let user;
        if (data[AUTH_IS_AUTHENTICATED]){
          user = deserialize_single(data[AUTH_USER]);
        } else {
          user = new User();
        }
        db.set(DATABASE_CURRENT_USER, user);
        this.dispatch(new UpdateCurrentUser(user));
        if(data[WEBSOCKET_SESSION_ID]) {
          Cookies.set('sessionid', data[WEBSOCKET_SESSION_ID], {sameSite:'strict'});
        }
      });
    }

    this._ws.onopen = this._ws.onopen.bind(this);
    this._ws.onmessage = this._ws.onmessage.bind(this);
    this._ws.onclose = this._ws.onclose.bind(this);
    this._ws.onerror = this._ws.onerror.bind(this);
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
    var iter = 0;
    var readyState = websocket.readyState;
    while(iter < 10 && readyState === 0){
      await new Promise(r => setTimeout(r, 100));
      readyState = websocket.readyState
    }
    if(websocket.readyState === WebSocket.OPEN){
      websocket.send(JSON.stringify(message));
    } else {
      console.log("Websocket was unable to send a message")
   }
  }

  /**
   *
   * @param {Object} data
   * @returns
   */
  send(data){
    // Note that this function is just a wrapper around


    // Message ID is the method, that allows us to asynchronous resolve the correct Promise
    let messageID;
    if (!data.hasOwnProperty(WEBSOCKET_MESSAGE_ID)){
        const TestID = Math.floor(Math.random() * 2147483647);

        messageID = TestID;
        data[WEBSOCKET_MESSAGE_ID] = messageID
    } else {
        messageID = data[WEBSOCKET_MESSAGE_ID]
    }
    if (!data.hasOwnProperty(WEBSOCKET_JAVASCRIPT_VERSION)){
      data[WEBSOCKET_JAVASCRIPT_VERSION] = JAVASCRIPT_VERSION
    }

    if(this._ws.readyState === WebSocket.CLOSING ||
       this._ws.readyState === WebSocket.CLOSED
      ) {
        this._ws
      }

    // Note that this function actually does the sending
    // The promises is just to call an async function.
    new Promise(() => this.safeSend(data, this._ws));

    const promise = new Promise(async function (resolve) {
      const pipe = new MessageChannel();
      pipe.port1.onmessage = function (messageEvent) {
        resolve(messageEvent.data);
      }
      this._PromiseMap.set(messageID, pipe);
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
    return this.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_CREATE,
      [WEBSOCKET_DATA] : models,
      [WEBSOCKET_DATATYPE] : modelType,
    });
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

    this.send({
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

  /**
   * Dispatches safely to the consumer
   * @param {ReducerAction} action
   */
  dispatch(action){
    if(this._dispatch !== undefined){
      this._dispatch(action);
    } else {
      console.log("Missed dispatch");
    }
  }
}