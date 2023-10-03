import React from 'react'
import { Select, toOptionsFromEnum} from '../select'
import { INJECTION_USAGE } from '../../../lib/constants'


export function UsageSelect(props){
  const newProps = {...props}

  function nameFunction(name, id){
    if(id === INJECTION_USAGE.human){
      return 'Human'
    }
    if(id === INJECTION_USAGE.animal){
      return 'Dyr'
    }
    if(id === INJECTION_USAGE.other){
      return 'Andet'
    }
  }

  newProps.options = toOptionsFromEnum(INJECTION_USAGE, nameFunction);

  return(<Select
    {...newProps}
  />)
}