import React from "react";
import { Row } from "react-bootstrap";


export function ManyRows({children, max_length = 3}){
  const list_of_lists = [[]];

  for(const item of children){
    let last_list = list_of_lists[list_of_lists.length - 1];

    if(last_list.length >= max_length){
      list_of_lists.push([]);
      last_list = list_of_lists[list_of_lists.length - 1];
    }

    last_list.push(item);
  }

  const rows = [];
  let key = 1;

  for(const sublist of list_of_lists){
    rows.push(<Row key={key}>{sublist}</Row>);
    key++;
  }

  return <Row>
    {rows}
  </Row>;
}
