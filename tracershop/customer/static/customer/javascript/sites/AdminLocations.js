
function updateLocationName() {
  const LocationID      = this.id.substr(6)
  const newLocationName = $(this).val();

  $.ajax({
    type:"put",
    url:"/api/updateLocations",

    data:JSON.stringify({
      LocationID: LocationID,
      newLocationName : newLocationName
    }),
    success: function(data){
      //console.log("Success")
    }
  })
}



$(function (){
  $('.LocationNameInput').keyup(updateLocationName)


});