
function AddLocation(){
  const NewLocationTitle    = $("#NewLocation").val();
  const NewLocationName     = $("#NewLocationName").val();
  const NewLocationCustomer = $("#NewLocationCustomer").val();

  if (!NewLocationTitle) return;


  $.ajax({
    type:"post",
    url:"/api/REST/Location",
    datatype:"json",
    data:JSON.stringify({
      location   : NewLocationTitle,
      LocName    : NewLocationName,
      AssignedTo : NewLocationCustomer
    }),
    success:function(data){
      if (data["Success"] != "Success") { return; }
      
      // Clean Old input
      $("#NewLocation").val("");
      $("#NewLocationName").val("");

      // Prepare a new Fields
      const NameInput = $("<input>", {
        id: "input-"+NewLocationTitle,
        class: "LocationNameInput",
        type: "text",
        name: "LocName",
        value: NewLocationName,
        maxlength:"32", 
        required: ""
      });
      NameInput.keyup(updateLocationName);

      const CustomerSelect = $("#NewLocationCustomer").clone()
      CustomerSelect.attr({
        id: "select-" + NewLocationTitle,
        class: "AssignedToInput", 
        name: "AssignedTo",
        required: ""
      });
      CustomerSelect.val(NewLocationCustomer).change()
      CustomerSelect.change(updateConnectedCustomer);

      // Prepare new Row and remove old row for reordering purposes.
      const NewLocationRowCopy = $("#NewLocationRow").clone(); 
      $("#NewLocationRow").remove();
      const dataRow    =  $("<tr>");
      const locationTD = $("<td>").text(NewLocationTitle).appendTo(dataRow);
      const NameTD     = $("<td>").append(NameInput).appendTo(dataRow);
      const CustomerTD = $("<td>").append(CustomerSelect).appendTo(dataRow);

      $("#LocationBody").append(dataRow);
      $("#LocationBody").append(NewLocationRowCopy);
    }
  });
}


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
  $('#SubmitLocation').click(AddLocation)
  $('.LocationNameInput').keyup(updateLocationName);
  $('.AssignedToInput').change(updateConnectedCustomer);
  $('.CB_is_REGH').click(updateIsREGH);
  $('.CB_DAC').click(updateDAC);
});