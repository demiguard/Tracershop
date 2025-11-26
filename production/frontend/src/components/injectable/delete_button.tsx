import React from 'react'
import { IdempotentIcon } from '~/components/injectable/icons'
import { useWebsocket } from '~/contexts/tracer_shop_context'

export function DeleteButton({
  object,
  object_type,
  ...rest

}){
  const websocket = useWebsocket();

  function deleteFunc() : Promise<any> {
    if(!websocket){
      return Promise.resolve();
    }

    return websocket.sendDeleteModels(
      object_type, object
    );
  }

  return <IdempotentIcon
    src="/static/images/decline.svg"
    onClick={deleteFunc}
    {...rest}
  />
}