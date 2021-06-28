import { CalenderFactory } from "./libs/calender.js";
import { CustomerSelect  } from "./libs/customerSelect.js";
import { EditOrder, EditTOrder } from "./libs/EditOrder.js"
import { SendOrder, SendTOrder } from "./libs/requests.js"
import { createElement, dropChildren, auto_char, MaxCharInField, destroyActiveDialog } from './libs/htmlHelpers.js' ;
import { createFDGForm } from "./libs/Factory.js"

import { createCalculator } from "./libs/calculator.js";
import { Table } from "./libs/TableFactory.js"

// Today is variable that's created from GET request, 
// it's provided from Django Template and can be found in index.html

var CalenderInstance;
var CustomerInstance;
var ChangingDate = false;


var dateColoringFunction = function(div,  date, directory){
  div.classList.add('date-base-class')
  if (date in directory){
    var directory_value = String(directory[date]);
    div.classList.add('date-status' + directory_value);
  } else {
    div.classList.add('date-status55');
  }
};


var change_date = function (dateDiv, newDate) {
  destroyActiveDialog();
  CalenderInstance.SetActiveDate(newDate);
  today = newDate;
  var day = newDate.getDate();
  var month = newDate.getMonth() + 1;
  var year = newDate.getFullYear();
  var currToday = $(".today");
  currToday.removeClass('today');
  dateDiv.classList.add('today');
  var newText = "Dato: " + day + "/" + month + "/" + year;
  $('#dato').text(newText);
};


var clear_order_table = function() {
  var data_rows = $('.data-row');
  for (let i = 0; i < data_rows.length; i++) {
    const div = data_rows[i];
    div.parentNode.removeChild(div);
  }
};


var Date_onClick = function (div, date) {
  function anno() {
    $(this).unbind()
    change_date(div, date);
    clear_order_table();
    fill_order_table(date, this, anno);
  }
  var jdiv = $(div);
  jdiv.click(anno);

};

var Month_api_call = function(year, month) {
  ////////////////////////////////
  //  Produces a Dictionany for the $.get for the month api to the Calender API
  ////////////////////////
  return {
    url: "api/monthStatus/" + String(year) + "/" + String(month + 1),
    data: {"userID" : $('#customer_select')[0].value},
    success: function (data){return data} 
  }
};

var onChangeSelect = function() {
  // this is the the div that got changed
  clear_order_table();
  fill_order_table(today);
  CalenderInstance.change_month(0);
};

function CreateTOrderTable(data, Div) {
  //Set up data
  let Header = ["Tracer", "Status", "Order ID", "Bestilt til", "Injecioner","Kommentar", "Til"];
  let RowIDs=[];
  let Rows= [];


  for(let i = 0; i < data.length; i++) {
    let Torder = data[i];
    let RowData = [];
    RowIDs.push(`TOrder-${Torder.OrderID}`),
    RowData.push(Torder.tracer)
    const statusImage = $('<img>', {
      src: `/static/customer/images/clipboard${Torder.status}.svg`,
      class: "StatusIcon"
    });
    if (Torder.status == 1) {
      statusImage.addClass("Editable-TOrder");
      statusImage.attr("id", `TStatus-${Torder.OrderID}`);
      statusImage.click(EditTOrder);
    }
    RowData.push(statusImage);
    RowData.push(Torder.OrderID);
    RowData.push(Torder.deliver_datetime.substr(11,5));
    RowData.push(Torder.nInjections);
    if (Torder.comment)  {
      const commentImage = $("<img>",{
        src: "/static/customer/images/comment.svg",
        class:"StatusIcon",
        title:Torder.comment
      });
      commentImage.tooltip()
      RowData.push(commentImage);
    } else {
      RowData.push("");
    }
    RowData.push(Torder.use);
    Rows.push(RowData);
  };

  const Skeleton = new Object();
  Skeleton.HeaderColumns  = Header;
  Skeleton.Rows           = Rows;
  Skeleton.RowIDs         = RowIDs;
  Skeleton.tbodyID        = "secondaryTableBody";

  const dataTable = new Table(Skeleton)
  Div.append(dataTable.getTable()[0])
}

