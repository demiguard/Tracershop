
import { CalenderFactory } from "./libs/calender.js";
import { CustomerSelect } from "./libs/customerSelect.js";
import { createElement } from "./libs/htmlHelpers.js";

var CalenderInstance;
var CustomerSelectInstance;


function ResetBooking() {
  const TD  = $(this).parent()
  const Row = $(TD).parent() // Image -> Image TD -> Order Row
  const AccessionNumberTD = Row.children(".accessionNumber")
  const accessionNumber = AccessionNumberTD.text();

  $.ajax({
    url      : "api/REST/Booking",
    type     : "put",
    datatype :"json",
    data     : JSON.stringify({
      "filter" : {
        "accessionNumber" : accessionNumber
      },
      "update" : {
        "status" : 0
      }
    }),
    success : function(data) {
      //Update the icon
      TD.empty();
      TD.addClass('checkbox')
      const checkbox = $("<input>", {
        id : accessionNumber,
        type : "checkbox",
        checked : ""
      });
      checkbox.appendTo(TD);
    }
  })

}


const ShowHideData = function () {
  if (this.value == "Vis data") {
    this.value = "Gem data";
    var tableID = "#" + this.id.substring(0,1) + "-div"
    var dataTable = $(tableID);
    dataTable.removeClass("hidden");
  } else if (this.value == "Gem data") {
    this.value = "Vis data";
    var tableID = "#" + this.id.substring(0,1) + "-div"
    var dataTable = $(tableID);
    dataTable.addClass("hidden");
  }
}

const MassOrder = function() {
  const ErrorDiv = $('#ErrorDiv');
  ErrorDiv.removeClass("ErrorBox");
  ErrorDiv.empty();
  const id = this.id.substring(0,1);
  const tbody = $("#"+id+"-tbody")[0];
  const tracerStrong = $('#'+id+"-tracer")[0];
  const tracer = tracerStrong.innerHTML;
  const studies = {};
  for (const tableRow of $(tbody).children()) {
    const checkboxTD = $(tableRow).children(".checkbox");
    if (checkboxTD.length == 0) {
      continue;
    }
    const checkbox = $(checkboxTD[0]).children()[0];
    const checkboxID = checkbox.id;
    const checkboxChecked = $(checkbox).prop("checked");
    const study = {
      checked : checkboxChecked,
    }
    if (tracer == "FDG"){
      const selectTD = $(tableRow).children(".run")[0];
      const select = $(selectTD).children(".run")[0];
      study["run"] = $(select).val();
    }
    studies[checkboxID] = study
  }

  const customer = CustomerSelectInstance.getValue();


  $.post({
      url:"api/MassAddOrder",
      data: JSON.stringify({
        "tracer" : tracer,
        "studies" : studies,
        "customer" : customer,
      }),
      success : function(data) {
        if(data['Success'] == 'Success'){
          for (const tableRow of $(tbody).children()) {
            const checkboxTD = $(tableRow).children(".checkbox");
            if (checkboxTD.length == 0) {
              continue;
            }
            const checkbox = $(checkboxTD[0]).children()[0];
            const checkboxChecked = $(checkbox).prop("checked");
            // Change Icons
            $(checkboxTD[0]).empty();
            $(checkboxTD[0]).removeClass('checkbox')
            if (checkboxChecked) {
              const image   = $("<img>", {
                src: "/static/customer/images/check.svg",
                class: "ResetOrder"
              });
              image.click(ResetBooking);
              image.appendTo(checkboxTD)
            } else {
              const image   = $("<img>", {
                src: "/static/customer/images/x-circle-fill.svg",
                class: "ResetOrder"
              });
              image.click(ResetBooking)
              image.appendTo(checkboxTD[0])
            }
          }
        } else if (data['Success'] == 'lateOrdering') {
          const ErrorDiv = $('#ErrorDiv');
          ErrorDiv.addClass("ErrorBox");
          const p = $('<p>');
          p.append("Du kan ikke bestille FDG efter kl 13:00 dagen før.");
          ErrorDiv.append(p);
        }
      },
      error : function(data) {

      }
    });


}

var dateColoringFunction = function(div, date, directory) {

}

var change_date = function (dateDiv, newDate) {
  CalenderInstance.SetActiveDate(newDate);
  today = newDate;
  var currToday = $(".today");
  currToday.removeClass('today');
  dateDiv.classList.add('today');
};



