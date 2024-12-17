import React, { useState } from "react";
import { CommitButton } from "~/components/injectable/commit_button";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { Printer } from "~/dataclasses/dataclasses";

function PrinterRow({
  printer
}){
  const [printerState, setPrinterState] = useState(printer);

  const creating = printer.id === -1;

  const printerNameHTML  = creating ? <div>{printer.name}</div> : <div></div>;
  const printerIPHTML    = creating ? <div></div> : <div></div>;
  const printerPortHTML  = creating ? <div></div> : <div></div>;
  const printerLabelHTML = creating ? <div></div> : <div></div>;

  return (<Row>
    <Col>{}</Col>
    <Col>{}</Col>
    <Col>{}</Col>
    <Col>{}</Col>
    <Col>
      <CommitButton

      />
    </Col>
  </Row>);
}



export function PrinterOverviewPage(){
  const state = useTracershopState();

  const printerRows = [];
  for(const printer of state.printer.values()){
    printerRows.push(
      <PrinterRow
        key={printer.id}
        printer={printer}
      />);
  }

  printerRows.push(<PrinterRow
    key={-1}
    printer={new Printer(-1, "", "", "", "")}
  />);

  return <Container>
    <Row>
      <Col>Navn</Col>
      <Col>Ip addresse</Col>
      <Col>Port</Col>
      <Col>Label printer</Col>
      <Col></Col>
    </Row>
    {printerRows}
  </Container>
}