export class TracerWebSocket extends WebSocket {
  constructor(path, parent){
    super(path)
    this.table = parent

    this.onmessage = function(e) {
      const data = JSON.parse(e.data)
      const MessageDate = new Date(data["date"])

      switch(data["messageType"]) {
        case "AcceptOrder":
          const oid = data["oid"];
          this.table.AcceptOrderIncoming(oid, MessageDate);
          break;
      }


      
    } 


    this.onclose = function(e) {
      console.log("Websocket closed! with code:" + e.code)
      console.log(e.reason)
    } 
  }
}