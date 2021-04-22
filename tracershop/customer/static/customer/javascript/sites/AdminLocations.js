
function updateLocationName() {
  const LocationID      = this.id.substr(6)
  const newLocationName = $(this).val();

  $.ajax({
    type:"put",
    url:"/api/REST/Location",
    datatype:"json",
    data:JSON.stringify({
      filter:{
        location: LocationID
      },
      update:{
        LocName : newLocationName
      }
    }),
    success: function(data){
      //console.log("Success")
    }
  })
}

function updateConnectedCustomer() {
  const id = this.id.substr(7);
  const newSelect = $(this).children("option:selected").val()
  $.ajax({
    type:"put",
    url:"/api/REST/Location",
    datatype:"json",
    data:JSON.stringify({
      filter: {
        location : id
      },
      update: {
        AssignedTo : newSelect
      }
    }),
    success: function(data) {
      console.log(data)
    }
  })
}



$(function (){
  $('.LocationNameInput').keyup(updateLocationName)
  $('.AssignedToInput').change(updateConnectedCustomer)

});