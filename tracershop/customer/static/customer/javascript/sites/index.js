import { CalenderFactory } from "./libs/calender.js";

// Today is variable that's created from GET request, 
// since it's provided from Django

var CalenderInstance;





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
      console.log(data);
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
