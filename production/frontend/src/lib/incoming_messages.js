/* GENERATED FILE by python3 manage.py mapconstants, DO NOT EDIT!
This file consist of messages coming from the server. */
import { WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants.js"
import { deserialize } from "~/lib/serialization.js"
import {
  WEBSOCKET_MESSAGE_READ_STATE,
  WEBSOCKET_MESSAGE_ERROR,
  WEBSOCKET_MESSAGE_DELETE_BOOKING,
  WEBSOCKET_MESSAGE_AUTH_RESPONSE,
  WEBSOCKET_MESSAGE_DELETE_STATE,
  WEBSOCKET_MESSAGE_READ_BOOKINGS,
  WEBSOCKET_MESSAGE_UPDATE_STATE,
  WEBSOCKET_MESSAGE_AUTH_LOGOUT,
  WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,
  WEBSOCKET_MESSAGE_CREATE_BOOKING,
  WEBSOCKET_MESSAGE_MASS_ORDER,
  WEBSOCKET_MESSAGE_READ_TELEMETRY,
} from "~/lib/shared_constants.js"

export class MESSAGE_READ_STATE {
  constructor(message){
    this.success = message["success"]
    this.status = message["status"]
    this.message_id = message["message_id"]
    this.data = deserialize(message["data"])
    this.refresh = message["refresh"]
    this.messageType = message["messageType"]
  }
}

export class MESSAGE_ERROR {
  constructor(message){
    this.message_id = message["message_id"]
    this.success = message["success"]
    this.error = message["error"]
    this.status = message["status"]
    this.messageType = message["messageType"]
  }
}

export class MESSAGE_DELETE_BOOKING {
  constructor(message){
    this.type = message["type"]
    this.message_id = message["message_id"]
    this.success = message["success"]
    this.dataID = message["dataID"]
    this.datatype = message["datatype"]
    this.messageType = message["messageType"]
  }
}

export class MESSAGE_AUTH_RESPONSE {
  constructor(message){
    this.isAuthenticated = message["isAuthenticated"]
    this.user = message["user"]
    this.session_id = message["session_id"]
    this.messageType = message["messageType"]
    this.message_id = message["message_id"]
    this.success = message["success"]
  }
}

export class MESSAGE_DELETE_STATE {
  constructor(message){
    this.type = message["type"]
    this.status = message["status"]
    this.dataID = message["dataID"]
    this.datatype = message["datatype"]
    this.message_id = message["message_id"]
    this.messageType = message["messageType"]
    this.success = message["success"]
  }
}

export class MESSAGE_READ_BOOKINGS {
  constructor(message){
    this.message_id = message["message_id"]
    this.success = message["success"]
    this.status = message["status"]
    this.data = deserialize(message["data"])
    this.refresh = message["refresh"]
    this.messageType = message["messageType"]
  }
}

export class MESSAGE_UPDATE_STATE {
  constructor(message){
    this.type = message["type"]
    this.success = message["success"]
    this.status = message["status"]
    this.messageType = message["messageType"]
    this.message_id = message["message_id"]
    this.data = deserialize(message["data"])
    this.refresh = message["refresh"]
  }
}

export class MESSAGE_AUTH_LOGOUT {
  constructor(message){
    this.messageType = message["messageType"]
    this.message_id = message["message_id"]
    this.success = message["success"]
  }
}

export class MESSAGE_UPDATE_PRIVILEGED_STATE {
  constructor(message){
    this.type = message["type"]
    this.isAuthenticated = message["isAuthenticated"]
    this.success = message["success"]
    this.status = message["status"]
    this.message_id = message["message_id"]
    this.data = deserialize(message["data"])
    this.messageType = message["messageType"]
    this.refresh = message["refresh"]
  }
}

export class MESSAGE_CREATE_BOOKING {
  constructor(message){
    this.type = message["type"]
    this.message_id = message["message_id"]
    this.success = message["success"]
    this.data = deserialize(message["data"])
    this.messageType = message["messageType"]
  }
}

export class MESSAGE_MASS_ORDER {
  constructor(message){
    this.type = message["type"]
    this.success = message["success"]
    this.status = message["status"]
    this.messageType = message["messageType"]
    this.message_id = message["message_id"]
    this.data = deserialize(message["data"])
    this.booking = deserialize(message["booking"])
  }
}

export class MESSAGE_READ_TELEMETRY {
  constructor(message){
    this.success = message["success"]
    this.message_id = message["message_id"]
    this.data = message["data"]
    this.messageType = message["messageType"]
  }
}

export const MESSAGES = {
  [WEBSOCKET_MESSAGE_READ_STATE] : MESSAGE_READ_STATE,
  [WEBSOCKET_MESSAGE_ERROR] : MESSAGE_ERROR,
  [WEBSOCKET_MESSAGE_DELETE_BOOKING] : MESSAGE_DELETE_BOOKING,
  [WEBSOCKET_MESSAGE_AUTH_RESPONSE] : MESSAGE_AUTH_RESPONSE,
  [WEBSOCKET_MESSAGE_DELETE_STATE] : MESSAGE_DELETE_STATE,
  [WEBSOCKET_MESSAGE_READ_BOOKINGS] : MESSAGE_READ_BOOKINGS,
  [WEBSOCKET_MESSAGE_UPDATE_STATE] : MESSAGE_UPDATE_STATE,
  [WEBSOCKET_MESSAGE_AUTH_LOGOUT] : MESSAGE_AUTH_LOGOUT,
  [WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE] : MESSAGE_UPDATE_PRIVILEGED_STATE,
  [WEBSOCKET_MESSAGE_CREATE_BOOKING] : MESSAGE_CREATE_BOOKING,
  [WEBSOCKET_MESSAGE_MASS_ORDER] : MESSAGE_MASS_ORDER,
  [WEBSOCKET_MESSAGE_READ_TELEMETRY] : MESSAGE_READ_TELEMETRY,
}

export function createMessage(valid_message){
  return new MESSAGES[valid_message[WEBSOCKET_MESSAGE_TYPE]](valid_message);
}
