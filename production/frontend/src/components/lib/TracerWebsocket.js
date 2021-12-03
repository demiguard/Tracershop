import { WEBSOCKET_DATA_ORDERS, WEBSOCKET_MESSAGETYPE, WEBSOCKET_MESSAGE_CREATE_VIAL, WEBSOCKET_MESSAGE_EDIT_VIAL, WEBSOCKET_MESSAGE_UPDATEORDERS } from "./constants";
import { ParseJSONstr } from "./formatting";

export class TracerWebSocket extends WebSocket {
  constructor(path, parent){
    super(path)
    this.table = parent

    this.onmessage = function(e) {
      const data = JSON.parse(e.data);
      console.log(data)
      const MessageDate = new Date(data[WEBSOCKET_DATE]);
      switch(data[WEBSOCKET_MESSAGETYPE]) {
        case WEBSOCKET_MESSAGE_CREATE_VIAL:
          /*
           * YEEEAH some really bad code ahead with double parsing: TODO: TODO: !IMPORTANT
           * Hours Spend fixing this: 3
           * So Here are the efforts so far. The problem lies in the fact that:
           * That default python json encoder doesn't handle objects every well.
           * Now I did extrend a python json encoder such that it works,
           * The encoder is called when you send data from server to Client.
           * Only problem is that not how websocket is set up.
           * It goes like this Server -> Redis DB -> Server -> Client.
           * The problem is that redis is a string based so it needs a json encoding of the objects.
           * AND here it uses the default python json encoder.
           * So the fix to this is to create new type of channel layer that have a custom JSON encoder.
           * 
           */ 

          const NewVial = JSON.parse(ParseJSONstr(data[WEBSOCKET_DATA_VIAL])); 
          this.table.recieveVial(NewVial);
          break;
        case WEBSOCKET_MESSAGE_EDIT_VIAL:
          this.table.recieveVial(data[WEBSOCKET_DATA_VIAL]);
          break;
        case WEBSOCKET_MESSAGE_UPDATEORDERS:
          // read the comment above for why the double parsing.
          const UpdatedOrders = [];
          for (const OrderStr of data[WEBSOCKET_DATA_ORDERS]) {
            UpdatedOrders.push(JSON.parse(OrderStr));
          }
          this.table.UpdateOrderFromWebsocket(MessageDate, UpdatedOrders)
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
}
