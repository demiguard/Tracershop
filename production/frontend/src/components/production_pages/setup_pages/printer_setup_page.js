import React, { useState } from "react";
import { Col, Container, FormControl, Row } from "react-bootstrap";
import { CommitButton } from "~/components/injectable/commit_button";
import { DeleteButton } from "~/components/injectable/delete_button";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { Printer } from "~/dataclasses/dataclasses";
import { DATA_PRINTER } from "~/lib/shared_constants";
import { setTempObjectToEvent } from "~/lib/state_management";


function PrinterRow({
  printer
}){
  const [printerState, setPrinterState] = useState(printer);


  const creating = printer.id === -1;
  const showCreateButton = Boolean(creating && printerState.name && printerState.ip && printerState.port);

  const printerNameHTML  = creating ? <TracershopInputGroup>
    <FormControl
      value={printerState.name}
      onChange={setTempObjectToEvent(setPrinterState, 'name')}
    />
  </TracershopInputGroup> : <div>{printer.name}</div>;
  const printerIPHTML    = creating ?
    <TracershopInputGroup>
      <FormControl
        value={printerState.ip}
        onChange={setTempObjectToEvent(setPrinterState, 'ip')}
      />
    </TracershopInputGroup> : <div>{printer.ip}</div>;
  const printerPortHTML  = creating ?
    <TracershopInputGroup>
      <FormControl
        value={printerState.port}
        onChange={setTempObjectToEvent(setPrinterState, 'port')}
      />
    </TracershopInputGroup> : <div>{printer.port}</div>;
  const printerLabelHTML = creating ? <div></div> : <div>{printer.label_printer}</div>;
  const actionButton = creating ?
    <Optional exists={showCreateButton}>
      <CommitButton
        validate={
          () => {
            return [printerState.name && printerState.ip && printerState.port, printerState];
          }
        }
        temp_object={printerState}
        object_type={DATA_PRINTER}
        callback={() => {
          setPrinterState(
            new Printer(-1, "", "", "", "")
          );
        }}
      />
    </Optional>
   : <DeleteButton data={printer.id} dataType={DATA_PRINTER}/>;

  console.log(printerState)

  return (<Row>
    <Col>{printerNameHTML}</Col>
    <Col>{printerIPHTML}</Col>
    <Col>{printerPortHTML}</Col>
    <Col>{printerLabelHTML}</Col>
    <Col>
      {actionButton}
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