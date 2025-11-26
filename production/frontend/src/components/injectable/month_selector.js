import React, { useRef, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { Optional } from '~/components/injectable/optional';
import { useContainerDimensions } from '~/effects/dimensions';
import { FONT, MARGIN, FONT_SIZE } from '~/lib/styles';

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

function MonthContainer({children, onClick, style = {}, ...rest}){
  const [styleState, setStyleState] = useState({background : "#FFFFFF"})

  function onHover(){
    if(onClick){
      setStyleState({
        background : "#bdfffd"
      })
    }
  }

  function onLeave(){
    if(onClick){
      setStyleState({
        background : "#ffffff"
      })
    }
  }

  return <Col
  {...rest}
  onMouseEnter={onHover}
  onMouseLeave={onLeave}
  onClick={onClick}
  style={{
    ...style,
    display : "flex",
    justifyContent : "center",
    textAlign : "center",
    alignItems : "center",
    border : "1px",
    borderStyle : "solid",
    ...styleState
  }}><div>{children}</div></Col>
}

export function MonthSelector({stateDate, setDate, callback, ...rest}) {
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
        <MonthContainer aria-label="year">{tempDate.toLocaleString('default', {year: "numeric"})}</MonthContainer>
        <MonthContainer
          onClick={() => {changeTempYear(1)}}
        ><img
          aria-label="next-year"
          className="tableButton"
          id="DecrementYear"
          alt="Sidste"
          src="/static/images/next.svg"/></MonthContainer>
      </MonthRow>
      <MonthRow>
        <MonthContainer aria-label={"jan"} onClick={selectMonth(0)}>Jan</MonthContainer>
        <MonthContainer aria-label={"feb"} onClick={selectMonth(1)}>Feb</MonthContainer>
        <MonthContainer aria-label={"mar"} onClick={selectMonth(2)}>Mar</MonthContainer>
        <MonthContainer aria-label={"apr"} onClick={selectMonth(3)}>Apr</MonthContainer>
      </MonthRow>
      <MonthRow>
        <MonthContainer aria-label={"may"} onClick={selectMonth(4)}>Maj</MonthContainer>
        <MonthContainer aria-label={"jul"} onClick={selectMonth(5)}>Jun</MonthContainer>
        <MonthContainer aria-label={"jun"} onClick={selectMonth(6)}>Jul</MonthContainer>
        <MonthContainer aria-label={"aug"} onClick={selectMonth(7)}>Aug</MonthContainer>
      </MonthRow>
      <MonthRow>
        <MonthContainer aira-label={"sep"} onClick={selectMonth(8)}>Sep</MonthContainer>
        <MonthContainer aira-label={"oct"} onClick={selectMonth(9)}>Okt</MonthContainer>
        <MonthContainer aira-label={"nov"} onClick={selectMonth(10)}>Nov</MonthContainer>
        <MonthContainer aira-label={"dec"} onClick={selectMonth(11)}>Dec</MonthContainer>
      </MonthRow>
    </div>
  </div>

  return (<div style={{width : "100%", paddingTop : "7px"}}>
  <div style={{width : "100%"}} className='flex-row d-flex justify-content-around' ref={monthSelectorRef}>
    <div onClick={() => changeMonth(-1)}>
      <img
        aria-label="prev-month"
        className="tableButton"
        id="DecrementMonth"
        alt="Sidste"
        src="/static/images/prev.svg"/>
    </div>
    <div
      aria-label='toggle-picker'
      onClick={() => {setShowMonthPicker(b => !b)}}
    >
      <p style={{...MARGIN.all.px0, ...FONT.bold, ...FONT_SIZE.em1p25 }}>{stateDate.getDate()}. {stateDate.toLocaleString('default', {month:"long"})}</p>
      <p style={{...MARGIN.all.px0, ...FONT.bold, }}>{stateDate.toLocaleString('default', {year: "numeric"})}</p>
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