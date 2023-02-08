import { jest } from '@jest/globals'


const tracer_websocket = jest.createMockFromModule('../tracer_websocket.js')

const mockGetMessage = jest.fn((kw) => {
  return {
    messageType : kw
  }
})
const mockSend = jest.fn((data) => {});

tracer_websocket.TracerWebSocket.mockImplementation(() =>  {return {
    send : mockSend,
    getMessage : mockGetMessage
  }
})

module.exports = tracer_websocket
