import { jest } from '@jest/globals'


const tracer_websocket = jest.createMockFromModule('../tracer_websocket.js')

const mockGetMessage = jest.fn((kw) => {
  return {
    messageType : kw
  }
})
const mockSend = jest.fn((data) => {
  return new Promise((data) => {return data})
});

tracer_websocket.TracerWebSocket.mockImplementation(() =>  {
  const object = Object.create(tracer_websocket.TracerWebSocket.prototype);

  return Object.assign(object, {
    send : mockSend,
    getMessage : mockGetMessage
  });
})

module.exports = tracer_websocket
