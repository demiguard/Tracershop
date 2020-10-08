import { CalenderFactory } from "./libs/calender.js";

// Today is variable that's created from GET request, 
// since it's provided from Django

var CalenderInstance;

function create_element(div, content,id, identifyer, classList) {
  var element = document.createElement(identifyer);
  for(let i = 0; i < classList.length; i++) {
    const classToBeAdded = classList[i];
    element.classList.add(classToBeAdded)
  }
  if (id != ''){
    element.id=id;
  }
  element.innerHTML = content;
  div.append(element);
  return element;
}

var Date_function = function(div,  date, directory){
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

var change_date = function (new_date) {

  var day = new_date.getDate();
  var month = new_date.getMonth() + 1;
  var year = new_date.getFullYear();
  var new_text = "Dato: " + day + "/" + month + "/" + year;
  $('#dato').text(new_text);
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

var fill_order_table = function(date) {
  var day = String(date.getDate());
  var month = String(date.getMonth() + 1);
  var year = String(date.getFullYear());
  $.get({
    url:'api/order_date/' + year + "/" + month + "/" + day,
    success: function(data){
      return data;
    }
  }).then(function(data) {
    var contentDiv = $("#content");
    // FTG Orders
    for (let i = 0; i < data.responses.length; i++) {
      const response = data.responses[i];
      var dataRow = create_element(contentDiv,'','Row-'+String(i+1),'div',['data-row']);
      var contentStr;
      if (response.data_type == 'form'  || response.data_type == 'data') {
        contentStr = "<strong> Ordre " + response['order_num'] + " - Kalibreret til: " + response['time'].substr(0,5) + "</strong>";
      } else {
        contentStr = "Ukendt Data format fra JSON Fil";
      }
      create_element(dataRow, contentStr,'', 'div', ['col-12', 'row']);
      var informationRowDiv = create_element(dataRow,'','informationRow'+String(i+1),'div',['row']);
      
      // ----- Form Creation -----
      if (response.data_type == 'form'){
        create_element(
          informationRowDiv, 
          "Bestil: <input type=\"number\" id=\"id_order_MBQ\" name=\"order_MBQ\" min=\"0\"> [MBq]",
          'ButtonDiv'+String(i+1), 'div', [])
        create_element(informationRowDiv,'','','div',['col-1']);
        create_element(
          informationRowDiv,
          'Kommentar: <input type=\"text\" name=\"comment\" id=\"id_comment\">',
          'CommentDiv'+String(i+1),'div',[]);
        create_element(informationRowDiv,'','','div',['col-1']);
        var Button = create_element(informationRowDiv,'Bestil',response['order_num'],'BUTTON',['btn', 'btn-primary', 'OrderButton']);
        $(Button).on('click', () => Send_order(response['order_num']))

      // ----- Table Creation -----
      } else if (response.data_type == 'data') { 
        var table = create_element(informationRowDiv,'','','table',[]);
        var tableHead = create_element(table, '',   '','thead',[]);
        create_element(tableHead, 'Status',         '','th',   []);
        create_element(tableHead, 'order ID',       '','th',   []);
        create_element(tableHead, 'Bestilt MBQ',    '','th',   []);
        create_element(tableHead, 'Produceret MBQ', '','th',   []);
        create_element(tableHead, 'Batch-nr.',      '','th',   []);
        create_element(tableHead, 'Frigivet MBQ',   '','th',   []);
        create_element(tableHead, 'Frigivet',       '','th',   []);
        var tableBody = create_element(table, '','','tbody',   []);
        for (let j = 0; j < response.data.length; j++){
          const order = response.data[j];
          var tableRow = create_element(tableBody,'',    '', 'tr', []);
          create_element(tableRow, order.status,         '', 'td', []);
          create_element(tableRow, order.OID,        '', 'td', []);
          create_element(tableRow, order.ordered_amount, '', 'td', []);
          create_element(tableRow, order.total_amount,   '', 'td', []);
          create_element(tableRow, order.batchnr,        '', 'td', []);
          create_element(tableRow, order.frigivet_amount,    '', 'td', []);
          if (order.frigivet_datetime != null) {
            create_element(tableRow, order.frigivet_datetime.substr(11,5),'' , 'td', []);
          } else {
            create_element(tableRow, "",'', 'td', []);
          }
        }
      }        
    } // End For Loop
    // T-orders 
    if (data.tOrders.length != 0) {
      $('#T_orders').removeClass('DisplayNone')
      for(let i = 0; i < data.tOrders.length; i++) {
        const TORDER = data.tOrders[i];
        var table_row = create_element($('#secondaryTableBody'), '','','tr',['data-row']);
        create_element(table_row, TORDER.tracer,'','td',[])        
        create_element(table_row, TORDER.status,'','td',[])        
        create_element(table_row, TORDER.OrderID,'','td',[])
        create_element(table_row, TORDER.deliver_datetime.substr(11,5),'','td',[])
        create_element(table_row, TORDER.nInjections, '', 'td', [])
        create_element(table_row, TORDER.use, '', 'td', [])
      }
    } else {
      $('#T_orders').addClass('DisplayNone')
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
      var table = create_element(informationRowDiv,'','','table',[]);
      var tableHead = create_element(table, '',   '','thead',[]);
      create_element(tableHead, 'Status',         '','th',   []);
      create_element(tableHead, 'order ID',       '','th',   []);
      create_element(tableHead, 'Bestilt MBQ',    '','th',   []);
      create_element(tableHead, 'Produceret MBQ', '','th',   []);
      create_element(tableHead, 'Batch-nr.',      '','th',   []);
      create_element(tableHead, 'Frigivet MBQ',   '','th',   []);
      create_element(tableHead, 'Frigivet',       '','th',   []);
      var tableBody = create_element(table, '','','tbody',   []);
      var tableRow = create_element(tableBody,'', '', 'tr', []);
      create_element(tableRow, 1,  '', 'td', []);
      create_element(tableRow, data.lastOrder, '', 'td', []);
      create_element(tableRow, data.amount, '', 'td', []);
      create_element(tableRow, '', '', 'td', []);
      create_element(tableRow, '', '', 'td', []);
      create_element(tableRow, '', '', 'td', []);
      create_element(tableRow, "", '', 'td', []);
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
      var tableRow = create_element(tableBody,'', '', 'tr', []);
      create_element(tableRow, TracerName,  '', 'td', []);
      create_element(tableRow, 1, '', 'td', []);
      create_element(tableRow, data.lastOID, '', 'td', []);
      create_element(tableRow, bestillingVal, '', 'td', []);
      create_element(tableRow, injectionVal, '', 'td', []);
      var UseName;
      if (useVal === "0") {
        UseName = 'Menneske';
      } else if (useVal === "1") {
        UseName = "Dyr";
      } else {
        UseName = 'Andet';
      }
      create_element(tableRow, UseName, '', 'td', []);      
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

  CalenderInstance = new CalenderFactory('calender',today, Date_function, Date_onClick, colorDict);
});
