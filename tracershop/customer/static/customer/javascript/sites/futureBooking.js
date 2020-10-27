
import { CalenderFactory } from "./libs/calender.js";


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


$(function() { 
  var buttons = $(".tableButton");
  for ( let i = 0; i < buttons.length; i++) {
    var activeButton = $(buttons[i])
    activeButton.on('click', ShowHideData)
  }
  
});