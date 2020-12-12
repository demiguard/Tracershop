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

$(function() {
  $("#updateButton").on('click', update);
});
