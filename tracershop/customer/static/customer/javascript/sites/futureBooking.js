
import { CalenderFactory } from "./libs/calender.js";
import { CustomerSelect } from "./libs/customerSelect.js";

var CalenderInstance;


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

}

var MonthApiCall = function (year, month) {

} 


$(function() { 
  var buttons = $(".tableButton");
  for ( let i = 0; i < buttons.length; i++) {
    var activeButton = $(buttons[i])
    activeButton.on('click', ShowHideData)
  };
  console.log(today);

  CalenderInstance = new CalenderFactory(
    'calender', 
    today,
    dateColoringFunction,
    DateOnClick,
    MonthApiCall,
    colorDict
    )

});