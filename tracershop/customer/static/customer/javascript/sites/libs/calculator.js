import { createElement, auto_char, destroyActiveDialog } from './htmlHelpers.js' ;
import { SendEditOrder } from "./EditOrder.js"
import { CALCULATOR_ICON, DEFAULT_VALUE_ATTRIBUTE, EDITABLE_ORDER,
  INFORMATION_ROW_HEADER, CROSS_PICTURE, ERROR_CLASS, CALCULATOR_ORDER_TIME,
  TIME_FIELD, TIME_TD_CLASS, AMOUNT_FIELD, AMOUNT_TD_CLASS } from "./Constants.js"
import { createCalculatorInput } from "./Factory.js"
export { createCalculator }

const ERROR_DIV = "CalErrDiv";
const FINISHED_ROW_CLASS = "CalRow";

// Frontend construction
function KeyConfirmRow(event) {
  if (event.which === 13) {
    const field = $(event.target).parent();
    const Row = $(field).parent();
    const tbody = $(Row).parent();
    const thisButtonDiv = $($(Row).children()[3]);
    confirmRow(tbody, Row, thisButtonDiv.children()[0]);
    
    const Rows = tbody.children();
    const NewRow = Rows[Rows.length -1];
    const NewAmountField = $(NewRow).find("." + TIME_FIELD);
    NewAmountField.focus();
  }
}

function confirmRow(tbody, Row, thisButton) {
  
  
  $("#" + ERROR_DIV).empty();
  $("#" + ERROR_DIV).removeClass(ERROR_CLASS);
  // Check if valid inputs
  const timetd = $(Row).find("."  + TIME_TD_CLASS);
  const timeStr = timetd.find("." + TIME_FIELD).val();
  const MBqtd = $(Row).find("." + AMOUNT_TD_CLASS); 
  const MBqStr = MBqtd.find("." + AMOUNT_FIELD).val();
  // Fixate inputs and change icon
  var RowTime = Row.attr(CALCULATOR_ORDER_TIME);  
  
  if(!validateTimeAndMBq(timeStr, MBqStr, RowTime)) {
    // Do some error message
    return;
  }
  timetd.empty();
  MBqtd.empty();
  timetd.text(timeStr)
  MBqtd.text(MBqStr);

  $(thisButton).off();
  $(thisButton).attr("src", CROSS_PICTURE)
  $(thisButton).on("click", () => deleteRow(Row));
  Row.addClass(FINISHED_ROW_CLASS);
  // Create New row
  tbody.append(createCalculatorInput(RowTime, tbody, confirmRow, KeyConfirmRow));
};

function deleteRow(row) {
  row.remove();
};

// Validation && Math
function betterParseInt(numStr) {
  // Holy shit the implementation of parseInt is FUCKING STUPID
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
    $("#" + ERROR_DIV).text("Tidspunktet er ikke på formattet HH:MM");
    $("#" + ERROR_DIV).addClass(ERROR_CLASS);
    return false; 
  }
  
  var TestTime = CreateTime(time) 
  var RowTime =  CreateTime(startTime)

  if (TestTime === null){
    $("#" + ERROR_DIV).text("Der er invalid Karakter i tidspunktet")
    $("#" + ERROR_DIV).addClass(ERROR_CLASS);
    return false;
  }
  if (TestTime < RowTime) {
    $("#" + ERROR_DIV).text("Tidspunkt er før produktions tidspunktet")
    $("#" + ERROR_DIV).addClass(ERROR_CLASS);
    console.log("This happens");
    return false;
  }
  // Validate the MBQ field
  var parsed = betterParseInt(MBq);

  if (isNaN(parsed)) {
    $("#" + ERROR_DIV).text("MBq skal være et Positivt tal")
    $("#" + ERROR_DIV).addClass(ERROR_CLASS);
    return false;
  } else if (parsed <= 0) {
    $("#" + ERROR_DIV).text("Du kan ikke bestille et negativt mændge FDG");
    $("#" + ERROR_DIV).addClass(ERROR_CLASS);
    return false; 
  } 
  return true;
};

function ReadCalculator(MBqs, orderIndexs) {
  $("." + FINISHED_ROW_CLASS).each(function () {
    var rowTime = $(this).attr(CALCULATOR_ORDER_TIME);
    var timeStr = $(this).children("." + TIME_TD_CLASS)[0].innerText;
    var index   = orderIndexs[rowTime];
    var MBq     = parseInt($(this).children("." + AMOUNT_TD_CLASS)[0].innerText);
    MBqs[index] += compute(rowTime, timeStr, MBq);
  });
}

// Buttons  Function
function calculateEmpty() {
  var orders = $(".order");
  var orderIndexs = {};
  var MBqs = new Array(orders.length);
  for (let i = 0; i < MBqs.length; i++) {
    MBqs[i] = 0; // Just for testing purposes
    orderIndexs[orders[i].innerText] = i;
  }

  ReadCalculator(MBqs, orderIndexs);

  orders.each(function () {
    var index = orderIndexs[this.innerText]
    if ($(this).hasClass("form")){
      var updatedInnerText = "."+this.innerText.replace(':', "\\:")+"\\:00"
      $(updatedInnerText).val(MBqs[index]);
    } 
    
  }); 
};

