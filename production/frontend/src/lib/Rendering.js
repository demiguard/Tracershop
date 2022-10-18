import React, {} from "react";
import { FormatDateStr } from "/src/lib/formatting";
import { Button, Form, Image } from "react-bootstrap";
import ReactHover, { Trigger, Hover  } from "react-hover";

import { noop } from "/src/lib/utils";

export function renderStatusImage(status, func) {
  const onclickFunc = (func === undefined) ? noop : func
  if (status === 1) return renderClickableIcon("/static/images/clipboard1.svg", onclickFunc);
  if (status === 2) return renderClickableIcon("/static/images/clipboard2.svg", onclickFunc);
  if (status === 3) return renderClickableIcon("/static/images/clipboard3.svg", onclickFunc);
  if (status === 0) return renderClickableIcon("/static/images/clipboard0.svg", onclickFunc);

  throw `Status ${status} not supproted!`;
}

export function renderTableRow(key, list_of_tds) {
  /**
   * This function is for building Tables, it creates a single row.
   * It has a variable amount of entries allowing to be used for creation of all Tables
   * The function was introduced late in the development, so might not have been used everywhere
   * But its usage is on the todo list.
   *
   * @param {Number} key - The key that's appied to row
   * @param {Array<Object>} list_of_tds This is the list of tds, can contain typescirpt
   * @returns {JSX.Element} - Type script that contains a table row with index key
   *
   *
   *  rendered typescript.
  */
  var index = 0;

  const tds = [];
  for(let td of list_of_tds){
    tds.push((<td key={index}>{td}</td>));
    index++;
  }

  return(
    <tr key={key}>
      {tds}
    </tr>
  )
}

/** Parses a date object into a danish formatted string
 *
 * @param {String} dateString - The String to be converted into a date object to be converted and back again
 * @returns {String} - the formatted string
 */
export function renderDateTime(dateString){
  const dateObject = new Date(dateString);
  const hours    = FormatDateStr(dateObject.getHours());
  const minutes  = FormatDateStr(dateObject.getMinutes());
  const day      = FormatDateStr(dateObject.getDate());
  const month    = FormatDateStr(dateObject.getMonth() + 1);
  const year     = String(dateObject.getFullYear());

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}


export function renderSelect(Options, valueKey, nameKey, OnChange, initialValue){
  const Rendered = [];

  for(const Option of Options){
    const value = Option[valueKey];
    const name = Option[nameKey];
    Rendered.push(<option value={value} key={value}>{name}</option>);
  }

  return(
    <Form.Select value={initialValue} onChange={OnChange}>
      {Rendered}
    </Form.Select>
  );
}

export function renderComment(comment){
  const TriggerOptions = {
    followCursor:false,
    shiftX: 20,
    shiftY: 0
  };

  if(comment) {
    return(
      <ReactHover options={TriggerOptions}>
        <Trigger type="trigger">
          <img src="/static/images/comment.svg" className="statusIcon"></img>
        </Trigger>
        <Hover type="hover">
          <div className="CommentDiv">
            {comment}
          </div>
        </Hover>
      </ReactHover>
    );
  } else {
    return ("");
  }
};

export function renderClickableIcon(imagePath, func){
  const onClickFunc = (func === undefined) ? noop : func
  return (
    <Button variant="outline-light" onClick={onClickFunc}>
      <Image className="statusIcon" src={imagePath}/>
    </Button>
  )
}
