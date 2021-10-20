import React, {} from "react";

import { noop } from "./utils";

export { renderStatusImage , renderTableRow}


function renderStatusImage(status, func) {
  
  const onclickFunc = (func === undefined) ? noop : func
  if (status === 1) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard1.svg"></img>);
  if (status === 2) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard2.svg"></img>);
  if (status === 3) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard3.svg"></img>);
  if (status === 0) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard0.svg"></img>);

  throw "Status not supproted!";
}

function renderTableRow(key, list_of_tds) {  
  /*
   * This function is for building Tables, it creates a single row.
   * It has a variable amount of entries allowing to be used for creation of all Tables
   * The function was introduced late in the development, so might not have been used everywhere
   * But its usage is on the todo list.
   * 
   * Args: 
   *    key - Int :    The key that's appied to tr
   *    list_of_keys : List of renderable objects. The order of the list matters, where the first object is rendered first .
   * Returns
   *  rendered typescript.
  */
  var index = 0 

  const tds = []
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
