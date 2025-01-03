import React from "react";
import { IdempotentIcon } from "~/components/injectable/icons";
import { useWebsocket } from "~/contexts/tracer_shop_context";

export function DeleteButton({
  dataType, data, callback=()=>{}, ...rest
}){
  const websocket = useWebsocket();

  console.log(websocket)

  function onClick(){
    return websocket.sendDeleteModel(dataType, data).then(
      (data) => {callback(data)}
    );
  }

  return (<IdempotentIcon
    src="/static/images/decline.svg"
    onClick={onClick}
    {...rest}
  />);
}