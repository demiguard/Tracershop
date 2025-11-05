/**
 * @jest-environment jsdom
 */
import WS from "jest-websocket-mock"
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME,
  JAVASCRIPT_VERSION, SUCCESS_STATUS_CRUD, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,
  WEBSOCKET_DATA_ID, WEBSOCKET_JAVASCRIPT_VERSION, WEBSOCKET_MESSAGE_AUTH_WHOAMI,
  WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD, WEBSOCKET_REFRESH,
  WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER, WEBSOCKET_MESSAGE_DELETE_STATE,
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_MODEL_CREATE,
  WEBSOCKET_MESSAGE_MODELS_EDIT, WEBSOCKET_MESSAGE_MODELS_DELETE,
  WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_SUCCESS, WEBSOCKET_MESSAGE_TYPE,
  WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE, WEBSOCKET_MESSAGE_UPDATE_STATE,
  WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_MESSAGE_READ_STATE, DATA_CUSTOMER,
  DATA_ISOTOPE,
} from "~/lib/shared_constants"
import { TracerWebSocket } from "~/lib/tracer_websocket";
import { MessageChannel } from 'node:worker_threads'
import { DeleteState, UpdateWebsocketConnectionState } from "~/lib/state_actions";
import { jest } from "@jest/globals"

let /** @type { WS } */ server = null;
let websocket = null;
let internal_ws = null

jest.mock('../../lib/utils', () => {
  return {
    getWebsocketUrl : () => "ws://localhost:1234"
  }
})


const dispatch = jest.fn()

