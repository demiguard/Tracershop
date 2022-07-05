import { DATABASE_ACTIVITY_ORDER, DATABASE_INJECTION_ORDER, DATABASE_VIAL, WEBSOCKET_MESSAGE_FREE_ORDER,
  WEBSOCKET_MESSAGE_TYPE,
  WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GREAT_STATE, JSON_GREAT_STATE,
  WEBSOCKET_DEAD_ORDERS, WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_MESSAGE_GET_ORDERS,
  JSON_INJECTION_ORDER, JSON_ACTIVITY_ORDER, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_DATA_ID,
  JSON_VIAL, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE,
} from "/src/lib/constants";
import { ParseJSONstr } from "/src/lib/formatting";

export { safeSend, TracerWebSocket}

class TracerWebSocket extends WebSocket {
  constructor(path, parent){
    super(path)
    this.StateHolder = parent


    /** This function is called, when a message is received through the websocket from the server.
     *  This function handles all the different messages.
     *  Therefore it's basicly a big switch statement on each message type
     *
     * Note that websockets works syncronized, and the callback is fucked.
     * I think it's because I define a onmessage function in the websocket
     * This means that you can't add an function argument
     * Jesus javascript, this is stupid
     * So there's one way I get around this, by injecting this class with the parents class
     * This means that the program have access to the state of the program but not any smaller sites
     * Such effect means that It should cause a site wide change for all users connected.
     *
     * @param {*} e - Message that is received
     */
    this.onmessage = function(e) {


      const data = JSON.parse(e.data);
      console.log(data)
      switch(data[WEBSOCKET_MESSAGE_TYPE]) {
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
        * Additional programmer note: Create a new namespace for each handled case : using {}
        */

        case WEBSOCKET_MESSAGE_CREATE_DATA_CLASS: //Merge to UpdateVial
          {
            const object_id = data[WEBSOCKET_DATA_ID];
            var data_class = ParseJSONstr(data[WEBSOCKET_DATA]);
            this.StateHolder.UpdateMap(data[WEBSOCKET_DATATYPE], [data_class], object_id, true, [])
          }
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
            this.StateHolder.UpdateMap(DATABASE_ACTIVITY_ORDER, ActivityOrders, "oid", true, data[WEBSOCKET_DEAD_ORDERS]);
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
            for(const injectionStr of data[JSON_INJECTION_ORDER]){
              InjectionOrders.push(ParseJSONstr(injectionStr));
            }
            for(const VialStr of data[JSON_VIAL]){
              Vials.push(ParseJSONstr(VialStr));
            }
            this.StateHolder.UpdateMap(DATABASE_ACTIVITY_ORDER, ActivityOrders, "oid", false, []);
            this.StateHolder.UpdateMap(DATABASE_INJECTION_ORDER, InjectionOrders, "oid", false, []);
            this.StateHolder.UpdateMap(DATABASE_VIAL, Vials, "ID", true, []);
          }
        break;
        case WEBSOCKET_MESSAGE_EDIT_STATE:
          this.StateHolder.UpdateMap(data[WEBSOCKET_DATATYPE], [ParseJSONstr(data[WEBSOCKET_DATA])], data[WEBSOCKET_DATA_ID], true, []);
          break;
        case WEBSOCKET_MESSAGE_FREE_ORDER:
        {
          const ActivityOrders = [];
          for(const ActivityStr of data[JSON_ACTIVITY_ORDER]){
            ActivityOrders.push(ParseJSONstr(ActivityStr));
          }
          const Vials = [];
          for(const VialStr of data[JSON_VIAL]){
            Vials.push(ParseJSONstr(VialStr));
          }
          this.StateHolder.UpdateMap(DATABASE_ACTIVITY_ORDER,
                                     ActivityOrders, "oid", true, []);
          this.StateHolder.UpdateMap(DATABASE_VIAL, Vials, "ID", true, []);
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

  /** Creates a message object, that latter can be send by the websocket
   *
   * @param {String} messagetype - a WEBSOCKET_MESSAGE_* constants
   * @returns {Object} on json format, still need to add the data for the message
   */
  getMessage(messagetype) {
    const jsonData = {};
    jsonData[WEBSOCKET_MESSAGE_TYPE] = messagetype;
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