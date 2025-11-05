import { jest } from '@jest/globals'
import { DATA_BOOKING, SUCCESS_STATUS_CRUD, WEBSOCKET_DATA,
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_TYPE
} from '~/lib/shared_constants';
import { MESSAGE_READ_BOOKINGS } from '~/lib/incoming_messages';

const tracer_websocket = jest.createMockFromModule('../tracer_websocket');

const TracerWebSocket = jest.fn();
TracerWebSocket.getMessage = jest.fn((kw) => {return {[WEBSOCKET_MESSAGE_TYPE] : kw}});
TracerWebSocket.send = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendEditModels = jest.fn((message) => new Promise(async function(resolve) {resolve({
  [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS
})}));
TracerWebSocket.sendCreateModel = jest.fn((message) => new Promise(async function(resolve) {resolve({
  [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS
})}));
TracerWebSocket.sendDeleteModels = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendChangePassword = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendCreateExternalUser = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendGetBookings = jest.fn((message) => Promise.resolve(new MESSAGE_READ_BOOKINGS({
  [WEBSOCKET_MESSAGE_ID] : 69420,
  [WEBSOCKET_DATA] : {
    [DATA_BOOKING] : []
  }
})));

TracerWebSocket._listeners = new Map();

TracerWebSocket.addListener = jest.fn((func) => {
  let listenNumber = TracerWebSocket._listeners.size;

  TracerWebSocket._listeners.set(
    listenNumber, func
  );

  return listenNumber
});

TracerWebSocket.removeListener = jest.fn((listenNumber) => {
  TracerWebSocket._listeners.delete(listenNumber)
});

TracerWebSocket.triggerListeners = jest.fn((data) => {
  for(const listener of TracerWebSocket._listeners.values()){
    listener(data);
  }
})

TracerWebSocket.resetListeners = function(){
  TracerWebSocket._listeners = new Map();
}


module.exports = { TracerWebSocket }
