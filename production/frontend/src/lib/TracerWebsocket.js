import {
  WEBSOCKET_MESSAGETYPE, WEBSOCKET_MESSAGE_CREATE_VIAL,
  WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GREAT_STATE, JSON_GREAT_STATE, WEBSOCKET_DATA_DEAD_ORDERS, WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_MESSAGE_EDIT_TRACER, WEBSOCKET_DATA_TRACER, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_DATA_T_ORDERS, WEBSOCKET_DATA_VIALS,
  JSON_INJECTION_ORDERS, JSON_ACTIVITY_ORDER,

  JSON_VIALS} from "./constants";
import { ParseJSONstr } from "./formatting";

export { safeSend, TracerWebSocket}

class TracerWebSocket extends WebSocket {
  constructor(path, parent){
    super(path)
    this.StateHolder = parent

    // Note that websockets works syncronized, and the callback is fucked.
    // I think it's because I define a onmessage function in the websocket
    // This means that you can't add an function argument
    // Jesus javascript, this is stupid

    // So there's one way I get around this, by injecting this class with the parents class
    // This means that the program have access to the state of the program but not any smaller sites
    // Such effect means that It should cause a site wide change for all users connected.
    this.onmessage = function(e) {

      const data = JSON.parse(e.data);
      console.log(data)
      switch(data[WEBSOCKET_MESSAGETYPE]) {
        /*
        * YEEEAH some really bad code ahead with double parsing: TODO: TODO: !IMPORTANT
        * Hours Spend fixing this: 3
        * So Here are the efforts so far. The problem lies in the fact that:
        * That default python json encoder doesn't handle objects every well.
        * Now I did extrend a python json encoder such that it works,
        * The encoder is called when you send data from server to Client.
          * Only problem is that not how websocket is set up.
          * It goes like this: Server -> Redis DB -> Server -> Client.
          * The problem is that redis is a string based so it needs a json encoding of the objects.
          * AND here it uses the default python json encoder.
          * So the fix to this is to create new type of channel layer that have a custom JSON encoder.
          *
        * Additional programmer note: Create a new namespace for each handled case.
        */

        case WEBSOCKET_MESSAGE_CREATE_VIAL: //Merge to UpdateVial
          const NewVial = ParseJSONstr(data[JSON_VIALS]);
          this.StateHolder.UpdateMap(JSON_VIALS, [NewVial], data[WEBSOCKET_DATA_ID], true, []);
          break;
        case WEBSOCKET_MESSAGE_GREAT_STATE:
          this.StateHolder.updateGreatState(
            data[JSON_GREAT_STATE]
          );
          break;
        case WEBSOCKET_MESSAGE_MOVE_ORDERS:
          {  // There's A double state change with this
            const ActivityOrders = [];
            for (const OrderStr of data[JSON_ACTIVITY_ORDER]) {
              ActivityOrders.push(ParseJSONstr(OrderStr));
            }
            this.StateHolder.UpdateMap("orders", ActivityOrders, "oid", true, data[WEBSOCKET_DATA_DEAD_ORDERS]);
          }
          break;
        case WEBSOCKET_MESSAGE_GET_ORDERS:
          { // ensure Namespace is clean
            const ActivityOrders = [];
            const InjectionOrders = [];
            const Vials = [];
            for(const ActivityStr of data[JSON_ACTIVITY_ORDER]){
              ActivityOrders.push(ParseJSONstr(ActivityStr));
            }
            for(const injectionStr of data[JSON_INJECTION_ORDERS]){
              InjectionOrders.push(ParseJSONstr(injectionStr));
            }
            for(const VialStr of data[JSON_VIALS]){
              Vials.push(ParseJSONstr(VialStr));
            }
            this.StateHolder.UpdateMap("orders", ActivityOrders, "oid", false, []);
            this.StateHolder.UpdateMap("t_orders", InjectionOrders, "oid", false, []);
            this.StateHolder.UpdateMap("vials", Vials, "id", true, []);
          }
        break;
        case WEBSCOKET_MESSAGE_EDIT_STATE:
        {
          const Objects = [];
          for(const ObjectStr of data[WEBSOCKET_DATA]){
            Objects.push(ParseJSONstr(ObjectStr));
          }
          this.StateHolder.UpdateMap(data[WEBSOCKET_DATATYPE], Objects, data[WEBSOCKET_DATA_ID], true, []);
        }
        break;
      }
    }

    this.onclose = function(e) {
      //console.log("Websocket closed! with code:" + e.code)
      //console.log(e.reason)
    }

    this.onerror = function(err) {
      console.error("Socket encounter error: ", err.message);
      ws.close();
    }

  }

  /**
   *
   * @param {Date} date
   * @param {String} messagetype - a WEBSOCKET_MESSAGE_* constants
   * @returns {Object} on json format, still need to add the data for the message
   */
  getDefaultMessage(date, messagetype) {
    const jsonData = {};
    jsonData[WEBSOCKET_DATE] = date;
    jsonData[WEBSOCKET_MESSAGETYPE] = messagetype;
    return jsonData;
  }

  getMessage(messagetype) {
    const jsonData = {};
    jsonData[WEBSOCKET_MESSAGETYPE] = messagetype;
    return jsonData;
  }

  sendObejct(message){
    this.send(JSON.stringify(message));
  }
}


async function safeSend(message, websocket){
  var iter = 0;
  var readyState = websocket.readyState;
  while(iter < 10 && readyState === 0){
    await new Promise(r => setTimeout(r, 100));
    readyState = websocket.readyState
  }
  if(websocket.readyState === 1 ){
    websocket.send(JSON.stringify(message));
  } else {
    console.log("Websocket died while sending a message")
  }
}