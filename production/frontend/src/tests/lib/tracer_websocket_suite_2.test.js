import WS from "jest-websocket-mock"
import Cookies from "js-cookie";
import { AUTH_IS_AUTHENTICATED, WEBSOCKET_MESSAGE_ID,
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE,
  WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_SESSION_ID, DATA_USER,

 } from "~/lib/shared_constants.js"
import { TracerWebSocket } from "~/lib/tracer_websocket.js";
import { MessageChannel } from 'node:worker_threads'
import { jest } from "@jest/globals"
import { User } from "~/dataclasses/dataclasses";

let server = null;
let internal_ws = null;
let websocket = null;
const dispatch = jest.fn()

const cookie_setter = jest.spyOn(window.document, 'cookie', 'set')

beforeEach(async () => {
  //window.location.host = "localhost:1234";
  window.MessageChannel = MessageChannel;
  server = new WS("ws://localhost:1234", {jsonProtocol : true});
  internal_ws = new WebSocket("ws://localhost:1234");
  websocket = new TracerWebSocket(internal_ws, dispatch);
})

afterEach(() =>{
  server.close();
  WS.clean();
  dispatch.mockClear();
})

describe("Tracer websocket initial message", () => {
  it("Websocket open updates the session as anon", async () => {
    await server.connected;
    const nextMessage = await server.nextMessage;

    const response = {
      [WEBSOCKET_SESSION_ID] : "",
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE,
      [WEBSOCKET_MESSAGE_ID] : nextMessage[WEBSOCKET_MESSAGE_ID],
      [AUTH_IS_AUTHENTICATED] : false
    }

    server.send(response);

    let resolvedPromise = null;

    while(resolvedPromise === null){
      resolvedPromise = websocket._initializationPromise;
    }

    await resolvedPromise;
    expect(cookie_setter).not.toHaveBeenCalled()


    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      newUser : new User()
    }))
  })

  it("Websocket open updates the session as a user", async () => {
    await server.connected;
    const nextMessage = await server.nextMessage;

    const response = {
      [WEBSOCKET_SESSION_ID] : "SESSION ID",
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_AUTH_RESPONSE,
      [WEBSOCKET_MESSAGE_ID] : nextMessage[WEBSOCKET_MESSAGE_ID],
      [AUTH_IS_AUTHENTICATED] : true,
      [DATA_USER] : {
        [DATA_USER] : [{
          pk : 1, fields : {
            username : "test_username",
            user_group : 1,
            active : true,
            last_login : null,
          },
        },]
      },
    };

    server.send(response);

    let resolvedPromise = null;

    while(resolvedPromise === null){
      resolvedPromise = websocket._initializationPromise;
    }

    await resolvedPromise;

    expect(cookie_setter).toHaveBeenCalled()

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      newUser : new User(
        null, 1, "test_username", 1, true
      )
    }));
  })

  it("Try and send before connected to the server", async () => {
    websocket.send({'message' : "helloworld"});

    await server.connected;

    expect(server).toReceiveMessage(expect.objectContaining({
      message : "helloworld"
    }));
  })
})