const who_am_i_message = expect.objectContaining({
  [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_AUTH_WHOAMI
})

beforeEach(async () => {
  window.MessageChannel = MessageChannel;
  server = new WS("ws://localhost:1234", {jsonProtocol : true});
  internal_ws = new WebSocket("ws://localhost:1234");
  websocket = new TracerWebSocket(internal_ws, dispatch);
  await server.connected;
  await expect(server).toReceiveMessage(who_am_i_message);
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
      [WEBSOCKET_MESSAGE_STATUS] :  SUCCESS_STATUS_CRUD.SUCCESS,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_UPDATE_STATE,
      [WEBSOCKET_REFRESH] : refresh,
      [WEBSOCKET_DATA] : data,
    }
    server.send(message);

    expect(dispatch).toHaveBeenCalled();
  });

  it("Handle Read State message", async () => {
    server.send({
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_READ_STATE,
      [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS,
      [WEBSOCKET_MESSAGE_ID] : 2311503,
      [WEBSOCKET_REFRESH] : false,
      [WEBSOCKET_DATA] : {
        [DATA_CUSTOMER] : [
          {pk : 100, fields : {
            ordered_activity : 1000,
            delivery_date : "2023-01-23",
            status : 1,
            comment : null,
            ordered_time_slot : 1,
            moved_to_time_slot : 2,
            freed_datetime : null,
            ordered_by : 2,
            freed_by : null,
          }},
          {pk : 101, fields : {
            ordered_activity : 500,
            delivery_date : "2023-01-23",
            status : 2,
            comment : null,
            ordered_time_slot : 1,
            moved_to_time_slot : 2,
            freed_datetime : null,
            ordered_by : 2,
            freed_by : null,
          }}
        ],
        [DATA_ISOTOPE] : [],
      }
    });

    expect(dispatch).toHaveBeenCalled();
  });

  it("Handle Free order message", () => {
    const data = {}
    const refresh = true

    const message = {
      [AUTH_IS_AUTHENTICATED] : true,
      [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,
      [WEBSOCKET_REFRESH] : refresh,
      [WEBSOCKET_DATA] : data,
    }
    server.send(message);

    expect(dispatch).toHaveBeenCalled();
  });

  it("Failed to Free order", () => {
    const data = {}
    const refresh = true

    const message = {
      [AUTH_IS_AUTHENTICATED] : false,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,
      [WEBSOCKET_REFRESH] : refresh,
      [WEBSOCKET_DATA] : data,
    }
    server.send(message);

    expect(dispatch).toHaveBeenCalledWith(new UpdateWebsocketConnectionState(WebSocket.OPEN))
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("Handle delete message", () => {
    const datatype = "datatype"
    const ids = [1,2,3,4,5];

    const message = {
      [WEBSOCKET_MESSAGE_ID] : 42069420,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_DELETE_STATE,
      [WEBSOCKET_DATATYPE] : datatype,
      [WEBSOCKET_DATA_ID] : ids,
      [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.UNSPECIFIED_REJECT,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
    };

    server.send(message);

    expect(dispatch).toHaveBeenCalledWith(new UpdateWebsocketConnectionState(WebSocket.OPEN))
    expect(dispatch).toHaveBeenCalledTimes(1);
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

    //expect(server).toReceiveMessage(message)
    // To avoid flaky tests, this test doesn't assert as the message doesn't contain any message id
  });

  // send Methods
  it("Send method - edit model",  () => {
    const dataType = "dataType";
    const data = [{id : 1, data: "foo bar"}];
    websocket.sendEditModels(dataType, data);

    const expectedMessage = {
      [WEBSOCKET_DATATYPE] : dataType,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODELS_EDIT,
      [WEBSOCKET_DATA] : data,
    };
    // we send a message on creation
    //expect(server).toReceiveMessage(expect.objectContaining(expectedMessage));
  })

  it("Send method - create model", async () => {
    const dataType = "dataType";
    const data = [{id : 1, data: "foo bar"}];
    websocket.sendCreateModel(dataType, [{id : 1, data: "foo bar"}]);

    const expectedMessage = {
      [WEBSOCKET_DATATYPE] : dataType,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODEL_CREATE,
      [WEBSOCKET_DATA] : data,
    };
    // we send a message on creation
    await expect(server).toReceiveMessage(expect.objectContaining(expectedMessage));
  })

  it("Send Delete Models - id", async () => {
    const dataType = "asdf"
    websocket.sendDeleteModels(dataType, 1);

    await expect(server).toReceiveMessage(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_MODELS_DELETE,
      [WEBSOCKET_DATA_ID] : [1],
      [WEBSOCKET_DATATYPE] : dataType
    }));
  });

  it("Send Delete Models - model", async () => {
    const dataType = "asdf"
    websocket.sendDeleteModels(dataType, {id : 2});

    const received_message = await server.nextMessage

    server.send({
      [WEBSOCKET_DATA_ID] : [1],
      [WEBSOCKET_DATATYPE] : dataType,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_DELETE_STATE,
      [WEBSOCKET_MESSAGE_ID] : received_message[WEBSOCKET_MESSAGE_ID],
      [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS
    });

    expect(dispatch).toHaveBeenCalledTimes(2);
    const called_with = dispatch.mock.calls[1][0]

    expect(called_with).toBeInstanceOf(DeleteState);
  });

  it("Send Delete Models - array of models model", async () => {
    const dataType = "asdf"
    websocket.sendDeleteModels(dataType, [{id : 1}, {id : 2}, 3]);

    const received_message = await server.nextMessage

    await server.send({
      [WEBSOCKET_DATA_ID] : [1,2,3],
      [WEBSOCKET_DATATYPE] : dataType,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_DELETE_STATE,
      [WEBSOCKET_MESSAGE_ID] : received_message[WEBSOCKET_MESSAGE_ID],
      [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS,
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS
    });

    expect(dispatch).toHaveBeenCalledTimes(2);
    const called_with = dispatch.mock.calls[1][0]

    expect(called_with).toBeInstanceOf(DeleteState);
  });


  it("Send ChangePassword", async () => {
    websocket.sendChangePassword(1 , "new_password");

    expect(server).toReceiveMessage(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
      [WEBSOCKET_DATA_ID] : 1,
      [AUTH_PASSWORD] : "new_password",
    }));
  });

  it("Send CreateExternalUser", async () => {
    websocket.sendCreateExternalUser({
      username : "new_user",
      password : "new_user_password"
    });

    await expect(server).toReceiveMessage(expect.objectContaining({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,
      [WEBSOCKET_DATA] : {
        [AUTH_USERNAME] : "new_user",
        [AUTH_PASSWORD] : "new_user_password",
      },
    }));
  });

  it("Server returned an error", async () => {
    server.send({
      WEBSOCKET_MESSAGE_TYPE : "error"
    });

    expect(dispatch).toHaveBeenCalled();
  });

  it("Errors when getting a bogous message", async () => {
    const error_mock = jest.fn(() => {});

    console.error = error_mock;
    await server.send({
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
    })

    expect(error_mock).toHaveBeenCalled()
  });

  it("Errors when getting a bogous message", async () => {
    const error_mock = jest.fn(() => {});

    console.error = error_mock;
    await server.send({
      [WEBSOCKET_MESSAGE_SUCCESS] : WEBSOCKET_MESSAGE_SUCCESS,
      [WEBSOCKET_MESSAGE_TYPE] : "",
    })

    expect(error_mock).toHaveBeenCalled()
  });

  it("Closing the websocket closes the websocket", async () => {
    websocket.close();

    await server.closed
    expect(internal_ws.readyState).toBe(WebSocket.CLOSED)
  });

  it("Close a websocket then send stuff again!", async () => {
    websocket.close();
    websocket.send({ message : "hello world"})
    await server.connected;

    expect(server).toReceiveMessage(expect.objectContaining({message : "hello world"}))
  });
});
