import React from 'react'
import { Select, toOptionsFromEnum} from '../select'
import { INJECTION_USAGE } from '../../../lib/constants'


export function UsageSelect(props){
  const newProps = {...props}

  if('canEdit' in props){
    if(!props['canEdit']){
      newProps['disabled'] = true;
      delete newProps['onChange']
    }
    delete newProps['canEdit']
  }

  function nameFunction(_, id){
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