import { jest } from '@jest/globals'
import { WEBSOCKET_MESSAGE_TYPE } from '../shared_constants';

const tracer_websocket = jest.createMockFromModule('../tracer_websocket.js');


const TracerWebSocket = jest.fn();
TracerWebSocket.getMessage = jest.fn((kw) => {return {[WEBSOCKET_MESSAGE_TYPE] : kw}});
TracerWebSocket.send = jest.fn();
TracerWebSocket.sendEditModel = jest.fn();
TracerWebSocket.sendCreateModel = jest.fn();
TracerWebSocket.sendDeleteModel = jest.fn();
TracerWebSocket.sendCreateActivityOrder = jest.fn();
TracerWebSocket.sendCreateInjectionOrder = jest.fn();
TracerWebSocket.sendChangePassword = jest.fn();
TracerWebSocket.sendCreateExternalUser = jest.fn();

module.exports = { TracerWebSocket }
