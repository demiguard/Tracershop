import { ajax } from "jquery";
import React, { Component } from "react";
import { JSON_CLOSEDDATE, KEYWORD_DDATE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS } from "../../lib/constants";
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
    const data = {}
    data[KEYWORD_DDATE] = `${DateObject.getFullYear()}-${FormatDateStr(DateObject.getMonth() + 1)}-${FormatDateStr(FormatDateStr(DateObject.getDate()))}`
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
    message[WEBSOCKET_DATA] = data;
    message[WEBSOCKET_DATATYPE] = JSON_CLOSEDDATE;
  }


  render() {
    return(
    <div>
      <Calender
        date={this.state.today}
        onDayClick={this.changeCloseDay}
        onMonthChange={producitonGetMonthlyOrders(this.props.websocket)}
        getColor={standardOrderMapping(this.props.orders, this.props.t_orders, this.props.runs)}
        websocket={this.props.websocket}
      ></Calender>
    </div>);
  }
}