import React from "react";
import { ClickableIcon } from "~/components/injectable/icons";
import { useWebsocket } from "~/components/tracer_shop_context";

export function DeleteButton({
  dataType, data, callback=()=>{}, ...rest
}){
  const websocket = useWebsocket();

  function onClick(){
    websocket.sendDeleteModel(dataType, data).then(
      (data) => {callback(data)}
    );
  }

  return (<ClickableIcon
    onClick={onClick}
    {...rest}
  />);
}