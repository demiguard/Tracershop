import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { ArrayMap } from '~/lib/array_map';
import { TimeStamp } from '~/lib/chronomancy';
import { FormatDateStr } from '~/lib/formatting';
import { ITimeTableDataContainer } from '~/lib/data_structures'
import { JUSTIFY, PADDING } from '~/lib/styles';


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

function AbsoluteCell({children, number_of_columns,  offset = 0}){
  const width = `${(1 / number_of_columns) * 100}%`;
  const top = `${(Math.ceil(offset + 1) * TIME_TABLE_CELL_HEIGHT)}px`;

  return (<Row
    style={{...cssAbsoluteCell,
      width : width,
      top : top,
    }}
    >{children}</Row>);
}

function TimeColumn({TimeTableDataContainer,
                     columnHeader,
                     number_of_columns,
                     floating_objects}){

  const tableCells = [];
  const absoluteCells = [];


  for(let hour = TimeTableDataContainer.min_hour; hour <= TimeTableDataContainer.max_hour; hour++){
    tableCells.push(<Cell key={hour}></Cell>);
  }

  let i = 0;
  if(floating_objects instanceof ArrayMap){
    for(const [hour, objects] of floating_objects){
      if(!(TimeTableDataContainer.min_hour <= hour && hour <= TimeTableDataContainer.max_hour)){
        // The object would be rendered
        continue;
      }
      const offset = hour - TimeTableDataContainer.min_hour;
      absoluteCells.push(<AbsoluteCell
                            number_of_columns={number_of_columns}
                            offset={offset}
                            key={i * 100 + hour}>
                            {TimeTableDataContainer.cellFunction(objects)}
                         </AbsoluteCell>);
      i++;
    }
  }

  return (<PaddingLessCol>
    <TopCell>{TimeTableDataContainer.columnNameFunction(columnHeader)}</TopCell>
    {tableCells}
    {absoluteCells}
  </PaddingLessCol>);
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
export function TimeTable({TimeTableDataContainer}){
  const number_of_columns = TimeTableDataContainer.columns.size + 1;
  const hourlyCells = [];
  const timeColumns = [];

  for(let hour = TimeTableDataContainer.min_hour; hour <= TimeTableDataContainer.max_hour; hour++){
    hourlyCells.push(<Cell key={hour}>{`${FormatDateStr(hour)}:00:00`}</Cell>);
  }

  for(const [id, columnObject] of TimeTableDataContainer.columns) {
    timeColumns.push(<TimeColumn
      number_of_columns={number_of_columns}
      TimeTableDataContainer={TimeTableDataContainer}
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

function ColCell({children}){
  return <Col style={cssCell}>
    {children}
  </Col>
}

/**
 *
 * @param {{timeTableDataContainer:ITimeTableDataContainer}} param0
 */
export function RowMajorTimeTable({timeTableDataContainer}){
  const headers = [<ColCell key="0"></ColCell>].concat([...timeTableDataContainer.columns.values()].map(
      (column, i) => {return <ColCell key={i + 1}>{timeTableDataContainer.columnNameFunction(column)}</ColCell>}
  ));

  const times = [];
  for(let hour = timeTableDataContainer.min_hour; hour <= timeTableDataContainer.max_hour; hour++){
    const renderedColumns = [
      <Col
      data-testid={`hour-row-${hour}`}
      style={{
        ...PADDING.all.px0,
        ...JUSTIFY.center,
        border : "1px",
        borderStyle : "solid",
      }} key={hour}>{`${FormatDateStr(hour)}:00:00`}</Col>
    ];

    for(const i of timeTableDataContainer.columns.keys()){
      if (timeTableDataContainer.entryMapping.has(i)){
        const entries = timeTableDataContainer.entryMapping.get(i)

        if(entries.has(hour)){
          const hourlyEntries = entries.get(hour)
          renderedColumns.push(timeTableDataContainer.cellFunction(hourlyEntries, i));
        } else {
          renderedColumns.push(<Col style={{...PADDING.all.px0, border : "1px",
            borderStyle : "solid"}} key={i}></Col>);
        }
      } else {
        renderedColumns.push(<Col key={i}></Col>);
      }
    }

    times.push(<Row key={hour}>{renderedColumns}</Row>);
  }

  return (
  <Row>
    <Row>{headers}</Row>
    {times}
  </Row>);
}
