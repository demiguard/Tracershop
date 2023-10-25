import React from 'react';
import propTypes  from 'prop-types';

import { FormatDateStr } from '~/lib/formatting';

/**
 * Display for time stamps 
 * @param {{
 * time : String | Date
 * }} param0 
 * @returns 
 */
export function TimeDisplay({time}){
  if(time instanceof Date){
    return <div>{FormatDateStr(time.getHours())}:{FormatDateStr(time.getMinutes())}</div>
  }

  if(time.substring(6,8) == "00") {
    return <div>{time.substring(0,5)}</div>
  }

  return <div>{time}</div>
}

TimeDisplay.propType = {
  time : propTypes.oneOf([propTypes.string.isRequired, propTypes.objectOf(Date)])
}