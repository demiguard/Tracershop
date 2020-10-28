
import { CalenderFactory } from "./libs/calender.js";
import { CustomerSelect } from "./libs/customerSelect.js";
import { createElement } from "./libs/htmlHelpers.js";

var CalenderInstance;
var CustomerSelectInstance;

var ShowHideData = function () {
  if (this.value == "Vis data") {
    this.value = "Gem data";
    var tableID = "#" + this.id.substring(0,1) + "-table"
    var dataTable = $(tableID);
    dataTable.removeClass("hidden");
  } else if (this.value == "Gem data") {
    this.value = "Vis data";
    var tableID = "#" + this.id.substring(0,1) + "-table"
    var dataTable = $(tableID);
    dataTable.addClass("hidden");
  }
}

var dateColoringFunction = function(div, date, directory) {

}

var DateOnClick = function(div, date) {
  var jqDiv = $(div)
  jqDiv.on('click', function() {
    ClearTable();
    ChangeTable(date);
  })
  
}

var SelectChange = function() {
  // this is the the div that got changed
  ClearTable();
  ChangeTable(today);
};


var MonthApiCall = function (year, month) {

} 

var ClearTable = function() {
  $('.TracerDiv').remove();
}


var ChangeTable = function(date) {
  //Initiation
  const DataDiv = $('#Study')[0];
  const day = String(date.getDate());
  const month = String(date.getMonth() + 1);
  const year = String(date.getFullYear());
  //Query API
  $.post({
    url: "api/FutureDaily/"+year+"/"+month+"/"+day,
    data:{"UserID" : $('#customer_select')[0].value},
    success: function (data) {return data} 
  }).then(function(data) {
    console.log(data);
    var TracerNumber = 0;
    for (const [Tracer, Studies] of Object.entries(data)) {
      const TracerDiv      = createElement(DataDiv,'','','div',["TracerDiv","row", "col-12"]);
      const PArea          = createElement(TracerDiv, '', '','p',["col-12"]);
      const ShowHideButton = $('<input>', {
        id: String(TracerNumber) + "-button",
        type: "button",
        value: "Vis data"
      });
      ShowHideButton.addClass("btn");
      ShowHideButton.addClass("btn-info");
      ShowHideButton.addClass("tableButton");
      ShowHideButton.on('click', ShowHideData);
      ShowHideButton.appendTo(PArea);
      createElement(PArea, Tracer, '', 'strong', [])
      // Create the Table
      const DataTable = createElement(TracerDiv,'', String(TracerNumber)+"-table",'table', ["datatable", "hidden"])
      const TableHead = createElement(DataTable,'','','thead',[]);
      const TableHeadRow = createElement(TableHead, '', '', 'tr',[]);
      createElement(TableHeadRow,'Accession Number','','th',[]);
      createElement(TableHeadRow,'Study Description','','th',[]);
      createElement(TableHeadRow,'Start tidspunkt','','th',[]);
      createElement(TableHeadRow,'Injektions Tidspunkt','','th',[]);
      // Create the Table body
      const TableBody = createElement(DataTable, '', '', 'tbody', []);
      for (const study of Studies) {
        const StudyRow = createElement(TableBody, '','','tr',[]);
        createElement(StudyRow,study.accessionNumber ,'','td',[]);
        createElement(StudyRow,study.procedure , '','td',[]);
        createElement(StudyRow,study.studyTime , '','td',["text-center"]);
        createElement(StudyRow,study.injectionTime ,'','td',["text-center"]);     
      }
      TracerNumber++;
    }
  });
}


$(function() { 
  var buttons = $(".tableButton");
  for ( let i = 0; i < buttons.length; i++) {
    var activeButton = $(buttons[i])
    activeButton.on('click', ShowHideData)
  };

  CalenderInstance = new CalenderFactory(
    'calender', 
    today,
    dateColoringFunction,
    DateOnClick,
    MonthApiCall,
    colorDict
    );
  CustomerSelectInstance = new CustomerSelect(
    $('#customer_select'),
    SelectChange
  );


});