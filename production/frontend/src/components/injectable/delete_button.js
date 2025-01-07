import React from "react";
import { IdempotentIcon } from "~/components/injectable/icons";
import { useWebsocket } from "~/contexts/tracer_shop_context";

export function DeleteButton({
  dataType, data, callback=()=>{}, ...rest
}){
  const websocket = useWebsocket();

  async function onClickFunction(){
    const data = await websocket.sendDeleteModel(dataType, data);
    callback(data);
  }

  return (<IdempotentIcon
    src="/static/images/decline.svg"
    onClick={onClickFunction}
    {...rest}
  />);
}