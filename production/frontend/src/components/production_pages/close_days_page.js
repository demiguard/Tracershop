import { ajax } from "jquery";
import React, { Component } from "react";
import { JSON_CLOSEDDATE, KEYWORD_DDATE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_DELETE_DATA_CLASS } from "../../lib/constants";
import { Calender, standardOrderMapping, productionGetMonthlyOrders } from "../injectable/calender";

import { FormatDateStr } from "../../lib/formatting.js";

export class CloseDaysPage extends Component {
  constructor(props){
    super(props);

    this.state = {
      today : new Date()
    }

  }

  changeCloseDay (DateObject, Calender) {
    const closedDateSet = new Set();
    for(const [BDID, cdate] of this.props.closeddates){
      closedDateSet.add(cdate.ddate)
    }
    const dateStr = `${DateObject.getFullYear()}-${FormatDateStr(DateObject.getMonth() + 1)}-${FormatDateStr(FormatDateStr(DateObject.getDate()))}`
    if (closedDateSet.has(dateStr)){
      // Yeah my data structures REALLY are working against me here
      let data;
      for(const [_BDID, closeDate] of this.props.closeddates){
        if (closeDate.ddate == dateStr){
          data = closeDate;
          break;
        }
      }
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_DELETE_DATA_CLASS);
      message[WEBSOCKET_DATATYPE] = JSON_CLOSEDDATE;
      message[WEBSOCKET_DATA] = data;
      this.props.websocket.send(message);
    } else { // Delete it
      const data = {}
      data[KEYWORD_DDATE] = dateStr
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
      message[WEBSOCKET_DATA] = data;
      message[WEBSOCKET_DATATYPE] = JSON_CLOSEDDATE;
      this.props.websocket.send(message);
    }
  }


  render() {
    return(
    <div>
      <Calender
        date={this.state.today}
        onDayClick={this.changeCloseDay.bind(this)}
        onMonthChange={productionGetMonthlyOrders(this.props.websocket)}
        getColor={standardOrderMapping(this.props.orders, this.props.t_orders, this.props.runs, this.props.closeddates)}
      ></Calender>
    </div>);
  }
}