function FieldUpdate(){
  const fieldIDArr  = this.id.split("_")
  const field       = fieldIDArr[0];
  const ProcedureID = fieldIDArr[1];
  
  switch (field) {
    case "inUse":
      const NewUse   = $(this).prop("checked");
      $.ajax({
        url:"/api/REST/Procedure",
        type:"PUT",
        datatype:"json",
        data:JSON.stringify({
          filter : {
            ID : ProcedureID
          },
          update : {
            inUse : NewUse
          }
        })
      });

      break;
    case "delay":
      const NewDelay = $(this).val();
      if (NewDelay || NewDelay === 0) {
        $.ajax({
          url:"/api/REST/Procedure",
          type:"PUT",
          datatype:"json",
          data:JSON.stringify({
            filter : {
              ID : ProcedureID
            },
            update : {
              delay : NewDelay
            }
          })
        });
      }
      break;
    case "tracer":
      var NewTracer = $(this).val();
      if (NewTracer === "") NewTracer = null;

      $.ajax({
        url:"/api/REST/Procedure",
        type:"PUT",
        datatype:"json",
        data:JSON.stringify({
          filter : {
            ID : ProcedureID
          },
          update : {
            tracer : NewTracer
          }
        })
      });
      break;
    case "baseDosis":
      const newBaseDosis = $(this).val();
      if (newBaseDosis || newBaseDosis === 0) {
        $.ajax({
          url:"/api/REST/Procedure",
          type:"PUT",
          datatype:"json",
          data:JSON.stringify({
            filter : {
              ID : ProcedureID
            },
            update : {
              baseDosis : newBaseDosis
            }
          })
        });
      }
      break;
  }
}

const AcceptProcedure = function() {
  const inUse = $(this).parent();
  const row = $(this).parent().parent();
  if ($(row).children(".titleData")[0].childNodes[0].value === "") {
    console.log("Todo error message")
    return;
  }

  const data = {
    title : $(row).children(".titleData")[0].childNodes[0].value,
    baseDosis : $(row).children(".dosisData")[0].childNodes[0].value,
    delay : $(row).children(".delayData")[0].childNodes[0].value,
    tracer: $(row).children(".traceData")[0].childNodes[0].value,
    inUse : true,
  }

  $.ajax({
    url:"api/REST/Procedure",
    data: JSON.stringify(data),
    datatype: "JSON",
    type: "POST",
    success: function(res){
      if (res['Success'] == "Success"){
        $($(row).children(".titleData")[0]).children().attr("readonly", true);
        $(inUse).empty();
        var checkbox = $('<input>', {
          id:"id_inUse",
          type:"checkbox",
          class:"form-control",
          name: "inUse",
          checked: ""
        });
        checkbox.appendTo(inUse);
      } else {
        console.log("ERROR")
      }
    }
  });

};

const DeleteProcedure = function() {
  const row = $(this).parent().parent();
  $(row).remove();
}

const newProcedure = function() {
  const table = $("#tableBody");

  var child = table.children()[0];
  var clone= $(child).clone();
  $($(clone).children(".titleData")[0]).children().attr("readonly", false);
  $($(clone).children(".titleData")[0]).children().val("");
  $($(clone).children(".dosisData")[0]).children().val("0");
  $($(clone).children(".delayData")[0]).children().val("0");
  $($(clone).children(".traceData")[0]).children().val("");
  $(clone).children(".inUseData").empty()
  var acceptButton = $("<img>", {
    "src":"/static/customer/images/accept.svg",
    "class":"StatusIcon"
  });
  acceptButton.on('click', AcceptProcedure);
  acceptButton.appendTo($(clone).children(".inUseData"));
  var rejectButton = $("<img>", {
    "src":"/static/customer/images/decline.svg",
    "class":"StatusIcon"
  });
  rejectButton.on('click', DeleteProcedure)
  rejectButton.appendTo($(clone).children(".inUseData"));
  clone.appendTo(table);
}


$(function() {
  $("#NewButton").on('click', newProcedure);
  $(".form-control").bind('input', FieldUpdate);

});
