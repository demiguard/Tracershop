export class SpecialTracerWebsocket extends WebSocket {
  constructor(path, parent){
    super(path)
    this.table = parent

    this.onmessage = function(e) {
      const data = JSON.parse(e.data)
      const MessageDate = new Date(data["date"])
      switch(data["messageType"]) {
        case "changeStatus":
          this.table.changeStatusIncomming(MessageDate, data["oid"], data["status"])
          break;
        
      }
    } 


    this.onclose = function(e) {
      console.log("Websocket closed! with code:" + e.code)
      console.log(e.reason)
    } 

    this.onerror = function(err) {
      console.error("Socket encounter error: ", err.message)
      ws.close();
    }
  }
}
