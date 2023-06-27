/**
 * @jest-environment jsdom
 */
import WS from "jest-websocket-mock"
import { AUTH_IS_AUTHENTICATED, DATABASE_ACTIVITY_ORDER, DATABASE_CLOSED_DATE, DATABASE_INJECTION_ORDER, DATABASE_VIAL, ERROR_NO_MESSAGE_STATUS, ERROR_UNKNOWN_FAILURE, JAVASCRIPT_VERSION, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_GREAT_STATE, JSON_INJECTION_ORDER, JSON_VIAL, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, WEBSOCKET_DEAD_ORDERS, WEBSOCKET_JAVASCRIPT_VERSION, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_DELETE_DATA_CLASS, WEBSOCKET_MESSAGE_ECHO, WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_FREE_INJECTION, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_GREAT_STATE, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_MODEL_CREATE, WEBSOCKET_MESSAGE_MODEL_DELETE, WEBSOCKET_MESSAGE_MODEL_EDIT, WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_REFRESH } from "../../lib/constants.js";
import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { MessageChannel } from 'node:worker_threads'

let server = null;
let websocket = null;
let stateHolder = {
  updateState : jest.fn(),
  deleteModels : jest.fn(),
}



beforeEach(async () => {
  window.MessageChannel = MessageChannel
  server = new WS("ws://localhost:1234", {jsonProtocol : true});
  websocket = new TracerWebSocket(new WebSocket("ws://localhost:1234"), stateHolder);
  await server.connected;
})

afterEach(() =>{
  server.close();
  WS.clean();
  stateHolder.updateState.mockClear();
  stateHolder.deleteModels.mockClear();

})


describe("tracer websocket test suite", () => {
  it("Get Message", () => {
    const input = "Identity"
    const message = websocket.getMessage(input)
    expect(message).toHaveProperty(WEBSOCKET_MESSAGE_TYPE);
    expect(message[WEBSOCKET_MESSAGE_TYPE]).toBe(input)
  });

  it("Receive websocket create data class", () => {
    const data = {}
    const refresh = true

    const message = {}
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_UPDATE_STATE;
    message[WEBSOCKET_REFRESH] = refresh
    message[WEBSOCKET_DATA] = data
    server.send(message);

    expect(stateHolder.updateState).toBeCalledWith(data, refresh);
  });

  it("Handle Free order message", () => {
    const data = {}
    const refresh = true

    const message = {}
    message[AUTH_IS_AUTHENTICATED] = true
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_FREE_ACTIVITY;
    message[WEBSOCKET_REFRESH] = refresh
    message[WEBSOCKET_DATA] = data
    server.send(message);

    expect(stateHolder.updateState).toBeCalledWith(data, refresh);
  });

  it("Failed to Free order", () => {
    const data = {}
    const refresh = true

    const message = {}
    message[AUTH_IS_AUTHENTICATED] = false;
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_FREE_ACTIVITY;
    message[WEBSOCKET_REFRESH] = refresh
    message[WEBSOCKET_DATA] = data
    server.send(message);

    expect(stateHolder.updateState).not.toBeCalled();
  });

  it("Handle delete message", () => {
    const datatype = "datatype"
    const ids = [1,2,3,4,5];

    const message = {}
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_MODEL_DELETE;
    message[WEBSOCKET_DATATYPE] = datatype,
    message[WEBSOCKET_DATA_ID] = ids

    server.send(message)

    expect(stateHolder.deleteModels).toBeCalledWith(datatype, ids)
  })


  it("Websocket send empty message", () => {
    const message = {};
    websocket.send({});
    // To avoid flaky tests, this test doesn't assert as the message doesn't contain any message id
  });

  it("Websocket send skeleton message", () => {
    const message = {};
    message[WEBSOCKET_MESSAGE_ID] = 6942069;
    message[WEBSOCKET_JAVASCRIPT_VERSION] = JAVASCRIPT_VERSION
    websocket.send(message);

    expect(server).toReceiveMessage(message)
    // To avoid flaky tests, this test doesn't assert as the message doesn't contain any message id
  });


  it("Websocket respond skeleton message", async () => {
    const message = {};
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_ECHO;
    message[WEBSOCKET_MESSAGE_ID] = 6942069;
    message[WEBSOCKET_JAVASCRIPT_VERSION] = JAVASCRIPT_VERSION;
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    const promise = websocket.send(message);

    expect(server).toReceiveMessage(message)
    server.send(message)
    await expect(promise).resolves.toEqual(message);
  });

  // send Methods
  it("Send method - edit model",  () => {
    const dataType = "dataType";
    const data = [{id : 1, data: "foo bar"}];
    websocket.sendEditModel(dataType, data);

    const expectedMessage = {}
    expectedMessage[WEBSOCKET_DATATYPE] = dataType
    expectedMessage[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_MODEL_EDIT;
    expectedMessage[WEBSOCKET_DATA] = data


    expect(server).toReceiveMessage(expect.objectContaining(expectedMessage))
  })

  it("Send method - create model",  () => {
    const dataType = "dataType";
    const data = [{id : 1, data: "foo bar"}];
    websocket.sendCreateModel(dataType, [{id : 1, data: "foo bar"}]);

    const expectedMessage = {}
    expectedMessage[WEBSOCKET_DATATYPE] = dataType
    expectedMessage[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_MODEL_CREATE;
    expectedMessage[WEBSOCKET_DATA] = data

    expect(server).toReceiveMessage(expect.objectContaining(expectedMessage))
  })

})