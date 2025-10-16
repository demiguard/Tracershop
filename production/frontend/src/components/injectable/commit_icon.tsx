import React from 'react'
import { ClickableIcon, IdempotentIcon } from './icons';
import { useWebsocket } from '../../contexts/tracer_shop_context';


export function CommitIcon({
  temp_object,
  validate,
  object_type,
  label="",
  callback=(arg)=>{},
  edit_image="/static/images/update.svg",
  add_image="/static/images/plus2.svg",
}){
  const websocket = useWebsocket();

  const tempObjectExists = temp_object.id !== undefined
                            && temp_object.id !== null
                            && 0 <= temp_object.id;

  const image_src = (tempObjectExists) ? edit_image : add_image

  function onClick(){
    // Guard statement
    const validate_output = validate();

    let valid, formattedObject;

    if(typeof validate_output === "boolean"){
      valid = validate_output;
      formattedObject = temp_object
    } else {
      [valid, formattedObject] = validate_output;
    }

    if(!valid) {
      return Promise.resolve();
    }

    const websocket_function = tempObjectExists ?
        websocket.sendEditModel.bind(websocket)
      : websocket.sendCreateModel.bind(websocket);

    return websocket_function(object_type, formattedObject).then(
      (response) => { callback(response); }
    );
  }

  return <IdempotentIcon
    label={label}
    src={image_src}
    beforeInjection={(svg) => {
      svg.setAttribute('fill', 'green');
    }}
    onClick={onClick}
  />
}