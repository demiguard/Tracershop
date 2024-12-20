import React from 'react'
import { renderDateTime } from '~/lib/formatting';

export function DatetimeDisplay(props){
  const {datetime, ...rest} = props;
  return <div {...rest}>{renderDateTime(datetime)}</div>
}
