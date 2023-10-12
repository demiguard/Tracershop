import React, { useState} from "react";
import { Col, Row, FormControl, Modal, Table } from "react-bootstrap";
import propTypes from 'prop-types'

import { Authenticate } from "../injectable/authenticate.js"

import { changeState, setStateToEvent } from "../../lib/state_management.js";
import { INJECTION_USAGE, PROP_MODAL_ORDER, PROP_ON_CLOSE} from "../../lib/constants.js";

import { AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, AUTH_IS_AUTHENTICATED,
  WEBSOCKET_DATA, DATA_INJECTION_ORDER, WEBSOCKET_MESSAGE_FREE_INJECTION,
  WEBSOCKET_DATA_ID
} from "~/lib/shared_constants.js"

import styles from '~/css/Site.module.css'
import { renderComment, renderTableRow } from "~/lib/rendering.js";

import { HoverBox } from "../injectable/hover_box.js";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { compareDates } from "~/lib/utils.js";
import { getToday } from "~/lib/chronomancy.js";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box.js";
import { batchNumberValidator } from "~/lib/formatting.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";

export function InjectionModal ({modal_order, on_close}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const [freeing, setFreeing] = useState(false);
  const [lot_number, setLotNumber] = useState("");
  const [error, setError] = useState("");
  const [errorLevel, setErrorLevel] = useState(ERROR_LEVELS.hint);
  const order = state.injection_orders.get(modal_order);

  const endpoint = state.delivery_endpoint.get(order.endpoint);
  const customer = state.customer.get(endpoint.owner);
  const tracer = state.tracer.get(order.tracer);
  const isotope = state.isotopes.get(tracer.isotope);

  function acceptOrder(){
    order.status = 2;
    websocket.sendEditModel(DATA_INJECTION_ORDER, [order]);
  }

  function startFreeing(){
    if(!batchNumberValidator(lot_number)){
      setError("Lot nummeret er ikke i det korrekte format");
      setErrorLevel(ERROR_LEVELS.error);
      return;
    }

    const today = getToday();
    const orderDate = new Date(order.delivery_date);
    if(!compareDates(today, orderDate)){

      setError("Du er i gang med at frigive en ordre som ikke er bestilt til i dag!");
      setErrorLevel(ERROR_LEVELS.hint);
      setFreeing(true);

      return; // This return statement is there to prevent two updates instead of one
    }

    setFreeing(true);
  }

  function cancelFreeing(){
    setFreeing(false);
  }

  function freeOrder(username, password){
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_FREE_INJECTION);
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[DATA_AUTH] = auth;
    const data = {};
    data[WEBSOCKET_DATA_ID] = modal_order;
    data["lot_number"] = lot_number;
    message[WEBSOCKET_DATA] = data;

    websocket.send(message).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        // Free The order
        setError("");
        setFreeing(false);

      } else {
        setError("Forkert Login");
        setErrorLevel(ERROR_LEVELS.error);
      }
    })
  }

  const destinationHover = <HoverBox
    Base={<div>Destination:</div>}
    Hover={<div>Kundens brugernavn, rigtige navn og <br/>
      bestillerens profil, hvis tilgændelig.</div>}
  />;
  const destinationMessage = `${customer.short_name} - ${endpoint.name}`
  const orderTime = order.delivery_time;

    const tracerLongName = (tracer.clinical_name != "") ?
      `${tracer.clinical_name} - ${isotope.atomic_letter}-${isotope.atomic_mass}`
      : "IUPAC navn for denne tracer er ikke angivet!";
    const tracerHover = <HoverBox
      Base={<div>{tracer.shortname}</div>}
      Hover={<div>{tracerLongName}</div>}
    />;


    const tableRows = [
      renderTableRow("1", [destinationHover, destinationMessage]),
      renderTableRow("2", [<div>Leverings tid:</div>, <div>{orderTime}</div>]),
      renderTableRow("3", [<div>Tracer:</div>, <div style={{width : "75px"}}>{tracerHover}</div>]), // So the React-hover.Trigger inherits a width that's incorrect
      renderTableRow("4", [<div>Anvendelse:</div>, <div>{INJECTION_USAGE[order.tracer_usage]}</div>]),
      renderTableRow("5", [<div>Injektioner:</div>, <div>{order.injections}</div>]),
    ]

    if(order.comment != undefined && order.comment != ""){
      tableRows.push(renderTableRow("666", [
        "Kommentar:", <div style={{width : "25px"}}>{renderComment(order.comment)}</div> // So the React-hover.Trigger inherits a width that's incorrect
      ]));
    }

    if (order.status == 2 || order.status == 3){
      const BatchHover = <HoverBox
      Base={<div>Batch Nummer</div>}
      Hover={
        <div>En kode på formattet XXXX-YYMMDD-R
          <ul>
            <li>XXXX - Tracer kode, ikke nødvendigvis på 4 bogstaver</li>
            <li>YYMMDD - Dato kode</li>
            <li>R - Produktion af denne tracer på denne dato</li>
          </ul>
        </div>}
      />
      if(order.status == 2 && !freeing){
        tableRows.push(renderTableRow("999", [BatchHover, <FormControl
          aria-label="batchnr-input"
          value={lot_number}
          onChange={setStateToEvent(setLotNumber)}
          />]));
      } else if (order.status == 2){
        tableRows.push(renderTableRow("999", [BatchHover, lot_number]));
      } else {
        tableRows.push(renderTableRow("999", [BatchHover, order.lot_number]));
      }
    }



  const colWidth = (freeing) ? 6 : 12;
  let secondaryElement = null; // Remember to wrap this is a <Col md={6}>
  if(freeing){
    secondaryElement = <Col md={6}>
          <Authenticate
                  fit_in={false}
                  authenticate={freeOrder}
                  headerMessage={`Frigiv Ordre - ${modal_order}`}
                  buttonMessage={`Frigiv Ordre`}
                  />
        </Col>;
    }

    return(
      <Modal
        show={true}
        size="lg"
        onHide={on_close}
        className={styles.mariLight}
      >
        <Modal.Header>Injection Ordre {modal_order}</Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={colWidth}>
              <Table>
                <tbody>
                  {tableRows}
                </tbody>
              </Table>
            </Col>
            {secondaryElement ? secondaryElement : ""}
          </Row>
          {error != "" ? <AlertBox
            level={errorLevel}
            message={error}
          /> : ""}
        </Modal.Body>
        <Modal.Footer>
          <div>
            {order.status == 1 ? <MarginButton onClick={acceptOrder}>Accepter Ordre</MarginButton> : ""}
            {order.status == 2 && !freeing ? <MarginButton onClick={startFreeing}>Frigiv Ordre</MarginButton> : ""}
            {order.status == 2 && freeing ? <MarginButton onClick={cancelFreeing}>Rediger Ordre</MarginButton> : ""}
            {order.status == 3 ? <MarginButton>Se følgeseddel</MarginButton> : ""}
            <CloseButton onClick={on_close}/>
          </div>
        </Modal.Footer>
      </Modal>
    );
}

InjectionModal.propTypes = {
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
  [PROP_MODAL_ORDER] : propTypes.number.isRequired,
}

