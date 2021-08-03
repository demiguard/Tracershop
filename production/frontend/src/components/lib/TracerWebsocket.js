export class TracerWebSocket extends WebSocket {
  constructor(path, parent){
    super(path)
    this.table = parent

    this.onmessage = function(e) {
      const data = JSON.parse(e.data)
      const MessageDate = new Date(data["date"])
      this.table.updateOrders(data["newOrders"], MessageDate)
    } 


    this.onclose = function() {
      console.log("Websocket closed!")
    } 
  }
}