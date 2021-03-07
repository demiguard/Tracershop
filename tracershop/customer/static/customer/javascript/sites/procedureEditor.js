import { createElement, dropChildern } from './libs/htmlHelpers.js' ;

const update = function () {
  var formList = {};
  const TABLEBODY = $("#tableBody")[0]; 
  const CHILDREN = Array.from(TABLEBODY.children)
  CHILDREN.forEach(function (procedureRow) {
    let title  = $(procedureRow).children(".titleData")[0].childNodes[0].value;
    let dosis  = $(procedureRow).children(".dosisData")[0].childNodes[0].value;
    let delay  = $(procedureRow).children(".delayData")[0].childNodes[0].value;
    let tracer = $(procedureRow).children(".traceData")[0].childNodes[0].value;
    let inUseCheckbox  = $($(procedureRow).children(".inUseData")[0].childNodes[0]);

    formList[title] = {
      "dosis" : dosis, 
      "delay" : delay,
      "tracer" : tracer, 
      "inUse" : inUseCheckbox.prop("checked")
    };
  });
  $.get({
    url : "api/updateProcedure",
    data :  JSON.stringify(formList),
    datatype : "JSON",
    success : function(data) {
      console.log(data["Success"])
      window.location.href = "/futureBooking"
    }
  })
};

const AcceptProcedure = function() {
  const inUse = $(this).parent();
  const row = $(this).parent().parent();
  if ($(row).children(".titleData")[0].childNodes[0].value === "") {
    console.log("Todo error message")
    return;
  }

  const data = {
    title : $(row).children(".titleData")[0].childNodes[0].value,
    dosis : $(row).children(".dosisData")[0].childNodes[0].value,
    delay : $(row).children(".delayData")[0].childNodes[0].value,
    tracer: $(row).children(".traceData")[0].childNodes[0].value
  }

  $.ajax({
    url:"api/updateProcedure",
    data: JSON.stringify(data),
    datatype: "JSON",
    type: "PUT",
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
  $("#updateButton").on('click', update);
  $("#NewButton").on('click', newProcedure);
});
