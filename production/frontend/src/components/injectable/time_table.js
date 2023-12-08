import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { ArrayMap } from '~/lib/array_map';
import { TimeStamp } from '~/lib/chronomancy';
import { FormatDateStr } from '~/lib/formatting';

const cssWeeklyTimeTable = {
  borderRadius: "1px",
  position : "relative",
  padding : "0px",
  margin : "0px",
};

const cssCell = {
  height: "50px",
  lineHeight: "50px",
  justifyContent: "center",
  alignItems: "center",
  borderStyle: "solid",
  borderColor: "black",
  borderWidth: "1px",
  padding : '0px',
  margin : '0px',
};

const cssTopCell = {
  ...cssCell,
  borderBottomWidth: "3px",
}

const cssAbsoluteCell = {
  lineHeight: "30px",
  height: "30px",
  backgroundColor: "lightblue",
  position: "absolute",
  justifyContent: "center",
  alignItems: "center",
  padding : '0px',
  margin : '0px',
}

function PaddingLessCol({children}){
  return (<Col style={{padding : '0px'}}>{children}</Col>)
}

function Cell({children}){
  return (<Row style={cssCell}>{children}</Row>);
}

function TopCell({children}){
  return (<Row style={cssTopCell}>{children}</Row>);
}




// Look man
// There is simply just too much functionality that is being injected here
// And I have NO idea how to reduce this
export function TimeTable({entries,
  column_objects = new Map(),
  floating_objects = [],
  floating_key_function = (_fo) => {return null;},
  floating_time_stamp_function = (_fo) => {return new TimeStamp(12, 0, 0)},
  column_name_function = () => {},
  inner_text_function = (entry) => {return <div></div>},
  time_table_entry_onclick = (entry) => {return () => {}},
  color_function = (_entry) => {return 'lightblue'},
  label_function = (_entry) => {return ""},
  startingHour = 6,
  stoppingHour = 14}){

  const startingTimeStamp = new TimeStamp(startingHour,0,0);
  const floatingMapping = new ArrayMap();
  const number_of_columns = column_objects.size + 1;

  for(const floating_object of floating_objects){
    floatingMapping.set(floating_key_function(floating_object),floating_object);
  }

  function AbsoluteCell({children, offset = 0}){
  const width = `${(1 / number_of_columns) * 100}%`;
  const top = `${(Math.ceil(offset + 1) * 50)}px`;

  return (<Row
    style={{...cssAbsoluteCell,
      width : width,
      top : top,
    }}
    >{children}</Row>);
  }

  function TimeColumn({columnHeader, floating_objects}){

    const tableCells = [];
    const absoluteCells = [];

    for(let hour = startingHour; hour <= stoppingHour; hour++){
      tableCells.push(<Cell key={hour}></Cell>);
    }

    for(const floating_object_index in floating_objects){
      const floating_object = floating_objects[floating_object_index];
      const floating_object_timeStamp = floating_time_stamp_function(floating_object);
      console.log(floating_object_timeStamp);
      const offset = floating_object_timeStamp.hour - startingTimeStamp.hour + (floating_object_timeStamp.minute / 60);
      absoluteCells.push(<AbsoluteCell offset={offset} key={floating_object_index}>{inner_text_function(floating_object)}</AbsoluteCell>);
    }

    return (<PaddingLessCol>
      <TopCell>{column_name_function(columnHeader)}</TopCell>
      {tableCells}
      {absoluteCells}
    </PaddingLessCol>);
    }

  const hourlyCells = [];
  const timeColumns = [];

  for(let hour = startingHour; hour <= stoppingHour; hour++){
    hourlyCells.push(<Cell key={hour}>{`${FormatDateStr(hour)}:00:00`}</Cell>);
  }

  for(const [id, columnObject] of column_objects) {
    timeColumns.push(<TimeColumn
      key={id}
      columnHeader={columnObject}
      floating_objects={floatingMapping.has(columnObject.id) ? floatingMapping.get(columnObject.id) : []}
    />);
  }

  return <Row style={cssWeeklyTimeTable}>
      <PaddingLessCol>
        <TopCell></TopCell>
        {hourlyCells}
      </PaddingLessCol>
      {timeColumns}
    </Row>
}
