import React, { useState} from "react";
import { Col, Row, FormControl, Modal, Table } from "react-bootstrap";
import propTypes from 'prop-types'

import { Authenticate } from "../injectable/authenticate.js"

import { changeState, setStateToEvent } from "../../lib/state_management.js";
import { INJECTION_USAGE, PROP_MODAL_ORDER, PROP_ON_CLOSE} from "../../lib/constants.js";

import { AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, AUTH_IS_AUTHENTICATED,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, DATA_INJECTION_ORDER, WEBSOCKET_MESSAGE_FREE_INJECTION,
  DATA_ENDPOINT, DATA_CUSTOMER, DATA_TRACER, DATA_ISOTOPE,
  WEBSOCKET_MESSAGE_MODEL_EDIT, WEBSOCKET_DATA_ID
} from "~/lib/shared_constants.js"

import styles from '~/css/Site.module.css'
import { renderComment, renderTableRow } from "~/lib/rendering.js";

import { HoverBox } from "../injectable/hover_box.js";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { compareDates } from "~/lib/utils.js";
import { getToday } from "~/lib/chronomancy.js";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box.js";
import { batchNumberValidator } from "~/lib/formatting.js";
import { Customer, DeliveryEndpoint, InjectionOrder, Isotope, Tracer } from "../../dataclasses/dataclasses.js";
import { KEYWORD_InjectionOrder_LOT_NUMBER } from "../../dataclasses/keywords.js";
import { useWebsocket } from "../tracer_shop_context.js";

export function InjectionModal (props) {
    const websocket = useWebsocket();
    const [freeing, setFreeing] = useState(false);
    const [lot_number, setLotNumber] = useState("");


    const [state, setState] = useState({

      lot_number : "",
      login_message : "",
      errorMessage : "",
      errorLevel : null,
    })

  function acceptOrder(){
    const order = {...props[DATA_INJECTION_ORDER].get(props[PROP_MODAL_ORDER])};
    order.status = 2;
    websocket.sendEditModel(DATA_INJECTION_ORDER, [order]);
  }

  function startFreeing(){
    if(!batchNumberValidator(state.lot_number)){
      setState({
        ...state,
        errorMessage : "Batch nummeret er ikke i det korrekte format",
        errorLevel : ERROR_LEVELS.error,
      });
      return;
    }

    const today = getToday();
    const /**@type {InjectionOrder} */ injectionOrder = props[DATA_INJECTION_ORDER].get(props[PROP_MODAL_ORDER])

    const orderDate = new Date(injectionOrder.delivery_date);
    if(!compareDates(today, orderDate)){
      setState({
        ...state,
        errorLevel : ERROR_LEVELS.hint,
        errorMessage : "Du er i gang med at frigive en ordre som ikke er bestilt til i dag!",

      });
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
    data[WEBSOCKET_DATA_ID] = props[PROP_MODAL_ORDER];
    data["lot_number"] = lot_number;
    message[WEBSOCKET_DATA] = data;

    websocket.send(message).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        // Free The order
        setState({
          ...state,

          errorMessage : "",
          errorLevel : null})
        setFreeing(false);

      } else {
        setState({
          ...state,
          errorMessage : "Forkert Login",
          errorLevel : ERROR_LEVELS.error
        });
      }
    })
  }

  function renderDescriptionTable(){
    const /**@type {InjectionOrder} */ injectionOrder = props[DATA_INJECTION_ORDER].get(props[PROP_MODAL_ORDER]);
    const /**@type {DeliveryEndpoint} */ endpoint = props[DATA_ENDPOINT].get(injectionOrder.endpoint)
    const /**@type {Customer} */ customer = props[DATA_CUSTOMER].get(endpoint.owner);
    const /**@type {Tracer} */ tracer = props[DATA_TRACER].get(injectionOrder.tracer);
    const /**@type {Isotope} */ isotope = props[DATA_ISOTOPE].get(tracer.isotope);

    const destinationHover = <HoverBox
      Base={<div>Destination:</div>}
      Hover={<div>Kundens brugernavn, rigtige navn og <br/>
        bestillerens profil, hvis tilgændelig.</div>}
    />;
    const destinationMessage = `${customer.short_name} - ${endpoint.name}`
    const orderTime = injectionOrder.delivery_time;


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
      renderTableRow("4", [<div>Anvendelse:</div>, <div>{INJECTION_USAGE[injectionOrder.tracer_usage]}</div>]),
      renderTableRow("5", [<div>Injektioner:</div>, <div>{injectionOrder.injections}</div>]),
    ]

    if(injectionOrder.comment != undefined && injectionOrder.comment != ""){
      tableRows.push(renderTableRow("666", [
        "Kommentar:", <div style={{width : "25px"}}>{renderComment(injectionOrder.comment)}</div> // So the React-hover.Trigger inherits a width that's incorrect
      ]));
    }

    if (injectionOrder.status == 2 || injectionOrder.status == 3){
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
      if(injectionOrder.status == 2 && !freeing){
        tableRows.push(renderTableRow("999", [BatchHover, <FormControl
          aria-label="batchnr-input"
          value={lot_number}
          onChange={setStateToEvent(setLotNumber)}
          />]));
      } else if (injectionOrder.status == 2){
        tableRows.push(renderTableRow("999", [BatchHover, lot_number]));
      } else {
        tableRows.push(renderTableRow("999", [BatchHover, injectionOrder.lot_number]));
      }
    }

    return (
      <Table>
        <tbody>
          {tableRows}
        </tbody>
      </Table>
    );
  }

  function renderButtonGroup(){
    const /**@type {InjectionOrder} */ injectionOrder = props[DATA_INJECTION_ORDER].get(props[PROP_MODAL_ORDER]);

    return (
      <div>
        {injectionOrder.status == 1 ? <MarginButton onClick={acceptOrder}>Accepter Ordre</MarginButton> : ""}
        {injectionOrder.status == 2 && !freeing ? <MarginButton onClick={startFreeing}>Frigiv Ordre</MarginButton> : ""}
        {injectionOrder.status == 2 && freeing ? <MarginButton onClick={cancelFreeing}>Rediger Ordre</MarginButton> : ""}
        {injectionOrder.status == 3 ? <MarginButton>Se følgeseddel</MarginButton> : ""}
        <CloseButton onClick={props[PROP_ON_CLOSE]}/>
      </div>
    )
  }

  const colWidth = (freeing) ? 6 : 12;
  let secondaryElement = null; // Remember to wrap this is a <Col md={6}>
  if(freeing){
    secondaryElement = <Col md={6}>
          <Authenticate
                  fit_in={false}
                  authenticate={freeOrder}
                  headerMessage={`Frigiv Ordre - ${props[PROP_MODAL_ORDER]}`}
                  buttonMessage={`Frigiv Ordre`}
                  />
        </Col>;
    }

    return(
      <Modal
        show={true}
        size="lg"
        onHide={props[PROP_ON_CLOSE]}
        className={styles.mariLight}
      >
        <Modal.Header>Injection Ordre {props[PROP_MODAL_ORDER]}</Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={colWidth}>
              {renderDescriptionTable()}
            </Col>
            {secondaryElement ? secondaryElement : ""}
          </Row>
          {state.errorLevel != null ? <AlertBox
            level={state.errorLevel}
            message={state.errorMessage}
          /> : ""}
        </Modal.Body>
        <Modal.Footer>
          {renderButtonGroup()}
        </Modal.Footer>
      </Modal>
    );
}

