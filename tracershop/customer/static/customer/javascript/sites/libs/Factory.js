import {CALCULATOR_ICON, DEFAULT_VALUE_ATTRIBUTE, CALCULATOR_ORDER_TIME, TABLE_BUTTON_CSS,
  CHECKMARK_PICTURE, TIME_FIELD, AMOUNT_FIELD, TIME_TD_CLASS, AMOUNT_TD_CLASS,
  BUTTON_DIV_HEADER, MBQ_ID_HEADER, COMMENT_ID_HEADER, COMMENT_DIV_HEADER} from './Constants.js'
import { createElement, auto_char, destroyActiveDialog } from './htmlHelpers.js' ;
export { createCalculatorInput, createFDGForm }

const NewTR    = "<tr>";
const NewTD    = "<td>";
const NewInput = "<input>";
const NewImg   = "<img>";
const NewDiv   = "<div>"

function createFDGForm(AnchorDiv, responseTime, responseNumber, activeButtonFunction) {
  const sResNum = String(responseNumber)
  
  $(AnchorDiv).append(NewDiv, {
    id: BUTTON_DIV_HEADER + sResNum
  }).append("Bestil FDG: ").append($("<input>", {
    type:"number",
    id:MBQ_ID_HEADER + sResNum,
    name:"order_MBQ", //Not used, but kept for syncronization
    min:"0",
    class: responseTime
  })).append("[MBq]");
  //Create Space between the buttons
  $(AnchorDiv).append($(NewDiv, {
    class : "col-1"
  }));
  
  $(AnchorDiv).append($(NewDiv, {
    id: COMMENT_DIV_HEADER + sResNum
  }).append($("<textarea>",{
    id:COMMENT_ID_HEADER+sResNum,
    type:"text",
    name:"comment",
    class:"CommentField",
    placeholder: "Kommentar",
    rows:1
  })));
  
  $(AnchorDiv).append($(NewDiv, {
    class : "col-1"
  }));
  var Button = createElement(AnchorDiv,'Bestil', sResNum,'BUTTON',['btn', 'btn-primary', 'OrderButton']);
  $(Button).click(activeButtonFunction);
}

function createCalculatorInput(RowTime, tbody, confirmFunction, KeyConfirmFunction) {
  const defaultValue = Number($(CALCULATOR_ICON).attr(DEFAULT_VALUE_ATTRIBUTE));

  var tr         = $(NewTR, {CALCULATOR_ORDER_TIME : RowTime});
  $(NewTD).appendTo(tr); // This is the empty row under the timer.
  var tTidspunkt = $(NewTD, {class : TIME_TD_CLASS}).appendTo(tr);
  var tMBq       = $(NewTD, {class : AMOUNT_TD_CLASS}).appendTo(tr);
  var tButton    = $(NewTD).appendTo(tr);
  var timeInput  = $(NewInput, {class: TIME_FIELD}).on("keyup", KeyConfirmFunction).appendTo(tTidspunkt);
  auto_char(timeInput, ':',2);
  $(NewInput, {class: AMOUNT_FIELD, val:defaultValue} ).on(
    "keyup", KeyConfirmFunction).appendTo(tMBq);
  var confirmButton = $(NewImg, {
    class: TABLE_BUTTON_CSS,
    src: CHECKMARK_PICTURE,
  }).on("click", () => confirmFunction(tbody, tr, confirmButton)).appendTo(tButton);
  
  return tr;  
}
