import { WEBSOCKET_MESSAGE_TYPE } from "./constants";
import { TracerWebSocket } from "./tracer_websocket";


export { ImitatedTracerWebsocket }

class ImitatedTracerWebsocket extends TracerWebSocket {
  constructor(parent) {
    this.StateHolder = parent
  }

  send(message){
    console.log(message);
  }
}