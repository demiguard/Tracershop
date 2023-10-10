import React, { useContext } from "react";
import { Container } from "react-bootstrap";

import { PingServiceConfig } from "./subcomponents.js/ping_service_config";
import { useTracershopState } from "../tracer_shop_context";

export function ControlPanel(props){
  const state = useTracershopState()
  console.log(state);

  return (
    <Container>
      <PingServiceConfig
        {...props}
      />

    </Container>)
}