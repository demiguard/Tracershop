import React from 'react'
import { ClickableIcon } from './icons';
import { useWebsocket } from '../tracer_shop_context';

export function CommitButton({
  temp_object,
  validate,
  object_type,
  edit_image="/static/images/update.svg",
  add_image="/static/images/plus.svg",
}){
  const websocket = useWebsocket();

  const tempObjectExists = temp_object.id !== undefined
                            && temp_object.id !== null
                            && 0 < temp_object.id;

  const image_src = (tempObjectExists) ? edit_image : add_image

  function onClick(){
    // Guard statement
    const [valid, formattedObject] = validate();

    if(!valid) {
      return;
    }

    if(tempObjectExists){
      websocket.sendEditModel(object_type, formattedObject);
    } else {
      websocket.sendCreateModel(object_type, formattedObject);
    }
  }

  return <ClickableIcon
    src={image_src}
    onClick={onClick}
  />
}