/*
function CreateFDGForm(informationRowDiv, response, responseNumber) {
  var mbqInputDiv = createElement(informationRowDiv,"",'ButtonDiv'+String(responseNumber+1), 'div', [])
  var mbqInput = $("<input>", {
    type:"number",
    id:"id_order_MBQ",
    name:"order_MBQ",
    min:"0",
    class: response['time']
  });
  $(mbqInputDiv).append("Bestil FDG:");
  mbqInput.appendTo(mbqInputDiv);
  $(mbqInputDiv).append("[MBq]");
  //Create Spcae between the buttons
  createElement(informationRowDiv,'','','div',['col-1']);
  
  var commentDiv = createElement(informationRowDiv, "", 'CommentDiv'+String(responseNumber+1),'div',[]);
  var commentInput = $("<textarea>",{
    id:"id_comment",
    type:"text",
    name:"comment",
    class:"",
    placeholder: "Kommentar",
    rows:1
  });
  commentInput.appendTo(commentDiv);
  createElement(informationRowDiv,'','','div',['col-1']);
  var Button = createElement(informationRowDiv,'Bestil',response['order_num'],'BUTTON',['btn', 'btn-primary', 'OrderButton']);
  $(Button).click(SendOrder);
}
*/

function CreateFGDOrderTable(data, Div, hasComment) {
  let Header;
  let RowIDs = [];
  let Row = []
  for (let i = 0; i < data.length; i++) {
    const order = data[i];
    
    var RowData = new Array();
    const statusImage = $('<img>', {
      src: `/static/customer/images/clipboard${order.status}.svg`,
      class: "StatusIcon"
    });
    if (order.status == 1) {
      statusImage.addClass("Editable-Order");
      statusImage.attr("id", `Order-${order.OID}`);
      statusImage.click(EditOrder)
    }
    RowData.push(statusImage);
    RowData.push(order.OID);
    RowData.push(order.ordered_amount);
    RowData.push(order.total_amount);
    RowData.push(order.batchnr);
    RowData.push(order.frigivet_amount);
    (order.frigivet_datetime != null) ? RowData.push(order.frigivet_datetime.substr(11,5)) : RowData.push("");
    if (hasComment && order.comment) {
      const commentImage = $("<img>", {
          src : "/static/customer/images/comment.svg", 
          class: "StatusIcon",
          title:order.comment
        });
      $(commentImage).tooltip();
      RowData.push(commentImage);
    }
    Row.push(RowData);
    RowIDs.push(`OrderRow-${order.OID}`);
    }
  if (hasComment) {
    Header = ["Status", "Order ID", "Bestilt MBq", "Produceret Mbq","Batch-nr", "Frigivet MBq", "Frigivet", "Kommentar"] ;
  }
  else {
    Header = ["Status", "Order ID", "Bestilt MBq", "Produceret Mbq", "Batch-nr", "Frigivet MBq", "Frigivet"] 
  } 
  //Format such that Table factory can use it 
  const Skeleton = new Object();
  Skeleton.HeaderColumns  = Header;
  Skeleton.Rows           = Row;
  Skeleton.RowIDs         = RowIDs;

  const dataTable = new Table(Skeleton)
  Div.append(dataTable.getTable()[0])
}


function HandleOrderDateResponse(data) {

}


