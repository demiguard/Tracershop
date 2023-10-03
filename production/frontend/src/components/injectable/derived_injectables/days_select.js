import React from "react";
import { Select, toOptions } from "../select";
import { DAYS_OBJECTS } from "../../../lib/constants";


export function DaysSelect(props){
  const daysOptions = toOptions(DAYS_OBJECTS, 'name', 'day')

  const newProps = {...props}
  newProps['options'] = daysOptions

  return (<Select{...newProps}/>);
}