var DateOnClick = function(div, date) {
  var jqDiv = $(div)
  jqDiv.on('click', function() {
    change_date(div, date);
    ClearTable();
    ChangeTable(date);
    let NewDateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    $("#DateStrong").text(NewDateString);
  });
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
    var TracerNumber = 0;
    var CanOrder = false;


    for (const [Tracer, Studies] of Object.entries(data['bookings'])) {
      const TracerDiv      = createElement(DataDiv,'','','div',["TracerDiv","row", "col-12"]);
      const OverViewDiv    = createElement(TracerDiv, '', '','div',["col-12", "overViewDiv"]);
      const ShowHideButton = $('<input>', {
        id: String(TracerNumber) + "-button",
        type: "button",
        value: "Vis data"
      });
      ShowHideButton.addClass("btn");
      ShowHideButton.addClass("btn-info");
      ShowHideButton.addClass("tableButton");
      ShowHideButton.on('click', ShowHideData);
      ShowHideButton.appendTo(OverViewDiv);
      createElement(OverViewDiv, Tracer, String(TracerNumber)+'-tracer', 'strong', [])
      const HidingDiv = createElement(TracerDiv, '', String(TracerNumber)+"-div", "div", ["hidden"]);
      // Create the Table
      const DataTable = createElement(HidingDiv,'', String(TracerNumber)+"-table","table", ["datatable", "table"])
      const TableHead = createElement(DataTable,'','','thead',[]);
      const TableHeadRow = createElement(TableHead, '', '', 'tr',[]);
      createElement(TableHeadRow,'Accession Number','','th',[]);
      createElement(TableHeadRow,'Study Description','','th',[]);
      createElement(TableHeadRow,'Booking tidspunkt','','th',[]);
      createElement(TableHeadRow,'Injektions Tidspunkt','','th',[]);
      createElement(TableHeadRow, 'Location','', "th", []);
      if (Tracer == "FDG"){
        createElement(TableHeadRow,'Kørsel','',"th",[]);
      }
      createElement(TableHeadRow,'','',"th",[]);
      // Create the Table body
      const TableBody = createElement(DataTable, '', String(TracerNumber)+"-tbody", 'tbody', []);
      for (const study of Studies) {
        const StudyRow = createElement(TableBody, '','','tr',[]);
        createElement(StudyRow,study.accessionNumber , '','td',["accessionNumber"]);
        createElement(StudyRow,study.procedure , '','td',[]);
        createElement(StudyRow,study.studyTime , '','td',[]);
        createElement(StudyRow,study.injectionTime ,'','td',[]);
        createElement(StudyRow,study.location, '', 'td', []);
        if (Tracer == "FDG"){
          const runTD = createElement(StudyRow,'', '', 'td', ["run"]);
          const Select = $("<select>");
          for(const deliverTime of data['deliverTimes'].sort(
              (a,b) => (a.dtime < b.dtime) ? 1 : -1)){
            if(study.injectionTime >= deliverTime.dtime){
              const option = $("<option>",{
                value : deliverTime.dtime.substring(0,5)
              });
              option.text(deliverTime.dtime.substring(0,5))
              Select.append(option);
            }
            Select.addClass("run")
          }
          $(runTD).append(Select);
        }
        if (study.status == 0) {
          CanOrder = true;
          const checkboxTD = createElement(StudyRow,'', '', "td", ["checkbox"]);
          const checkbox = $("<input>", {
            id : study.accessionNumber,
            type : "checkbox",
            checked : ""
          })
          checkbox.appendTo(checkboxTD)
        } else if (study.status == 1) {
          const imageTD = createElement(StudyRow,'', '', "td", []);
          const image   = $("<img>", {
            src: "/static/customer/images/x-circle-fill.svg",
            class: "ResetOrder"
          });
          image.click(ResetBooking);
          image.appendTo(imageTD);
        } else if (study.status == 2) {
          const imageTD = createElement(StudyRow,'', '', "td", []);
          const image   = $("<img>", {
            src: "/static/customer/images/check.svg",
            class: "ResetOrder"
          });
          image.click(ResetBooking);
          image.appendTo(imageTD);

        } else {
          console.log("Unknown Status:" + String(study.Status))
        };

      }

      if (CanOrder && Tracer != "None") {
        const OrderButtonFlexRow = createElement(HidingDiv, '','',"div",["d-flex", "flex-row-reverse", "col-12"]);
        const OrderButtonDiv     = createElement(OrderButtonFlexRow,'','',"div",["p-2"]);
        const OrderButton        = $('<input>', {
          id: String(TracerNumber) + "-orderButton",
          type : "button",
          value : "Bestil"
        });
        OrderButton.addClass("orderbutton");
        OrderButton.addClass("btn");
        OrderButton.addClass("btn-outline-secondary");
        OrderButton.appendTo(OrderButtonDiv);
        OrderButton.on("click", MassOrder)
      }
      TracerNumber++;
    }
    const buttons = $(".tableButton");
    if (buttons.length != 0){
      buttons[0].click();
    }
  });
};


$(function() {
  const buttons = $(".tableButton");
  for (const activeButton of buttons) {
    $(activeButton).on('click', ShowHideData)
  };
  if (buttons.length != 0){
    buttons[0].click();
  }

  const FilledOrders = $(".ResetOrder")
  for (const FilledOrder of FilledOrders) {
    $(FilledOrder).on("click", ResetBooking)
  }

  const OrderButtons = $(".orderButton");
  for (const orderButton of OrderButtons) {
    $(orderButton).on("click", MassOrder)
  }

  var Ztoday = new Date(today.getYear()+1900, today.getMonth(),today.getDate())


  CalenderInstance = new CalenderFactory(
    'calender',
    Ztoday,
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
