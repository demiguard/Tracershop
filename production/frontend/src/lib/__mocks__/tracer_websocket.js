import { jest } from '@jest/globals'
import { SUCCESS_STATUS_CRUD, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_TYPE } from '../shared_constants.js';
import { bookings } from '~/tests/test_state/bookings.js';

const tracer_websocket = jest.createMockFromModule('../tracer_websocket.js');

const TracerWebSocket = jest.fn();
TracerWebSocket.getMessage = jest.fn((kw) => {return {[WEBSOCKET_MESSAGE_TYPE] : kw}});
TracerWebSocket.send = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendEditModel = jest.fn((message) => new Promise(async function(resolve) {resolve({
  [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS
})}));
TracerWebSocket.sendCreateModel = jest.fn((message) => new Promise(async function(resolve) {resolve({
  [WEBSOCKET_MESSAGE_STATUS] : SUCCESS_STATUS_CRUD.SUCCESS
})}));
TracerWebSocket.sendDeleteModel = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendChangePassword = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendCreateExternalUser = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendGetBookings = jest.fn((message) => new Promise(async function(resolve) {resolve({
  [WEBSOCKET_DATA] : []
})}))

module.exports = { TracerWebSocket }
