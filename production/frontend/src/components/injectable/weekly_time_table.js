import React from "react"
import { Col, Row } from "react-bootstrap"
import WeeklyTimeTableStyles from '../../css/weekly_time_table.module.css'
import { FormatDateStr } from "../../lib/formatting";

function PaddingLessCol({children}){
  return (<Col style={{padding : '0px'}}>{children}</Col>)
}

function Cell({children}){
  return (<Row style={{
      padding : '0px',
      margin : '0px',
    }}
    className={WeeklyTimeTableStyles.Cell}>
      {children}
  </Row>)
}

function TopCell({children}){
  return (<Row
    style={{
      padding : '0px',
      margin : '0px',
    }}
    className={`${WeeklyTimeTableStyles.Cell} ${WeeklyTimeTableStyles.TopCell}`}>{children}</Row>);
}

function AbsoluteCell({
    children,
    onClick = () => {},
    day,
    timeSlots = 0,
    color = 'lightblue',
    label = "",
   }){
  return (<Row
    style={{
      padding : '0px',
      backgroundColor : color,
      top : `calc(${timeSlots + 1} * 50px + 0px)`,
      left : `calc(25px + ${day + 1} * (12.5% - 3px))`,
      width: "calc(12.5% - 5px)",
    }}
    aria-label={label}
    onClick={onClick}
    className={`${WeeklyTimeTableStyles.AbsoluteCell}`}>{children}</Row>)
}

export function WeeklyTimeTable({day_function,
                                 hour_function,
                                 time_table_entries,
                                 inner_text_function = (entry) => {return <div></div>},
                                 time_table_entry_onclick = (entry) => {return () => {}},
                                 color_function = (_entry) => {return 'lightblue'},
                                 label_function = (_entry) => {return ""},
                                 startingHour = 6,
                                 stoppingHour = 14}){
  const entries = [];

  if (!(startingHour <= stoppingHour)){
    // Note the reason for this weird way of writing starting hour > stopping
    // hour. Is how this interact with undefined / incomparable objects
    const errorString = `Starting hour ${startingHour} greater than ${stoppingHour}`
    throw errorString;
  }

  let key = 0;
  for(const entry of time_table_entries){
    const entry_day = day_function(entry)
    const entry_hour = hour_function(entry)
    const entry_color = color_function(entry)
    const innerText = inner_text_function(entry)
    const label = label_function(entry)


    entries.push(<AbsoluteCell
                    label={label}
                    color={entry_color}
                    timeSlots={entry_hour - startingHour}
                    key={key}
                    day={entry_day}
                    onClick={() => {time_table_entry_onclick(entry)}}
                    >{innerText}
                 </AbsoluteCell>)
    key++;
  }

  const hourlyCells = []
  const TableCells = []

  for(let hour = startingHour; hour <= stoppingHour; hour++){
    hourlyCells.push(<Cell key={hour}>{`${FormatDateStr(hour)}:00:00`}</Cell>)
    TableCells.push(<Cell key={hour}/>)
  }

  return (
  <Row
    className={WeeklyTimeTableStyles.WeeklyTimeTable}
    style={{position : "relative"}}
  >
    <PaddingLessCol>
      <TopCell></TopCell>
      {hourlyCells}
    </PaddingLessCol>
    <PaddingLessCol>
      <TopCell>Mandag</TopCell>
      {TableCells}
    </PaddingLessCol>
    <PaddingLessCol>
      <TopCell>Tirsdag</TopCell>
      {TableCells}
    </PaddingLessCol>
    <PaddingLessCol>
      <TopCell>Onsdag</TopCell>
      {TableCells}
    </PaddingLessCol>
    <PaddingLessCol>
      <TopCell>Torsdag</TopCell>
      {TableCells}
    </PaddingLessCol>
    <PaddingLessCol>
      <TopCell>Fredag</TopCell>
      {TableCells}
    </PaddingLessCol>
    <PaddingLessCol>
      <TopCell>Lørdag</TopCell>
      {TableCells}
    </PaddingLessCol>
    <PaddingLessCol>
      <TopCell>Søndag</TopCell>
      {TableCells}
    </PaddingLessCol>
    {entries}
  </Row>
  )
}