// Buttons
function calculateKeep() {
  var orders = $(".order");
  var orderIndexs = {};
  var MBqs = new Array(orders.length);
  for (let i = 0; i < MBqs.length; i++) {
    MBqs[i] = 0; // Just for testing purposes
    orderIndexs[orders[i].innerText] = i;
  }

  ReadCalculator(MBqs, orderIndexs);

  orders.each(function () {
    var index = orderIndexs[this.innerText]
    if ($(this).hasClass("form")){
      var updatedInnerText = "."+this.innerText.replace(':', "\\:")+"\\:00"
      const oldVal = betterParseInt($(updatedInnerText).val());
      console.log(oldVal)
      if (!isNaN(oldVal)) {
        $(updatedInnerText).val(MBqs[index] + oldVal);
      } else {
        $(updatedInnerText).val(MBqs[index]);
      }
    } 
    
  }); 
};



function UpdateEditable() {
  var orders = $(".order");
  var orderIndexs = {};
  var MBqs = new Array(orders.length);
  for (let i = 0; i < MBqs.length; i++) {
    MBqs[i] = 0; // Just for testing purposes
    orderIndexs[orders[i].innerText] = i;
  }

  ReadCalculator(MBqs, orderIndexs);
  orders.each(function () {
    var index = orderIndexs[this.innerText]
    if ($(this).hasClass("data")) {
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
  });
}


function UpdateDefaultValue() {
  const NewDefaultValue = betterParseInt($(this).val())
  if (! isNaN(NewDefaultValue)){
    $.ajax({
      url      : "api/REST/ServerConfiguration",
      type     : "put",
      datatype :"json",
      data     : JSON.stringify({
        "filter" : {
          "ID" : 1 // Serverconfigution is 1 indexed, Complain to Django not me.
        },
        "update" : {
          "DefaultCalculatorValue" : NewDefaultValue
        }
      }),
      success : function(data){
        $(".calculator").attr("defaultValue", NewDefaultValue);
        $(".amountField").val(NewDefaultValue);
      }
    });
  }
}


// Main function
function createCalculator() {
  const defaultValue = Number($("#calculatorIcon").attr("defaultValue"));

  // Create Calculator
  var dialogText = $("<div>", {id: "mainCalculator"});
  // Header Default Value
  var defaultDiv = $("<div>").appendTo(dialogText);
  defaultDiv.append($("<label>", {
    "text" : "Standard bestilling:"
  }));
  var defaultInput = $("<input>", {
    id:"defaultInput",
    val: defaultValue,
    type:"number"
  }).appendTo(defaultDiv);
  defaultInput.on('keyup', UpdateDefaultValue);


  var ContainsEditableOrder = false;
  var ContainsInputFields   = false;
  //Main table
  $('.order').each(function () {
      //Check is order is Editable
      if ($(this).hasClass("data")) {
        const DataRow = $(this).parent();
        const RowNumber = DataRow.attr("id").substr(4);
        if ($("#"+ INFORMATION_ROW_HEADER + RowNumber).find("." + EDITABLE_ORDER).length == 0 ) return;
        ContainsEditableOrder = true;
      }
      if ($(this).hasClass("form")) {
        ContainsInputFields = true;
      } 
      //Create the remaining 
      var timeslotDiv = $("<div>", {class : "row"});
      var table      = $("<table>", {class:"table"});
      var thead      = $("<thead>");
      thead.append($("<th>").text(this.innerText));
      thead.append($("<th>").text("Tidspunkt"));
      thead.append($("<th>").text("FDG MBq"));
      thead.append($("<th>")); // Button  Row
      
      var tbody = $("<tbody>");
      tbody.append(createCalculatorInput(this.innerText, tbody, confirmRow, KeyConfirmRow));

      table.append(thead);
      table.append(tbody);
      timeslotDiv.append(table);
      dialogText.append(timeslotDiv);
    });

  //This appends the Error Div
  dialogText.append($("<div>", {id: "CalErrDiv"}));
  
  //Buttons
  var Buttons = [{
    text: "Afbryd",
    click: function () {
      $(this).dialog("close");
      $(this).remove();
    }
  }];
  
  if (ContainsEditableOrder) {
    Buttons.push({
      text : "Opdater Existerne Ordre",
      click: function() {
        UpdateEditable()
        $(this).dialog("close");
        $(this).remove();
      }
    });
  }

  if (ContainsInputFields) {
    Buttons.push({
      text : "Tilføj til nuværende bestilling",
      click: function() {
        calculateKeep()
        $(this).dialog("close");
        $(this).remove();
      }
    });
    Buttons.push({
      text : "Overskriv gamle bestilling",
      click: function() {
        calculateEmpty()
        $(this).dialog("close");
        $(this).remove();
      }
    });
  }


  console.log(ContainsInputFields)
  console.log(ContainsEditableOrder)
  Buttons = Buttons.reverse()
  if (! ContainsInputFields && ! ContainsEditableOrder ) {
    //Write a error message
    return
  }

  //Create The Dialog
  $(dialogText).dialog({
    dialogClass: "no-close",
    title: "Lommeregner",
    width: 750,
    buttons: Buttons
  });
};