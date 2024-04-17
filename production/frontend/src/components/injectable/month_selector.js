import React, { useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { Optional } from '~/components/injectable/optional';
import { useContainerDimensions } from '~/effects/dimensions';

function MonthRow(props){
  const {children, style,...rest} = props;

  return <Row style={{
    margin : "0px",
    height : "25%",
    ...style
  }}
   {...rest}
  >
    {children}
  </Row>
}

function MonthContainer({children, onClick}){

  return <Col
  onClick={onClick}
  style={{
    display : "flex",
    justifyContent : "center",
    textAlign : "center",
    alignItems : "center",
    border : "1px",
    borderStyle : "solid",
  }}><div>{children}</div></Col>
}

export function MonthSelector(props) {
  const {stateDate, setDate, callback, ...rest} = props

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempDate, setTempDate] = useState(stateDate);
  const monthSelectorRef = useRef(null);
  const { width } = useContainerDimensions(monthSelectorRef);

  function changeMonth(changeBy){
    const year  = stateDate.getFullYear();
    const month = stateDate.getMonth() + changeBy;
    const newMonth = new Date(year, month, 1, 12);

    setDate(newMonth);
    if(callback !== undefined){
      callback(newMonth);
    }
  }

  function changeTempYear(changeBy){
    const year  = tempDate.getFullYear() + changeBy;
    const month = tempDate.getMonth();
    const newTempDate = new Date(year, month, 1, 12);

    setTempDate(newTempDate)
  }

  function selectMonth(month){
    return () => {
      const newDate = new Date(tempDate.getFullYear(), month, 1, 12);
      setDate(newDate);
      if(callback !== undefined){
        callback(newDate);
      }
      setShowMonthPicker(false);
    }
  }

  // These values are in pixels
  const monthPickerWidth = 250;
  const leftOffset = (width - monthPickerWidth) / 2;

  const MonthPicker = <div
    style={{position: "relative",
    width : "0px",
    height : "0px",
  }}>
    <div style={{
      position : "absolute",
      width : `${monthPickerWidth}px`,
      height : "200px",
      background : "white",
      border : "2px",
      borderStyle : "solid",
      borderColor : "black",
      top : "0px",
      left : `${leftOffset}px`
    }}>
      <MonthRow>
        <MonthContainer onClick={() => {changeTempYear(-1)}}>
          <img
          aria-label="prev-year"
          className="tableButton"
          id="DecrementYear"
          alt="Sidste"
          src="/static/images/prev.svg"/>
        </MonthContainer>
        <MonthContainer>{tempDate.toLocaleString('default', {year: "numeric"})}</MonthContainer>
        <MonthContainer><img
          onClick={() => {changeTempYear(1)}}
          aria-label="next-year"
          className="tableButton"
          id="DecrementYear"
          alt="Sidste"
          src="/static/images/next.svg"/></MonthContainer>
      </MonthRow>
      <MonthRow>
        <MonthContainer onClick={selectMonth(0)}>Jan</MonthContainer>
        <MonthContainer onClick={selectMonth(1)}>Feb</MonthContainer>
        <MonthContainer onClick={selectMonth(2)}>Mar</MonthContainer>
        <MonthContainer onClick={selectMonth(3)}>Apr</MonthContainer>
      </MonthRow>
      <MonthRow>
        <MonthContainer onClick={selectMonth(4)}>Maj</MonthContainer>
        <MonthContainer onClick={selectMonth(5)}>Jun</MonthContainer>
        <MonthContainer onClick={selectMonth(6)}>Jul</MonthContainer>
        <MonthContainer onClick={selectMonth(7)}>Aug</MonthContainer>
      </MonthRow>
      <MonthRow>
        <MonthContainer onClick={selectMonth(8)}>Sep</MonthContainer>
        <MonthContainer onClick={selectMonth(9)}>Okt</MonthContainer>
        <MonthContainer onClick={selectMonth(10)}>Nov</MonthContainer>
        <MonthContainer onClick={selectMonth(11)}>Dec</MonthContainer>
      </MonthRow>
    </div>
  </div>

  return (<div style={{width : "100%"}}>
  <div style={{width : "100%"}} className='flex-row d-flex justify-content-around' ref={monthSelectorRef}>
    <div onClick={() => changeMonth(-1)}>
      <img
        aria-label="prev-month"
        className="tableButton"
        id="DecrementMonth"
        alt="Sidste"
        src="/static/images/prev.svg"/>
    </div>
    <div onClick={() => {setShowMonthPicker(
      b => !b
    )}}>
      <p style={{margin : "0px"}}>{stateDate.toLocaleString('default', {month:"long"})}</p>
      <p style={{margin : "0px"}}>{stateDate.toLocaleString('default', {year: "numeric"})}</p>
    </div>
      <div onClick={() => changeMonth(1)}>
        <img
          id="IncreaseMonth"
          alt="Næste"
          aria-label="next-month"
          className="tableButton"
          src="/static/images/next.svg"/>
      </div>
  </div>
      <Optional exists={showMonthPicker}>
        {MonthPicker}
      </Optional>
  </div>);
}