import React from 'react';
import propTypes  from 'prop-types';

import { FormatDateStr, formatTimeStamp } from '~/lib/formatting';

type TimeDisplayProps = {
  time : Date | string
}

export function TimeDisplay({time}: TimeDisplayProps){
  const text = (() => {
    let fTime = time;
    if(!fTime){
      return "Ukendt tidspunkt";
    }
    if(fTime instanceof Date) {
      return fTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit"});
    }
    if(fTime.length > 8){
      fTime = formatTimeStamp(fTime);
    }
    return fTime.substring(6,8) == "00" ? fTime.substring(0,5) : fTime;
  })();

  return text;
}
