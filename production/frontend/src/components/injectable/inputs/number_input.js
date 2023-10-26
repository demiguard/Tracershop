import React from 'react'
import { FormControl } from 'react-bootstrap'

export function EditableInput(props){
  const newProps = {...props}

  if('canEdit' in props){
    if(!props['canEdit']){
      props['readOnly'] = true;

      delete newProps['onChange'];
    }

    delete newProps['canEdit'];
  }

  return <FormControl {...newProps} />
}