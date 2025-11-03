import React from 'react'
import { IdempotentIcon } from '~/components/injectable/icons'
import { useWebsocket } from '~/contexts/tracer_shop_context'

export function DeleteButton({
  label,
  object,
  object_type
}){
  const websocket = useWebsocket();

  function deleteFunc() {
    if(!websocket){
      return Promise.resolve();
    }

    websocket.sendDeleteModels(
      object_type, object
    )
  }

  return <IdempotentIcon
    src="/static/images/decline.svg"
    onClick={deleteFunc}
    label={label}
  />
}