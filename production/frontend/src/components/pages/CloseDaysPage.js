import { ajax } from "jquery";
import React, { Component } from "react";
import { Calender } from "/src/components/injectables/calender";

import { FormatDateStr } from "/src/lib/formatting";

export class CloseDaysPage extends Component {
  constructor(props){
    super(props);

    this.state = {
      today : new Date()
    }

  }

  changeCloseDay (DateObject, Calender) {
    //ajax
    const DateStr     = String(DateObject.getFullYear()) + '-' + FormatDateStr(DateObject.getMonth() + 1) + '-' + FormatDateStr(DateObject.getDate());
    const newDateColors = Calender.state.DateColors;
    if (DateStr in newDateColors) {
      delete newDateColors[DateStr]
      ajax({
        url : "api/closeddays",
        type : "DELETE",
        datatype: "json",
        data : JSON.stringify({
          year : DateObject.getFullYear(),
          month : DateObject.getMonth() + 1, //
          day   : DateObject.getDate()
        })
      });

    } else {
      newDateColors[DateStr] = 1;
      ajax({
        url : "api/closeddays",
        type : "POST",
        datatype: "json",
        data : JSON.stringify({
          year : DateObject.getFullYear(),
          month : DateObject.getMonth() + 1, //
          day   : DateObject.getDate()
        })
      });
    }
    Calender.updateColor(newDateColors);

  }

  changeColors (year, month) {
    return ajax({
      url: "api/closeddays"
    });
  }

  getColor(datestring, ColorDict) {
    return (datestring in ColorDict) ? "ClosedDate" : "OpenDate";
  }


  render() {
    return(
    <div>
      <Calender
        date={this.state.today}
        onDayClick={this.changeCloseDay}
        updateColors={this.changeColors}
        getColor={this.getColor}
      ></Calender>
    </div>);
  }
}