var fill_order_table = function(date, DateDiv, changeDateFunction) {
  //////////////////////////////////////////////////
  //  Fills the main table with data from the api //
  //////////////////////////////////////////////////
  var day = String(date.getDate());
  var month = String(date.getMonth() + 1);
  var year = String(date.getFullYear());

  $.get({
    url:'api/order_date/' + year + "/" + month + "/" + day,
    data: {"UserID" : $('#customer_select')[0].value},
    success: function(data){
      return data;
    }
  }).then(function(data) {
    var contentDiv = $("#content");
    // FTG Orders
    for (let i = 0; i < data.responses.length; i++) {
      const response = data.responses[i];
      var dataRow = createElement(contentDiv,'','Row-'+String(i+1),'div',['data-row']);
      var contentStr;
      if (response.data_type == 'form'  || response.data_type == 'data') {
        contentStr = "<strong> Ordre " + response['order_num'] + " - Kalibreret til: " + response['time'].substr(0,5) + "</strong>";
      } else {
        contentStr = "Ukendt Data format fra JSON Fil";
      }
      createElement(dataRow, contentStr,'', 'div', ['col-11', 'row']);
      
      createElement(dataRow, response['time'].substr(0,5),"", "div", ["order", "DisplayNone", response.data_type]);
      var informationRowDiv = createElement(dataRow,'','informationRow'+String(i+1),'div',['row']);
      // ----- Form Creation -----
      if (response.data_type == 'form') {
        createFDGForm(informationRowDiv, response["time"], response["order_num"], SendOrder);
      }
      // ----- Table Creation -----
      if (response.data_type == 'data') { CreateFGDOrderTable(response.data, informationRowDiv, response.hasComment); }
    } 
    // T-orders 
    if (data.tOrders.length != 0) {
      $('#T_orders').removeClass('DisplayNone');
      $("#torder_data").empty(); // Remove old content
      CreateTOrderTable(data.tOrders, $('#torder_data'));
    } else {
      $('#T_orders').addClass('DisplayNone');
    };
    // T-OrderForms
    var TFormTbody = $('#TFormRows');
    const injectionFieldInputStr = '<input type="text" name="injectionField" class="injectionField" id="id_injectionField">';
    const UseSelectStr = '\
    <select name="useField" class="selectTOrder custom-select" id="id_useField">\
    <option value="0">Human</option>\
    <option value="1">Dyr</option>\
    <option value="2">Andet</option>\
    </select>';
    if (data.tOrdersForms.length != 0) {
      $("#T_forms").removeClass('DisplayNone')
    } else {
      $("#T_forms").addClass('DisplayNone')
    }
    dropChildren(TFormTbody);
    for (let i = 0; i < data.tOrdersForms.length; i++) {
      const TORDERFORM = data.tOrdersForms[i];
      var formRow = createElement(TFormTbody,'',"Row"+TORDERFORM.id,'tr',[]);
      createElement(formRow, TORDERFORM.name,"TracerName", 'td',[]);
      var deliverTimeTD = createElement(formRow, "" ,"deliverTime", 'td',[]);
      var deliverTimeInput    = $("<input>", {
        type:"text",
        class:"timeField",
        required:"", 
        id:"id_deliverTime"
      });
      deliverTimeInput.appendTo($(deliverTimeTD));
      auto_char(deliverTimeInput, ':',2);
      MaxCharInField(deliverTimeInput, 5);  
      createElement(formRow, injectionFieldInputStr, "InjectionField", 'td', []);
      createElement(formRow, UseSelectStr, 'UseField','td',[]);
      const CommentTD    = createElement(formRow, '', '', 'td', []);
      const CommentInput = $("<textarea>",{
        type:"text",
        class: "TOrderComment",
        id: `TOrderComment-${TORDERFORM.id}`,
        placeholder:"Kommentar",
        rows:1
      });
      $(CommentTD).append(CommentInput)
      var orderButtonTD = createElement(formRow, '', '', 'td', []);
      var orderButton = $('<input>', {
        id : "TOrderButton"+TORDERFORM.id,
        type:"button",
        value:"Bestil"
      });
      orderButton.addClass("TorderButton");
      orderButton.addClass("btn");
      orderButton.addClass("btn-outline-secondary");
      orderButton.click(SendTOrder);
      orderButton.appendTo(orderButtonTD);
    }
    $(DateDiv).click(changeDateFunction); 
  });
};

// TODO: Goal Reduce this to imports and this function
$(function() {
  $("#calculatorIcon").on("click", function () {
    createCalculator();
  })
  //Make sure calender is syncronized with customer select

  $('.OrderButton').click(SendOrder);
  $('.TorderButton').click(SendTOrder);
  $('.Editable-Order').click(EditOrder);
  $('.Editable-TOrder').click(EditTOrder);

  //Okay I HAVE NO IDEA Why this line of code is needed, but if you dont you have zero indentation error
  var Ztoday = new Date(today.getYear()+1900, today.getMonth(),today.getDate())

  CalenderInstance = new CalenderFactory(
    'calender',
    Ztoday, 
    dateColoringFunction, 
    Date_onClick, 
    Month_api_call,
    colorDict);
  
    CustomerInstance = new CustomerSelect(
    $('#customer_select'),
    onChangeSelect
  );

  $(".commentIcon").tooltip();
});
