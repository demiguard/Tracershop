/**
 * @jest-environment jsdom
 */
import WS from "jest-websocket-mock"
import { AUTH_IS_AUTHENTICATED, JAVASCRIPT_VERSION, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,
  WEBSOCKET_DATA_ID, WEBSOCKET_JAVASCRIPT_VERSION, WEBSOCKET_MESSAGE_ECHO,
  WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_MODEL_CREATE,
  WEBSOCKET_MESSAGE_MODEL_DELETE, WEBSOCKET_MESSAGE_MODEL_EDIT,
  WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_UPDATE_STATE,
  WEBSOCKET_REFRESH
 } from "~/lib/shared_constants.js"
import { TracerWebSocket } from "~/lib/tracer_websocket.js";
import { MessageChannel } from 'node:worker_threads'

let server = null;
let websocket = null;
let dispatch = jest.fn()



beforeEach(async () => {
  window.MessageChannel = MessageChannel
  server = new WS("ws://localhost:1234", {jsonProtocol : true});
  websocket = new TracerWebSocket(new WebSocket("ws://localhost:1234"), dispatch);
  await server.connected;
})

afterEach(() =>{
  server.close();
  WS.clean();
  dispatch.mockClear();
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

    const message = {
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_UPDATE_STATE,
      [WEBSOCKET_REFRESH] : refresh,
      [WEBSOCKET_DATA] : data,
    }
    server.send(message);

    expect(dispatch).toBeCalled();
  });

  it("Handle Free order message", () => {
    const data = {}
    const refresh = true

    const message = {
      [AUTH_IS_AUTHENTICATED] : true,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
      [WEBSOCKET_REFRESH] : refresh,
      [WEBSOCKET_DATA] : data,
    }
    server.send(message);

    expect(dispatch).toBeCalled();
  });

  it("Failed to Free order", () => {
    const data = {}
    const refresh = true

    const message = {

      [AUTH_IS_AUTHENTICATED] : false,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
      [WEBSOCKET_REFRESH] : refresh,
      [WEBSOCKET_DATA] : data,
    }
    server.send(message);

    expect(dispatch).not.toBeCalled();
  });

  it("Handle delete message", () => {
    const datatype = "datatype"
    const ids = [1,2,3,4,5];

    const message = {
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_DELETE,
      [WEBSOCKET_DATATYPE] : datatype,
      [WEBSOCKET_DATA_ID] : ids,
    }

    server.send(message)

    expect(dispatch).toBeCalled()
  })


  it("Websocket send empty message", () => {
    websocket.send({});
    // To avoid flaky tests, this test doesn't assert as the message doesn't contain any message id
  });

  it("Websocket send skeleton message", () => {
    const message = {
      [WEBSOCKET_MESSAGE_ID] : 69420690,
      [WEBSOCKET_JAVASCRIPT_VERSION] : JAVASCRIPT_VERSION,

    };
    websocket.send(message);

    expect(server).toReceiveMessage(message)
    // To avoid flaky tests, this test doesn't assert as the message doesn't contain any message id
  });


  it("Websocket respond skeleton message", async () => {
    const message = {
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_ECHO,
      [WEBSOCKET_MESSAGE_ID] : 6942069,
      [WEBSOCKET_JAVASCRIPT_VERSION] : JAVASCRIPT_VERSION,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
    };
    const promise = websocket.send(message);

    expect(server).toReceiveMessage(message);
    server.send(message);
    await expect(promise).resolves.toEqual(message);
  });

  // send Methods
  it("Send method - edit model",  () => {
    const dataType = "dataType";
    const data = [{id : 1, data: "foo bar"}];
    websocket.sendEditModel(dataType, data);

    const expectedMessage = {
      [WEBSOCKET_DATATYPE] : dataType,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_EDIT,
      [WEBSOCKET_DATA] : data,
    };
    expect(server).toReceiveMessage(expect.objectContaining(expectedMessage));
  })

  it("Send method - create model",  () => {
    const dataType = "dataType";
    const data = [{id : 1, data: "foo bar"}];
    websocket.sendCreateModel(dataType, [{id : 1, data: "foo bar"}]);

    const expectedMessage = {
      [WEBSOCKET_DATATYPE] : dataType,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_CREATE,
      [WEBSOCKET_DATA] : data,
    }

    expect(server).toReceiveMessage(expect.objectContaining(expectedMessage))
  })

})