import { ajax } from "jquery";
import React, { Component } from "react";
import { JSON_ACTIVITY_ORDER, JSON_CLOSEDDATE, JSON_INJECTION_ORDER, JSON_RUN, KEYWORD_DDATE, PROP_WEBSOCKET, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_DELETE_DATA_CLASS } from "../../lib/constants";
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
    for(const [BDID, cdate] of this.props[JSON_CLOSEDDATE]){
      closedDateSet.add(cdate.ddate)
    }
    const dateStr = `${DateObject.getFullYear()}-${FormatDateStr(DateObject.getMonth() + 1)}-${FormatDateStr(FormatDateStr(DateObject.getDate()))}`
    if (closedDateSet.has(dateStr)){
      // Yeah my data structures REALLY are working against me here
      let data;
      for(const [_BDID, closeDate] of this.props[JSON_CLOSEDDATE]){
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
        onMonthChange={productionGetMonthlyOrders(this.props[PROP_WEBSOCKET])}
        getColor={standardOrderMapping(this.props[JSON_ACTIVITY_ORDER], this.props[JSON_INJECTION_ORDER], this.props[JSON_RUN], this.props[JSON_CLOSEDDATE])}
      ></Calender>
    </div>);
  }
}