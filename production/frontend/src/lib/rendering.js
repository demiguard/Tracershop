import React, {} from "react";
import { HoverBox } from "../components/injectable/hover_box.js";
import { ClickableIcon } from "../components/injectable/icons.js";
import { FormatDateStr } from "./formatting.js";

/**
  * This function is for building Tables, it creates a single row.
  * It has a variable amount of entries allowing to be used for creation of all Tables.
  *
  * @param {Number} key - The key of the constructed row
  * @param {Array<Object>} list_of_tds This is the list of tds, can contain typescirpt
  * @returns {JSX.Element} - Table row with index key
  */
export function renderTableRow(key, list_of_tds) {
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

/**
 * @deprecated
 * @param {*} comment
 * @returns
 */
export function renderComment(comment){
  if(comment){
    const CommentImage = <ClickableIcon src={"/static/images/comment.svg"}/>
    return <HoverBox
      Base={CommentImage}
      Hover={<div>{comment}</div>}
    />
  }
  return null;
};
