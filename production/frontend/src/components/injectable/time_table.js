import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { ArrayMap } from '~/lib/array_map';
import { TimeStamp } from '~/lib/chronomancy';
import { FormatDateStr } from '~/lib/formatting';
import { ITimeTableDataContainer } from '~/lib/data_structures'


export const TIME_TABLE_CELL_HEIGHT = 50;
export const TIME_TABLE_CELL_HEIGHT_PIXELS = `${TIME_TABLE_CELL_HEIGHT}px`;


const cssWeeklyTimeTable = {
  borderRadius: "1px",
  position : "relative",
  padding : "0px",
  margin : "0px",
};

const cssCell = {
  height: TIME_TABLE_CELL_HEIGHT_PIXELS,
  lineHeight: TIME_TABLE_CELL_HEIGHT_PIXELS,
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
  lineHeight: TIME_TABLE_CELL_HEIGHT_PIXELS,
  height: TIME_TABLE_CELL_HEIGHT_PIXELS,
  backgroundColor: "lightblue",
  position: "absolute",
  justifyContent: "center",
  alignItems: "center",
  padding : '0px',
  margin : '0px',
  border : '2px',
  borderColor : '#0000AA',
  borderStyle : 'solid'
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

/**
 *
 * @param {{
 *   TimeTableDataContainer : ITimeTableDataContainer
 * }} param0
 * @returns
 */
export function TimeTable({entries,
  TimeTableDataContainer,
  column_objects = new Map(),
  floating_objects = [],
  floating_key_function = (_fo) => {return null;},
  floating_time_stamp_function = (_fo) => {return new TimeStamp(12, 0, 0)},
  column_name_function = () => {},
  inner_text_function = (entry) => {return <div></div>},
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
  const top = `${(Math.ceil(offset + 1) * TIME_TABLE_CELL_HEIGHT)}px`;

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

    for(let hour = TimeTableDataContainer.min_hour; hour <= TimeTableDataContainer.max_hour; hour++){
      tableCells.push(<Cell key={hour}></Cell>);
    }

    if(floating_objects instanceof ArrayMap){
      for(const [hour, objects] of floating_objects){
        if(!(TimeTableDataContainer.min_hour < hour && hour < TimeTableDataContainer.max_hour)){
          // The object would be rendered
          continue;
        }
        const offset = hour - TimeTableDataContainer.min_hour;
        absoluteCells.push(<AbsoluteCell offset={offset} key={hour}>
          {TimeTableDataContainer.cellFunction(objects)}
        </AbsoluteCell>)
      }
    }

    return (<PaddingLessCol>
      <TopCell>{TimeTableDataContainer.columnNameFunction(columnHeader)}</TopCell>
      {tableCells}
      {absoluteCells}
    </PaddingLessCol>);
    }

  const hourlyCells = [];
  const timeColumns = [];

  for(let hour = TimeTableDataContainer.min_hour; hour <= TimeTableDataContainer.max_hour; hour++){
    hourlyCells.push(<Cell key={hour}>{`${FormatDateStr(hour)}:00:00`}</Cell>);
  }

  for(const [id, columnObject] of TimeTableDataContainer.columns) {
    timeColumns.push(<TimeColumn
      key={id}
      columnHeader={columnObject}
      floating_objects={TimeTableDataContainer.entryMapping.has(id) ? TimeTableDataContainer.entryMapping.get(id) : new ArrayMap()}
    />);
  }

  const fontSize = Math.min(1, 1.5 - (timeColumns.length) / 8 );

  return <Row style={{...cssWeeklyTimeTable,
      fontSize : `${fontSize}rem`
    }}
    aria-label='TimeTable'
    >
      <PaddingLessCol>
        <TopCell></TopCell>
        {hourlyCells}
      </PaddingLessCol>
      {timeColumns}
    </Row>
}
