import React from 'react'
import { INJECTION_USAGE, INJECTION_USAGE_NAMES } from '~/lib/constants'

export function InjectionUsage({usage}){
  if(usage === INJECTION_USAGE.human) {
    return <div>{INJECTION_USAGE_NAMES.human}</div>
  }

  if(usage === INJECTION_USAGE.animal) {
    return <div>{INJECTION_USAGE_NAMES.animal}</div>
  }

  if(usage === INJECTION_USAGE.other) {
    return <div>{INJECTION_USAGE_NAMES.other}</div>
  }

  return <div></div>
}