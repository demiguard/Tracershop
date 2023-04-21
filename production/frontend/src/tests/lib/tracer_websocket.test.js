/**
 * @jest-environment jsdom
 */
import WS from "jest-websocket-mock"
import { AUTH_IS_AUTHENTICATED, DATABASE_ACTIVITY_ORDER, DATABASE_CLOSED_DATE, DATABASE_INJECTION_ORDER, DATABASE_VIAL, ERROR_NO_MESSAGE_STATUS, ERROR_UNKNOWN_FAILURE, JAVASCRIPT_VERSION, JSON_ACTIVITY_ORDER, JSON_CLOSED_DATE, JSON_GREAT_STATE, JSON_INJECTION_ORDER, JSON_VIAL, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_DATA_ID, WEBSOCKET_DEAD_ORDERS, WEBSOCKET_JAVASCRIPT_VERSION, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_DELETE_DATA_CLASS, WEBSOCKET_MESSAGE_ECHO, WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_FREE_INJECTION, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_GREAT_STATE, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE } from "../../lib/constants.js";
import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { MessageChannel } from 'node:worker_threads'

let server = null;
let websocket = null;
let stateHolder = {
  UpdateMap : jest.fn(),
  UpdateMaps : jest.fn(),
  updateGreatState : jest.fn(),
  setError : jest.fn()
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
  stateHolder.setError.mockClear();
  stateHolder.UpdateMap.mockClear();
  stateHolder.UpdateMaps.mockClear();
  stateHolder.updateGreatState.mockClear();
})


