import { jest } from '@jest/globals'
import { WEBSOCKET_MESSAGE_TYPE } from '../shared_constants.js';

const tracer_websocket = jest.createMockFromModule('../tracer_websocket.js');


const TracerWebSocket = jest.fn();
TracerWebSocket.getMessage = jest.fn((kw) => {return {[WEBSOCKET_MESSAGE_TYPE] : kw}});
TracerWebSocket.send = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendEditModel = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendCreateModel = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendDeleteModel = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendChangePassword = jest.fn((message) => new Promise(async function(resolve) {resolve()}));
TracerWebSocket.sendCreateExternalUser = jest.fn((message) => new Promise(async function(resolve) {resolve()}));

module.exports = { TracerWebSocket }
