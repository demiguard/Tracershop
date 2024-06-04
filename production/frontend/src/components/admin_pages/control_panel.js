import React, { useContext, useState } from "react";
import { Container, Button, Card, Collapse } from "react-bootstrap";


import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import { ProcedureIdentifierTable } from "~/components/admin_pages/procedure_identifier_table";
import { OpenCloseButton } from "~/components/injectable/open_close_button";

export function ControlPanel(){
  const state = useTracershopState();
  const websocket = useWebsocket();

  const [showProcedures, setShowProcedures] = useState(false)

  function closeWebsocket(){
    websocket.close()
  }

  return (
    <Container>
      <Button onClick={closeWebsocket}>Luk Websocket</Button>
      <Card>
        <Card.Header>
          Procedures
          <OpenCloseButton open={showProcedures} setOpen={setShowProcedures}/>
        </Card.Header>
        <Collapse in showProcedures>
          <ProcedureIdentifierTable/>
        </Collapse>
      </Card>
    </Container>)
}