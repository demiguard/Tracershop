import { ajax } from "jquery";
import React, { Component } from "react";
import { Calender, standardOrderMapping, producitonGetMonthlyOrders } from "../injectables/calender";

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


  render() {
    return(
    <div>
      <Calender
        date={this.state.today}
        onDayClick={this.changeCloseDay}
        onMonthChange={producitonGetMonthlyOrders(this.props.websocket)}
        getColor={standardOrderMapping(this.props.orders, this.props.t_orders, this.props.runs)}
      ></Calender>
    </div>);
  }
}