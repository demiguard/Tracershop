import React from 'react'
import { renderDateTime } from '~/lib/formatting';

export function DatetimeDisplay({datetime}){
  return renderDateTime(datetime)
}
