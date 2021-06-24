import { createElement, auto_char, destroyActiveDialog } from './htmlHelpers.js' ;
import { SendEditOrder } from "./EditOrder.js"
import { Table } from './TableFactory.js';
export { createCalculator }



function confirmRow(tbody, Row, thisButton) {
  $("#CalErrDiv").empty();
  $("#CalErrDiv").removeClass("ErrorBox");
  // Check if valid inputs
  const timetd = $(Row).find(".tableTime");
  const timeStr = timetd.find(".tableField").val();
  const MBqtd = $(Row).find(".tableMBq"); 
  const MBqStr = MBqtd.find(".tableField").val();
  // Fixate inputs and change icon
  var RowTime = Row.attr("var");

  if(!validateTimeAndMBq(timeStr, MBqStr, RowTime)) {
    // Do some error message
    return;
  }
  timetd.empty();
  MBqtd.empty();
  timetd.text(timeStr)
  MBqtd.text(MBqStr);

  $(thisButton).off();
  $(thisButton).attr("src", "static/customer/images/decline.svg")
  $(thisButton).on("click", () => deleteRow(Row));
  Row.addClass("CalRow");
  // Create New row
  var tr    = $("<tr>", {var:RowTime});
  var tTimer     = $("<td>");
  var tTidspunkt = $("<td>", {class : "tableTime"});
  var tMBq       = $("<td>", {class : "tableMBq"});
  var tButton    = $("<td>");
  var timeInput = $("<input>", {class: "tableField"});
  auto_char(timeInput, ':',2);
  var amountInput = $("<input>", {class: "tableField"} );
  var confirmButton = $("<img>", {
    class: "tableButton",
    src: "/static/customer/images/accept.svg"
  });
  confirmButton.on("click", () => confirmRow(tbody, tr, confirmButton));
  tButton.append(confirmButton);
  tTidspunkt.append(timeInput);
  tMBq.append(amountInput);
  tr.append(tTimer, tTidspunkt, tMBq, tButton)
  tbody.append(tr);
};

function deleteRow(row) {
  row.remove();
};

// Validation
function betterParseInt(numStr) {
  // Holy shit the implementation of parseInt if FUCKING STUPID
  var numReg = /^\d+$/
  if (! numStr.match(numReg)) {
    return NaN;
  }
  var number = parseInt(numStr);

  return number;
}

function CreateTime(timeStr) {
  var hour = betterParseInt(timeStr.substring(0,2));
  var min  = betterParseInt(timeStr.substring(3,5));
  if (isNaN(hour) || isNaN(min)){
    return null;
  }
  if (hour > 24) {
    return null;
  }
  if (min > 60) {
    return null;
  }
  return new Date(1993,11,20, hour, min);
}

function compute(CreationTime, EndTime, MBq) {
  const halfLife = 6586.2;
  var itime = CreateTime(EndTime);
  var dtime = CreateTime(CreationTime);
  return Math.ceil(MBq*Math.exp(((itime-dtime)/1000)*Math.log(2)/halfLife));
}


function validateTimeAndMBq(time, MBq, startTime) {

  //Validate the Time field
  
  if (time.length != 5) {
    $("#CalErrDiv").text("Tidspunktet er ikke på formattet HH:MM");
    $("#CalErrDiv").addClass("ErrorBox");
    return false; 
  }
  
  var TestTime = CreateTime(time) 
  var RowTime =  CreateTime(startTime)

  if (TestTime === null){
    $("#CalErrDiv").text("Der er invalid Karakter i tidspunktet")
    $("#CalErrDiv").addClass("ErrorBox");
    return false;
  }
  if (TestTime < RowTime) {
    $("#CalErrDiv").text("Tidspunkt er før produktions tidspunktet")
    $("#CalErrDiv").addClass("ErrorBox");
    console.log("This happens");
    return false;
  }
  // Validate the MBQ field
  var parsed = betterParseInt(MBq);

  if (isNaN(parsed)) {
    $("#CalErrDiv").text("MBq skal være et tal")
    $("#CalErrDiv").addClass("ErrorBox");
    return false;
  } else if (parsed <= 0) {
    $("#CalErrDiv").text("Du kan ikke bestille et negativt mændge FDG");
    $("#CalErrDiv").addClass("ErrorBox");
    return false; 
  } 
  return true;
};

