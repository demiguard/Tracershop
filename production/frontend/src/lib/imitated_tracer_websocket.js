import { WEBSOCKET_MESSAGE_TYPE } from "./constants";
import { TracerWebSocket } from "./tracer_websocket";


export { ImitatedTracerWebsocket }

class ImitatedTracerWebsocket extends TracerWebSocket {
  constructor(websocket, parent) {
    super(websocket, parent)
  }

  send(message){
    console.log(message);
  }
}