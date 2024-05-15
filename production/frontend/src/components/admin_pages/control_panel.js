import React, { useContext } from "react";
import { Container, Button } from "react-bootstrap";


import { useTracershopState, useWebsocket } from "../tracer_shop_context";

export function ControlPanel(){
  const state = useTracershopState();
  const websocket = useWebsocket()

  function closeWebsocket(){
    websocket.close()
  }


  return (
    <Container>
      <Button onClick={closeWebsocket}>Luk Websocket</Button>
    </Container>)
}