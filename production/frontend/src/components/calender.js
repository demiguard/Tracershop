import React, { Component } from "react";
import { ajax, ajaxSetup } from "jquery";
import { Row } from "react-bootstrap";


import { FormatDateStr } from './lib/formatting'
import {DAYS, DAYS_PER_WEEK} from './lib/constants'

export { Calender }

export default class Calender extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeMonth : this.props.date,  //This is because when you change the month in the calender, you should not update the orders
      DateColors  : {}
    }
    this.updateColors(
      this.props.date.getFullYear(),
      this.props.date.getMonth()
    )
    console.log(this.props.date);
    console.log(this.state.activeMonth);
  }

  componentDidUpdate(prevProps) {

  }

  changeMonth(changeby) {
    const year  = this.state.activeMonth.getFullYear();
    const month = this.state.activeMonth.getMonth() + changeby;
    
    this.setState({...this.state,
      activeMonth : new Date(year, month, 1)
    });
    this.updateColors(year, month);
  }

  updateColors(year, month) {
    ajax({
      url : "api/monthcolor",
      type:"POST",
      dataType : "json",

      data : JSON.stringify({
        month : month + 1,
        year  : year
      }),
    }).then((res) => {
      this.setState({...this.state, DateColors: res})
    }) 
  }

  getStatusClass(StatusValue){
    return "date-status"+ String(StatusValue)
  }

  DaysInAMonth(year, month){
     //This takes advantage of javascript date system.
     // Since the "zeroth" day of a month doesn't exists (* Yeah 0-index is not for days *)
     // The date time system creates the last day of the month before.
     // Then just select the date
    return new Date(year, month,0).getDate();
  };

  LastmondayInLastMonth(year,month){
    var pivot = 1;
    var pivotDate = new Date(year, month, pivot);
    while(pivotDate.getDay() != DAYS.MONDAY){
      pivot--;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

  FirstSundayInNextMonth(year,month){
    var pivot = this.DaysInAMonth(year, month);
    var pivotDate = new Date(year, month, pivot);
    while(pivotDate.getDay() != DAYS.SUNDAY){
      pivot++;
      pivotDate = new Date(year, month, pivot);
    }
    return pivot;
  };

  renderDay(date) {
    const DateObject  = new Date(this.state.activeMonth.getFullYear(), this.state.activeMonth.getMonth(), date);
    const DateStr     = String(DateObject.getFullYear()) + '-' + FormatDateStr(DateObject.getMonth() + 1) + '-' + FormatDateStr(DateObject.getDate());
    var StatusClass = "";
    if (DateStr in this.state.DateColors) {
      StatusClass = this.getStatusClass(this.state.DateColors[DateStr]);
    } else {
      StatusClass = this.getStatusClass(55);
    }

    return (
      <div className={"calender-row date-base-class " + StatusClass}  onClick={() => this.props.onDayClick(DateObject)}> {DateObject.getDate()}</div>
    );
  }


  renderWeek(startingDate) {
    return(
      <div className="d-flex weekrow" key={startingDate}>
        {this.renderDay(startingDate)}
        {this.renderDay(startingDate + 1)}
        {this.renderDay(startingDate + 2)}
        {this.renderDay(startingDate + 3)}
        {this.renderDay(startingDate + 4)}
        {this.renderDay(startingDate + 5)}
        {this.renderDay(startingDate + 6)}
      </div>
    );
  }



  render() {    
    var startingDate = this.LastmondayInLastMonth(this.state.activeMonth.getFullYear(), this.state.activeMonth.getMonth())
    const EndingDate = this.FirstSundayInNextMonth(this.state.activeMonth.getFullYear(), this.state.activeMonth.getMonth())
    
    const weeks = [];

    while (startingDate <= EndingDate) {
      weeks.push((this.renderWeek(startingDate)));
      startingDate += DAYS_PER_WEEK;
    }

    return (
    <div className="calender">
      <div className="calender-header flex-row d-flex justify-content-around">
        <div onClick={() => this.changeMonth(-1)}>
          <img className="tableButton" src="/static/images/prev.svg"/>
        </div>
        <div>
          {this.state.activeMonth.toLocaleString('default', {month:"long"})}
        </div>
        <div onClick={() => this.changeMonth(1)}>
          <img className="tableButton" src="/static/images/next.svg"/>
        </div>
      </div>
        <div className="calender-dates d-flex">
          <div className="calender-row"> Søn</div>
          <div className="calender-row"> Man</div>
          <div className="calender-row"> Tir</div>
          <div className="calender-row"> Ons</div>
          <div className="calender-row"> Tor</div>
          <div className="calender-row"> Fre</div>
          <div className="calender-row"> Lør</div>
        </div>
      {weeks}
    </div>);
  }
}