
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

function updateIsREGH() {
  const NewIsRegh = $(this).prop("checked");
  const CustomerID = this.id.substr(8);
  $.ajax({
    type:"put",
    url:"/api/REST/Customer",
    datatype:"json",
    data:JSON.stringify({
      filter:{
        ID: CustomerID
      },
      update:{
        is_REGH: NewIsRegh
      }
    })
  });
}

function updateDAC() {
  const NewDAC = $(this).prop("checked")
  const CustomerID = this.id.substr(4);
  $.ajax({
    type:"put",
    url:"/api/REST/Customer",
    datatype:"json",
    data:JSON.stringify({
      filter:{
        ID: CustomerID
      },
      update:{
        defualtActiveCustomer: NewDAC
      }
    })
  });
}


$(function (){
  $('.LocationNameInput').keyup(updateLocationName);
  $('.AssignedToInput').change(updateConnectedCustomer);
  $('.CB_is_REGH').click(updateIsREGH);
  $('.CB_DAC').click(updateDAC);
});