import { CalenderFactory } from "./libs/calender.js";
import { CustomerSelect  } from "./libs/customerSelect.js";
import { createElement, dropChildern } from './libs/htmlHelpers.js' ;

// Today is variable that's created from GET request, 
// since it's provided from Django

var CalenderInstance;
var CustomerInstance;

var dateColoringFunction = function(div,  date, directory){
  if (date in directory){
    var directory_value = directory[date];
    if (directory_value == 1){
      div.classList.add('date-status1');
    } else if (directory_value == 2) {
      div.classList.add('date-status2');
    } else if (directory_value == 3) {
      div.classList.add('date-status3');
    }
  } else {
    div.classList.add('date-status4');
  }
};


var change_date = function (newDate) {
  today = newDate
  var day = newDate.getDate();
  var month = newDate.getMonth() + 1;
  var year = newDate.getFullYear();
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
  var jdiv = $(div);
  jdiv.on('click', function() {
    change_date(date);
    clear_order_table();
    fill_order_table(date);
  });

};

var Month_api_call = function(year, month) {
  ////////////////////////////////
  //  Produces a Dictionany for the $.get for the month api to the Calender API
  ////////////////////////
  return {
    url: "api/month_status/" + String(year) + "/" + String(month + 1),
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


var fill_order_table = function(date) {
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
      createElement(dataRow, contentStr,'', 'div', ['col-12', 'row']);
      var informationRowDiv = createElement(dataRow,'','informationRow'+String(i+1),'div',['row']);
      
      // ----- Form Creation -----
      if (response.data_type == 'form'){
        createElement(
          informationRowDiv, 
          "Bestil: <input type=\"number\" id=\"id_order_MBQ\" name=\"order_MBQ\" min=\"0\"> [MBq]",
          'ButtonDiv'+String(i+1), 'div', [])
        createElement(informationRowDiv,'','','div',['col-1']);
        createElement(
          informationRowDiv,
          'Kommentar: <input type=\"text\" name=\"comment\" id=\"id_comment\">',
          'CommentDiv'+String(i+1),'div',[]);
        createElement(informationRowDiv,'','','div',['col-1']);
        var Button = createElement(informationRowDiv,'Bestil',response['order_num'],'BUTTON',['btn', 'btn-primary', 'OrderButton']);
        $(Button).on('click', () => Send_order(response['order_num']))

      // ----- Table Creation -----
      } else if (response.data_type == 'data') { 
        var table = createElement(informationRowDiv,'','','table',[]);
        var tableHead = createElement(table, '',   '','thead',[]);
        createElement(tableHead, 'Status',         '','th',   []);
        createElement(tableHead, 'order ID',       '','th',   []);
        createElement(tableHead, 'Bestilt MBQ',    '','th',   []);
        createElement(tableHead, 'Produceret MBQ', '','th',   []);
        createElement(tableHead, 'Batch-nr.',      '','th',   []);
        createElement(tableHead, 'Frigivet MBQ',   '','th',   []);
        createElement(tableHead, 'Frigivet',       '','th',   []);
        var tableBody = createElement(table, '','','tbody',   []);
        for (let j = 0; j < response.data.length; j++){
          const order = response.data[j];
          var tableRow = createElement(tableBody,'',    '', 'tr', []);
          createElement(tableRow, order.status,         '', 'td', []);
          createElement(tableRow, order.OID,        '', 'td', []);
          createElement(tableRow, order.ordered_amount, '', 'td', []);
          createElement(tableRow, order.total_amount,   '', 'td', []);
          createElement(tableRow, order.batchnr,        '', 'td', []);
          createElement(tableRow, order.frigivet_amount,    '', 'td', []);
          if (order.frigivet_datetime != null) {
            createElement(tableRow, order.frigivet_datetime.substr(11,5),'' , 'td', []);
          } else {
            createElement(tableRow, "",'', 'td', []);
          }
        }
      }        
    } // End For Loop
    // T-orders 
    if (data.tOrders.length != 0) {
      $('#T_orders').removeClass('DisplayNone')
      for(let i = 0; i < data.tOrders.length; i++) {
        const TORDER = data.tOrders[i];
        var table_row = createElement($('#secondaryTableBody'), '','','tr',['data-row']);
        createElement(table_row, TORDER.tracer,'','td',[])        
        createElement(table_row, TORDER.status,'','td',[])        
        createElement(table_row, TORDER.OrderID,'','td',[])
        createElement(table_row, TORDER.deliver_datetime.substr(11,5),'','td',[])
        createElement(table_row, TORDER.nInjections, '', 'td', [])
        createElement(table_row, TORDER.use, '', 'td', [])
      }
    } else {
      $('#T_orders').addClass('DisplayNone')
    };
    // T-OrderForms
    var TFormTbody = $('#TFormRows');
    const deliverTimeInputStr = '<input type="text" name="deliverTime" class="timeField" required="" id="id_deliverTime">';
    const injectionFieldInputStr = '<input type="text" name="injectionField" class="injectionField" id="id_injectionField">';
    const UseSelectStr = '\
    <select name="useField" class="selectTOrder custom-select" id="id_useField">\
      <option value="0">Menneske</option>\
      <option value="1">Dyr</option>\
      <option value="2">Andet</option>\
    </select>';
    dropChildern(TFormTbody);
    for (let i = 0; i < data.tOrdersForms.length; i++) {
      const TORDERFORM = data.tOrdersForms[i];
      console.log(TORDERFORM);
      var formRow = createElement(TFormTbody,'',"Row"+TORDERFORM.id,'tr',[]);
      createElement(formRow, TORDERFORM.name,"TracerName", 'td',[]);
      createElement(formRow, deliverTimeInputStr,"deliverTime", 'td',[]);
      createElement(formRow, injectionFieldInputStr, "InjectionField", 'td', []);
      createElement(formRow, UseSelectStr, 'UseField','td',[]);
      var orderButtonTD = createElement(formRow, '', '', 'td', []);
      var orderButton = $('<input>', {
        id : "TOrderButton"+TORDERFORM.id,
        type:"button",
        value:"Bestil"
      });
      orderButton.addClass("TorderButton");
      orderButton.addClass("btn");
      orderButton.addClass("btn-outline-secondary");
      let id = orderButton.attr('id').substr(12);
      orderButton.on('click', () => Send_torder(id));
      orderButton.appendTo(orderButtonTD);
    }

  });
};

