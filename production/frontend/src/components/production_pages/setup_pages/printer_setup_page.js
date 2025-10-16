import React, { useState } from "react";
import { Col, Container, FormCheck, FormControl, Row } from "react-bootstrap";
import { IdempotentButton } from "~/components/injectable/buttons";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { DeleteButton } from "~/components/injectable/delete_button";
import { IdempotentIcon } from "~/components/injectable/icons.tsx";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { Option, Select, toOptions } from "~/components/injectable/select";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { Printer } from "~/dataclasses/dataclasses";
import { cssCenter } from "~/lib/styles";
import { nullParser } from "~/lib/formatting";
import { DATA_PRINTER, DATA_SERVER_CONFIG, SUCCESS_STATUS_CRUD, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_STATUS, WEBSOCKET_MESSAGE_TEST_PRINTER, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { setTempObjectToEvent } from "~/lib/state_management";


/**
 *
 * @param {object} props
 * @param {Printer} props.printer
 * @returns
 */
function PrinterRow({
  printer
}){
  const state = useTracershopState();
  const websocket = useWebsocket();


  const [printerState, setPrinterState] = useState(printer);
  const [printerError, setPrinterError] = useState("");

  const server_config = state.server_config.get(1);
  const is_active_printer = printer.id === server_config.active_label_printer || printer.id === server_config.active_printer;
  const creating = printer.id === -1;
  const showCreateButton = Boolean(creating && printerState.name && printerState.ip && printerState.port);

  const printerNameHTML  = creating ? <TracershopInputGroup error={printerError}>
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
  const printerLabelHTML = creating ? <div><FormCheck checked={printerState.label_printer} onChange={
    () => {
      setPrinterState(old => {
        return {
          ...old,
          label_printer : !old.label_printer
        }
      })

    }
  }/></div> : <div>
    <FormCheck checked={printerState.label_printer} disabled={true} readOnly={true}/>
  </div>;

  function printTestPage(){
    return websocket.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_TEST_PRINTER,
      [WEBSOCKET_DATA] : {...printer}
    })
  }

  const actionButton = creating ?
    <Optional exists={showCreateButton}>
      <CommitIcon
        validate={
          () => {
            return [printerState.name && printerState.ip && printerState.port, printerState];
          }
        }
        temp_object={printerState}
        object_type={DATA_PRINTER}
        callback={(message) => {
          if(message[WEBSOCKET_MESSAGE_STATUS] === SUCCESS_STATUS_CRUD.SUCCESS){
            setPrinterState(new Printer(-1, "", "", "", ""));
            setPrinterError("");
          } else if(message[WEBSOCKET_MESSAGE_STATUS] === SUCCESS_STATUS_CRUD.CONSTRAINTS_VIOLATED) {
            setPrinterError("Der findes allerede en printer med det navn");
          } else {
            // This is a violation of single source of truth...
            const illegalRegex = new RegExp("([^a-zA-Z0-9æøåÆØÅ\-]+)");
            const illegalCharactersArray = illegalRegex.exec(printerState.name)

            if(illegalCharactersArray !== null){
              setPrinterError(`Navnet indeholder ulovlige bogstaver: ${illegalCharactersArray.join(", ")}`);
            }

            }
          }
        }
      />
    </Optional>
   : <Optional exists={!is_active_printer}>
      <DeleteButton data={printer.id} dataType={DATA_PRINTER}/>
    </Optional>;

  return (<Row>
    <Col>{printerNameHTML}</Col>
    <Col>{printerIPHTML}</Col>
    <Col>{printerPortHTML}</Col>
    <Col style={cssCenter}>{printerLabelHTML}</Col>
    <Col>
      <Row>
        <Col>{actionButton}</Col>
        <Optional exists={!creating}>
          <Col>
            <IdempotentIcon
              src="static/images/printer.svg"
              onClick={printTestPage}
            />
          </Col>
        </Optional>
      </Row>

    </Col>
  </Row>);
}



export function PrinterOverviewPage(){
  const state = useTracershopState();
  const websocket = useWebsocket();

  const server_config = state.server_config.get(1);

  const printerRows = [];
  for(const printer of state.printer.values()){
    printerRows.push(
      <PrinterRow
        key={printer.id}
        printer={printer}
      />);
  }

  function changeActiveLabelPrinter(event){
    const target = event.target.value === "-1" ? null : Number(event.target.value);

    websocket.sendEditModel(DATA_SERVER_CONFIG, {
      ...server_config,
      active_label_printer : target
    });
  }

  function changeActivePrinter(event){
    const target = event.target.value === "-1" ? null : Number(event.target.value);

    websocket.sendEditModel(DATA_SERVER_CONFIG, {
      ...server_config,
      active_printer : target
    });
  }

  printerRows.push(<PrinterRow
    key={-1}
    printer={new Printer(-1, "", "", "", "")}
  />);

  const label_printers = toOptions([...state.printer.values()].filter(
    (printer) => printer.label_printer
  ));
  label_printers.unshift(new Option("-1", "Ingen valgt"))

  const normal_printers = toOptions([...state.printer.values()].filter(
    (printer) => !printer.label_printer
  ))
  normal_printers.unshift(new Option("-1", "Ingen valgt"))


  return <Container>
    <Row>
      <Col>
        <TracershopInputGroup label={"Aktiv label printer"}>
          <Select
            options={label_printers}
            value={nullParser(server_config.active_label_printer)}
            onChange={changeActiveLabelPrinter}
          />
        </TracershopInputGroup>
      </Col>
      <Col>
        <TracershopInputGroup label={"Føgleseddel printer"}>
          <Select
            options={normal_printers}
            value={nullParser(server_config.active_printer)}
            onChange={changeActivePrinter}
          />
        </TracershopInputGroup>
      </Col>
    </Row>
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