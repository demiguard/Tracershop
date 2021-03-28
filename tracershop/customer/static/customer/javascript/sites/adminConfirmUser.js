function confirmUser() {
  const PuserID = this.id.split("-")[1];
  SendRequest("put", PuserID)
}

function denyUser() {
  const PuserID = this.id.split("-")[1];
  SendRequest("delete", PuserID)
}

function SendRequest(type, ID) {
  $.ajax({
    //Note that because the site is on /admin/confirmUser, 
    //The True URL that is queried is : "/admin/api/confirmUser"
    "url":"api/ConfirmUser", 
    "type":type,
    "data":JSON.stringify({
      PuserID: ID
    }),
    "success":function(data) {
      if (data["Success"] == "Success") {
        $("#Row-"+ID).remove();
      } else {        
        $("#ErrorMessageContainer").text("Fejl Besked:" + data['Success'])
      }
    },
    "error":function(data) {
      $("#ErrorMessageContainer").text("Beskeden blev ikke sendt fordi at der opstod en HTTP-fejl")
    }
  });
}


$(function() {
  $(".confirmButton").click(confirmUser)
  $(".denyButton").click(denyUser)
})