function calculate() {
  var orders = $(".order");
  var orderIndexs = {};
  var MBqs = new Array(orders.length);
  for (let i = 0; i < MBqs.length; i++) {
    MBqs[i] = 0; // Just for testing purposes
    orderIndexs[orders[i].innerText] = i;
  }

  $(".CalRow").each(function () {
    var rowTime = $(this).attr("var")
    var timeStr = $(this).children(".tableTime")[0].innerText;
    var index   = orderIndexs[rowTime];
    var MBq     = parseInt($(this).children(".tableMBq")[0].innerText);
    MBqs[index] += compute(rowTime, timeStr, MBq);
  });

  orders.each(function () {
    var index = orderIndexs[this.innerText]
    if ($(this).hasClass("form")){
      var updatedInnerText = "."+this.innerText.replace(':', "\\:")+"\\:00"
      var Input = $(updatedInnerText);
      Input.val(MBqs[index]);
    } else if ($(this).hasClass("data")) { //The Else-if part is mostly there for future compatablity
      // The Structure of how div are set up is different based on if Form or data, this should be fix TBH, but hey, that's effort
      // And we don't do that around here
      // We now need to Update 
      const DataRow = $(this).parent();
      const RowNumber = DataRow.attr("id").substr(4);
      const TableBody = $(DataRow.children("#informationRow"+RowNumber).children()[0]).children()[1];
      const FirstRow  = $(TableBody).children()[0]
      const OrderID   = $(FirstRow).attr("id").substr(9)
      const OldAmount = betterParseInt($($(FirstRow).children()[2]).text())
      const NewAmount = OldAmount + MBqs[index];
      var   Comment   = "";
      if ($(FirstRow).children().length == 7) {
        const CommentTD = $($(FirstRow).children()[7]);
        const Image     = CommentTD.children()[0]
        Comment = $(Image).attr("data-original-title")
      } 

      SendEditOrder(OrderID, NewAmount, Comment);
    }
  }) 
};

// Main function
function createCalculator() {
  var dialogText = $("<div>", {id: "mainCalculator"});
  var errorDiv   = $("<div>", {id: "CalErrDiv"})
  $('.order').each(function () {
      var timeslotDiv = document.createElement("div");
      var table      = $("<table>", {class:"table"});
      var thead      = $("<thead>");
      var hTimer     = $("<th>");
      var hTidspunkt = $("<th>");
      var hMBq       = $("<th>");
      var hbutton    = $("<th>");
      timeslotDiv = $(timeslotDiv);
      timeslotDiv.addClass("row");
      hTimer.text(this.innerText); 
      hTidspunkt.text("Tidspunkt");
      hMBq.text("FDG MBQ");
      var tbody = $("<tbody>");
      var tr    = $("<tr>", {var:this.innerText});
      var tTimer     = $("<td>");
      var tTidspunkt = $("<td>", {class : "tableTime"});
      var tMBq       = $("<td>", {class : "tableMBq"});
      var tButton    = $("<td>");
      var timeInput = $("<input>", {class: "tableField"});
      auto_char(timeInput, ':',2);
      var amountInput = $("<input>", {class: "tableField"} );
      var confirmButton = $("<img>", {
        class: "tableButton",
        src: "/static/customer/images/accept.svg"
      });
      confirmButton.on("click", () => confirmRow(tbody, tr, confirmButton));

      tButton.append(confirmButton);
      tTidspunkt.append(timeInput);
      tMBq.append(amountInput);
      tr.append(tTimer, tTidspunkt, tMBq, tButton)
      tbody.append(tr);
      table.append(tbody);
      thead.append(hTimer, hTidspunkt, hMBq, hbutton);
      table.append(thead);
      timeslotDiv.append(table);
      dialogText.append(timeslotDiv);
    });
  dialogText.append(errorDiv);
  
  var CalculateButtonStr = "Udregn";
  if ($(".data").length > 0) {
    CalculateButtonStr = "Udregn og Opdater"
  }

  $(dialogText).dialog({
    dialogClass: "no-close",
    title: "Lommeregner",
    width: 500,
    buttons: [
      {
        text: CalculateButtonStr, 
        click: function () {
          calculate();
          $(this).dialog("close");
          $(this).remove();
        }
      },
      {
        text: "Afbryd",
        click: function () {
          $(this).dialog("close");
          $(this).remove();
        }
      }
    ]
  });
};