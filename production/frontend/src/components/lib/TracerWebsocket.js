export class TracerWebSocket extends WebSocket {
  constructor(path, parent){
    super(path)
    this.table = parent

    this.onmessage = function(e) {
      const data = JSON.parse(e.data);
      const MessageDate = new Date(data["date"]);
      console.log(data);
      switch(data["messageType"]) {
        case "AcceptOrder":
          const oid = data["oid"];
          this.table.AcceptOrderIncoming(oid, MessageDate);
          break;
        case "ChangeRun":
          this.table.ChangeRunIncoming(MessageDate, data["UpdatedOrders"]);
          break;
        case "CreateVial":
          this.table.recieveVial(data["vial"]);
          break;
        case "EditVial":
          this.table.recieveVial(data["vial"]);
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
}