describe("tracer websocket test suite", () => {
  it("Get Message", () => {
    const input = "Identity"
    const message = websocket.getMessage(input)
    expect(message).toHaveProperty(WEBSOCKET_MESSAGE_TYPE);
    expect(message[WEBSOCKET_MESSAGE_TYPE]).toBe(input)
  });

  // Test cases for failed messages
  it("Sending unknown failed message", async () => {
    const message = {}
    message[WEBSOCKET_MESSAGE_SUCCESS] = ERROR_UNKNOWN_FAILURE
    server.send(message);

    expect(stateHolder.setError).toBeCalledWith({
      site_error : ERROR_UNKNOWN_FAILURE,
      site_error_info : ""
    });
  });

  it("Sending empty message", async () => {
    const message = {}
    server.send(message);

    expect(stateHolder.setError).toBeCalledWith({
      site_error : ERROR_NO_MESSAGE_STATUS,
      site_error_info : ""
    });
  });


  it("Receive websocket create data class", () => {
    const datatype = JSON_ACTIVITY_ORDER;
    const data = {
      id : 1,
      data : "data"
    }

    const message = {}
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_CREATE_DATA_CLASS;
    message[WEBSOCKET_DATA_ID] = "id";
    message[WEBSOCKET_DATATYPE] = datatype;
    message[WEBSOCKET_DATA] = data;
    server.send(message);
    expect(stateHolder.UpdateMap).toBeCalledWith(datatype, [data], 'id', true, [])

    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Receive websocket great state", () => {
    const data = {
      id : 1,
      data : "data"
    };

    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_GREAT_STATE;
    message[JSON_GREAT_STATE] = data;
    server.send(message);
    expect(stateHolder.updateGreatState).toBeCalledWith(data);

    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Received websocket Move orders", async () => {
    const data = {id : 1, data : "data"};
    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_MOVE_ORDERS;
    message[JSON_ACTIVITY_ORDER] = [JSON.stringify(data)]
    message[WEBSOCKET_DEAD_ORDERS] = [2]
    server.send(message);

    expect(stateHolder.UpdateMap).toBeCalledWith(DATABASE_ACTIVITY_ORDER, [data], 'oid', true, [2]);

    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Received websocket Get Orders", async () => {
    const activityOrder = {id : 1, data : "activityOrder"};
    const InjectionOrder1 = {id : 1, data : "injectionOrder_1"};
    const InjectionOrder2 = {id : 2, data : "injectionOrder_2"};
    const vial1 = {id : 1, data : "vial_1"};
    const vial2 = {id : 2, data : "vial_2"};
    const closedDate = {id : 1, data : "closedDate"};
    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_GET_ORDERS;
    message[JSON_ACTIVITY_ORDER] = [JSON.stringify(activityOrder)]
    message[JSON_INJECTION_ORDER] = [JSON.stringify(InjectionOrder1), JSON.stringify(InjectionOrder2)]
    message[JSON_VIAL] = [JSON.stringify(vial1), JSON.stringify(vial2)]
    message[JSON_CLOSED_DATE] = [JSON.stringify(closedDate)]
    message[WEBSOCKET_DEAD_ORDERS] = [2]
    server.send(message);

    expect(stateHolder.UpdateMaps).toBeCalledWith(
      [DATABASE_ACTIVITY_ORDER, DATABASE_INJECTION_ORDER, DATABASE_VIAL, DATABASE_CLOSED_DATE],
      [[activityOrder], [InjectionOrder1, InjectionOrder2], [vial1, vial2], [closedDate]],
      ["oid", "oid", "ID", "BDID"],
      [true, true, true, true],
      [[],[],[],[]]
    );

    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Received websocket edit state", async () => {
    const data = {
      id : 1,
      data : "data"
    }
    const data_id = "id"
    const datatype = "datatype"

    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_EDIT_STATE;
    message[WEBSOCKET_DATA] = JSON.stringify(data);
    message[WEBSOCKET_DATA_ID] = data_id;
    message[WEBSOCKET_DATATYPE] = datatype;
    server.send(message);

    expect(stateHolder.UpdateMap).toBeCalledWith(datatype, [data], data_id, true, []);

    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Received websocket free activity order", async () => {
    const activityOrder1 = {
      oid : 1,
      data : "data 1"
    };

    const activityOrder2 = {
      oid : 2,
      data : "data 2"
    };
    const activityOrder3 = {
      oid : 3,
      data : "data 3"
    };

    const vial1 = {
      ID : 1,
      data : "vial 1"
    }
    const vial2 = {
      ID : 2,
      data : "vial 2"
    }

    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_FREE_ACTIVITY;
    message[JSON_ACTIVITY_ORDER] = [
      JSON.stringify(activityOrder1),
      JSON.stringify(activityOrder2),
      JSON.stringify(activityOrder3)
    ]
    message[AUTH_IS_AUTHENTICATED] = true
    message[JSON_VIAL] = [
      JSON.stringify(vial1),
      JSON.stringify(vial2)
    ]
    server.send(message)

    expect(stateHolder.UpdateMaps).toBeCalledWith(
      [DATABASE_ACTIVITY_ORDER, DATABASE_VIAL],
      [[activityOrder1, activityOrder2, activityOrder3], [vial1, vial2]],
      ["oid", "ID"],
      [true, true],
      [[],[]],
    );

    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Received websocket reject free activity order", async () => {
    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_FREE_ACTIVITY;
    message[JSON_ACTIVITY_ORDER] = []
    message[AUTH_IS_AUTHENTICATED] = false
    message[JSON_VIAL] = []
    server.send(message)

    expect(stateHolder.UpdateMaps).not.toBeCalled();

    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Received websocket free injection order", () => {
    const injectionOrder1 = {
      oid : 1,
      data : "data",
    }
    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_FREE_INJECTION;
    message[JSON_INJECTION_ORDER] = JSON.stringify(injectionOrder1)
    message[AUTH_IS_AUTHENTICATED] = true

    server.send(message);
    expect(stateHolder.UpdateMap).toBeCalledWith(JSON_INJECTION_ORDER, [injectionOrder1], 'oid', true, []);
    expect(stateHolder.setError).not.toBeCalled();

  });

  it("Received websocket free injection order", () => {
    const injectionOrder1 = {
      oid : 1,
      data : "data",
    }
    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_FREE_INJECTION;
    message[JSON_INJECTION_ORDER] = JSON.stringify(injectionOrder1)
    message[AUTH_IS_AUTHENTICATED] = false

    server.send(message);
    expect(stateHolder.UpdateMap).not.toBeCalled();
    expect(stateHolder.setError).not.toBeCalled();
  });

  it("Received websocket delete data class", async () => {
    const data = {
      id : 1,
      data : "data",
    }
    const dataID = "id";
    const message = {};
    message[WEBSOCKET_MESSAGE_SUCCESS] = WEBSOCKET_MESSAGE_SUCCESS;
    message[WEBSOCKET_MESSAGE_ID] = 42069420;
    message[WEBSOCKET_MESSAGE_TYPE] = WEBSOCKET_MESSAGE_DELETE_DATA_CLASS;
    message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;
    message[WEBSOCKET_DATA] = data;
    message[WEBSOCKET_DATA_ID] = dataID;
    server.send(message);

    expect(stateHolder.UpdateMap).toBeCalledWith(
      JSON_ACTIVITY_ORDER, [], dataID, true, [1]
    );
  });

  it("Websocket send empty message", async () => {
    const message = {};
    websocket.send({});
    // To avoid flaky tests, this test doesn't assert as the message doesn't contain any message id
  });

  it("Websocket send skeleton message", async () => {
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



})