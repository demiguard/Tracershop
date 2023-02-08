import { WEBSOCKET_MESSAGE_DELETE_DATA_CLASS, WEBSOCKET_MESSAGE_SUCCESS, DATABASE_ACTIVITY_ORDER,
  DATABASE_INJECTION_ORDER, DATABASE_VIAL, WEBSOCKET_MESSAGE_FREE_ACTIVITY,
  WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_GREAT_STATE, JSON_GREAT_STATE,
  WEBSOCKET_DEAD_ORDERS, WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_MESSAGE_GET_ORDERS,
  JSON_INJECTION_ORDER, JSON_ACTIVITY_ORDER, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_DATA_ID,
  JSON_VIAL, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_MESSAGE_ID,
  WEBSOCKET_JAVASCRIPT_VERSION, JAVASCRIPT_VERSION, WEBSOCKET_MESSAGE_FREE_INJECTION, JSON_CLOSEDDATE, DATABASE_CLOSEDDATE, } from "./constants.js";
import { MapDataName } from "./local_storage_driver.js";
import { ParseJSONstr } from "./formatting.js";

export { safeSend, TracerWebSocket }

class TracerWebSocket {
  constructor(Websocket, parent){
    this._PromiseMap = new Map();
    this._ws = Websocket;
    this.StateHolder = parent;

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
     * @param {*} messageEvent - Message that is received
     */
    this._ws.onmessage = function(messageEvent) {
      const data = JSON.parse(messageEvent.data);
      console.log(data)
      if (data[WEBSOCKET_MESSAGE_SUCCESS] != WEBSOCKET_MESSAGE_SUCCESS){
        this.StateHolder.setState({
          ...this.state,
          site_error : data[WEBSOCKET_MESSAGE_SUCCESS],
          site_error_info : ""
        });
        return;
      }
      const pipe = this._PromiseMap.get(data[WEBSOCKET_MESSAGE_ID]);
      // If this websocket isn't the author of the request, then there's no promise to update.
      // A websocket might receive a message from due to another persons update.
      if(pipe != undefined){
        pipe.port2.postMessage(data);
      }
      //None promise update
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
            const CloseDates = []
            for(const ActivityStr of data[JSON_ACTIVITY_ORDER]){
              ActivityOrders.push(ParseJSONstr(ActivityStr));
            }
            for(const injectionStr of data[JSON_INJECTION_ORDER]){
              InjectionOrders.push(ParseJSONstr(injectionStr));
            }
            for(const VialStr of data[JSON_VIAL]){
              Vials.push(ParseJSONstr(VialStr));
            }
            for(const closeDateStr of data[JSON_CLOSEDDATE]){
              CloseDates.push(ParseJSONstr(closeDateStr))
            }

            this.StateHolder.UpdateMaps(
              [DATABASE_ACTIVITY_ORDER, DATABASE_INJECTION_ORDER,
                DATABASE_VIAL, DATABASE_CLOSEDDATE],
              [ActivityOrders, InjectionOrders, Vials, CloseDates],
              ["oid", "oid", "ID", "BDID"],
              [true, true, true, true],
              [[],[],[],[]]
            )
          }
        break;
        case WEBSOCKET_MESSAGE_EDIT_STATE:
          this.StateHolder.UpdateMap(
            data[WEBSOCKET_DATATYPE],
            [ParseJSONstr(data[WEBSOCKET_DATA])],
            data[WEBSOCKET_DATA_ID],
            true,
            []
          );
          break;
        case WEBSOCKET_MESSAGE_FREE_ACTIVITY: {
          const ActivityOrders = [];
          for(const ActivityStr of data[JSON_ACTIVITY_ORDER]){
            ActivityOrders.push(ParseJSONstr(ActivityStr));
          }
          const Vials = [];
          for(const VialStr of data[JSON_VIAL]){
            Vials.push(ParseJSONstr(VialStr));
          }
          this.StateHolder.UpdateMaps(
            [DATABASE_ACTIVITY_ORDER, DATABASE_VIAL],
            [ActivityOrders, Vials],
            ["oid", "ID"]
            [true, true],
            [[],[]]
          );
        }
        break;
        case WEBSOCKET_MESSAGE_DELETE_DATA_CLASS: {
            const DataClass = data[WEBSOCKET_DATA];
            const ID = data[WEBSOCKET_DATA_ID]
            this.StateHolder.UpdateMap(
              MapDataName(data[WEBSOCKET_DATATYPE]), [], ID, true, [DataClass[ID]])
          }
        break;
        case WEBSOCKET_MESSAGE_FREE_INJECTION: {
            const UpdatedOrder = ParseJSONstr(data[JSON_INJECTION_ORDER]);
            this.StateHolder.UpdateMap(DATABASE_INJECTION_ORDER, [UpdatedOrder], 'oid', true, []);
          }
          break;
      }
    }

    this._ws.onmessage = this._ws.onmessage.bind(this)


    this._ws.onclose = function(e) {
      console.log("Websocket closed! with code:" + e.code)
      console.log(e.reason)
    }

    this._ws.onerror = function(err) {
      console.error("Socket encounter error: ", err.message);
      ws.close();
    }

  }

  /** Creates a message object, that latter can be send by the websocket
   *
   * @param {String} messageType - a WEBSOCKET_MESSAGE_* constants
   * @returns {Object} on json format, still need to add the data for the message
   */
  getMessage(messageType) {
    const message = {};
    message[WEBSOCKET_MESSAGE_TYPE] = messageType;
    return message;
  }

  send(data){
    var messageID;
    if (!data.hasOwnProperty(WEBSOCKET_MESSAGE_ID)){
        var TestID =  Math.floor(Math.random() * 2147483647);

        messageID = TestID;
        data[WEBSOCKET_MESSAGE_ID] = messageID
    } else {
        messageID = data[WEBSOCKET_MESSAGE_ID]
    }
    if (!data.hasOwnProperty(WEBSOCKET_JAVASCRIPT_VERSION)){
      data[WEBSOCKET_JAVASCRIPT_VERSION] = JAVASCRIPT_VERSION
    }

    new Promise(() => safeSend(data, this._ws));

    const promise = new Promise(async function (resolve) {
      const pipe = new MessageChannel();
      pipe.port1.onmessage = function (messageEvent) {
        resolve(messageEvent.data);
      }
      this._PromiseMap.set(messageID, pipe);
    }.bind(this));

    return promise;
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