var Send_order = function(id) {
  let amount = $('#ButtonDiv'+String(id)).children('#id_order_MBQ').val();
  let comment = $('#CommentDiv'+String(id)).children('#id_comment').val();
  let date = $('#dato').text().replace(/\s+/g, '');
  $.post({
    url: "api/addOrder",
    data: {
      'dato' : date.substr(5),
      'order' : id,
      'amount' : amount,
      'comment' : comment
    },
    dataType: "JSON", 
    success: function(data) {
      var informationRowDiv = $('#informationRow' + String(id));
      informationRowDiv.empty();
      var table = createElement(informationRowDiv,'','','table',[]);
      var tableHead = createElement(table, '',   '','thead',[]);
      createElement(tableHead, 'Status',         '','th',   []);
      createElement(tableHead, 'order ID',       '','th',   []);
      createElement(tableHead, 'Bestilt MBQ',    '','th',   []);
      createElement(tableHead, 'Produceret MBQ', '','th',   []);
      createElement(tableHead, 'Batch-nr.',      '','th',   []);
      createElement(tableHead, 'Frigivet MBQ',   '','th',   []);
      createElement(tableHead, 'Frigivet',       '','th',   []);
      var tableBody = createElement(table, '','','tbody',   []);
      var tableRow = createElement(tableBody,'', '', 'tr', []);
      createElement(tableRow, 1,  '', 'td', []);
      createElement(tableRow, data.lastOrder, '', 'td', []);
      createElement(tableRow, data.amount, '', 'td', []);
      createElement(tableRow, '', '', 'td', []);
      createElement(tableRow, '', '', 'td', []);
      createElement(tableRow, '', '', 'td', []);
      createElement(tableRow, "", '', 'td', []);
    }, 
    error: function() {
      console.log("Error");
    }
  });
};

var Send_torder = function(TracerID) {
  var datarow =  $('#Row'+ String(TracerID));
  let date = $('#dato').text().replace(/\s+/g, '').substr(5);
  var bestillingTD = datarow.children('#deliverTime');
  var injectionTD  = datarow.children('#InjectionField');
  var useTD        = datarow.children('#UseField');

  var bestillingVal = bestillingTD.children('#id_deliverTime').val();
  var injectionVal  = injectionTD.children('#id_injectionField').val();
  var useVal        = useTD.children('#id_useField').val();
  var TracerName    = datarow.children('#TracerName').text();


  $.post({
    url: 'api/addTOrder',
    data: {
      'dato': date,
      'id'  : TracerID,
      'BestillingTid' : bestillingVal,
      'injections'    : injectionVal,
      'Usage'         : useVal
    },
    success: function(data) {
      var tOrdersRow = $("#T_orders");
      if(tOrdersRow.hasClass('DisplayNone')) {
        tOrdersRow.removeClass('DisplayNone');
      }
      var tableBody = $('#secondaryTableBody');
      var tableRow = createElement(tableBody,'', '', 'tr', []);
      createElement(tableRow, TracerName,  '', 'td', []);
      createElement(tableRow, 1, '', 'td', []);
      createElement(tableRow, data.lastOID, '', 'td', []);
      createElement(tableRow, bestillingVal, '', 'td', []);
      createElement(tableRow, injectionVal, '', 'td', []);
      var UseName;
      if (useVal === "0") {
        UseName = 'Menneske';
      } else if (useVal === "1") {
        UseName = "Dyr";
      } else {
        UseName = 'Andet';
      }
      createElement(tableRow, UseName, '', 'td', []);      
    }
  });
}


$(function() {
  var OrderButtons = $('.OrderButton');
  for (let i = 0; i< OrderButtons.length; i++){
    var OrderButton = $(OrderButtons[i]);
    let id = OrderButton.attr('id');
    OrderButton.on( 'click', () => Send_order(id));
  }

  var TorderButtons = $('.TorderButton');
  for (let i = 0; i < TorderButtons.length; i++) {
    var TOrderButton = $(TorderButtons[i]);
    let id = TOrderButton.attr('id').substr(12);
    TOrderButton.on('click', () => Send_torder(id));
  }

  CalenderInstance = new CalenderFactory(
    'calender',
    today, 
    dateColoringFunction, 
    Date_onClick, 
    Month_api_call,
    colorDict);
  
  CustomerInstance = new CustomerSelect(
    $('#customer_select'),
    onChangeSelect
  );
});
