import { CalenderFactory } from "./libs/calender.js";

// Today is variable that's created from GET request, 
// since it's provided from Django

var CalenderInstance;

function create_element(div, content, identifyer, classList) {
  var element = document.createElement(identifyer);
  for(let i = 0; i < classList.length; i++) {
    const classToBeAdded = classList[i];
    element.classList.add(classToBeAdded)
  }
  element.innerHTML = content;
  div.append(element);
  return element;
}

$(function() {
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

  var  fill_order_table = function(date) {
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
      for (let i = 0; i < data.responses.length; i++) {
        const response = data.responses[i];
        var dataRow = create_element(contentDiv,'','div',['data-row']);
      
        var contentStr;
        if (response.data_type == 'form'  || response.data_type == 'data') {
          contentStr = "<strong> Bestilling " + response['order_num'] + " - " + response['time'].substr(0,5) + "</strong>";
        } else {
          contentStr = "Ukendt Data format fra JSON Fil";
        }
        create_element(dataRow, contentStr, 'div', ['col-12', 'row']);
        var informationRowDiv = create_element(dataRow,'','div',['row']);
        create_element(informationRowDiv,'','div',['col-1']);
        // ----- Form Creation -----
        if (response.data_type == 'form'){
          create_element(
            informationRowDiv, 
            "<label for=\"id_order_MBQ\">Antal MBQ:</label><input id=\"id_order_MBQ\" type=\"number\" name=\"order_MBQ\" min=\"0\">",
            'div', [])
          create_element(informationRowDiv,'','div',['col-1']);
          create_element(informationRowDiv,'Bestil','BUTTON',['btn', 'btn-primary']);

        } else if (response.data_type == 'data') { 
          // ----- Table Creation -----
          var table = create_element(informationRowDiv,'','table',['col-11']);
          var tableHead = create_element(table, '',   'thead',[]);
          create_element(tableHead, 'Status',         'th',   []);
          create_element(tableHead, 'order ID',       'th',   []);
          create_element(tableHead, 'Bestilt MBQ',    'th',   []);
          create_element(tableHead, 'Produceret MBQ', 'th',   []);
          create_element(tableHead, 'Batch-nr.',      'th',   []);
          create_element(tableHead, 'Frigivet MBQ',   'th',   []);
          create_element(tableHead, 'Frigivet',       'th',   []);
          var tableBody = create_element(table, '','tbody',   []);
          for (let j = 0; j < response.data.length; j++){
            const order = response.data[j];
            var tableRow = create_element(tableBody,'','tr', []);
            create_element(tableRow, order.status,         'td', []);
            create_element(tableRow, order.orderID,        'td', []);
            create_element(tableRow, order.ordered_amount, 'td', []);
            create_element(tableRow, order.total_amount,   'td', []);
            create_element(tableRow, order.batchnr,        'td', []);
            create_element(tableRow, order.free_amount,    'td', []);
            if (order.free_dt != null) {
              create_element(tableRow, order.free_dt.substr(11,5), 'td', []);
            } else {
              create_element(tableRow, "", 'td', []);
            }
          }
        }        
      }

      } 
    );
  }

  var Date_onClick = function (div, date) {
    var jdiv = $(div);
    jdiv.on('click', function() {
      change_date(date);
      clear_order_table();
      fill_order_table(date);
    })

  };


  CalenderInstance = new CalenderFactory('calender',today, Date_function, Date_onClick, colorDict);
});
