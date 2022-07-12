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

  }

  changeColors (year, month) {
  }

  getColor(datestring, ColorDict) {

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