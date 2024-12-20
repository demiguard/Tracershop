import React, { useContext, useState } from "react";
import { Container, Button, Card, Collapse, Col, Row } from "react-bootstrap";


import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { ProcedureIdentifierTable } from "~/components/admin_pages/procedure_identifier_table";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { JUSTIFY, CENTER, MARGIN, DISPLAY } from "~/lib/styles";

export function ControlPanel(){
  const state = useTracershopState();
  const websocket = useWebsocket();

  const [showProcedures, setShowProcedures] = useState(false);

  function closeWebsocket(){
    websocket.close();
  }

  return (
    <Container>
      <Row style={MARGIN.topBottom.px15}>
        <Col>
          <Button onClick={closeWebsocket}>Luk Websocket</Button>
        </Col>
        <Col>
          <Button onClick={() => {throw "exception!"}}>Raise Exception!</Button>
        </Col>
        <Col>
          <Button onClick={() => {console.log(state)}}>print state</Button>
        </Col>
      </Row>
      <Card>
        <Card.Header>
          <div style={JUSTIFY.between}>
            <div style={{...DISPLAY.FLEX, ...CENTER}}>Procedures</div>
            <div style={DISPLAY.FLEX}>
              <OpenCloseButton
                open={showProcedures}
                setOpen={setShowProcedures}
              />
            </div>
          </div>
        </Card.Header>
        <Collapse in={showProcedures}>
          <div>
            <ProcedureIdentifierTable/>
          </div>
        </Collapse>
      </Card>
    </Container>)
}