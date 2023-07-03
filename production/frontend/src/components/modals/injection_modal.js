import React, {Component,} from "react";
import { Button, Col, Row, FormControl, Modal, Container, Table } from "react-bootstrap";
import propTypes from 'prop-types'
import { Authenticate } from "../injectable/authenticate.js"

import { changeState } from "../../lib/state_management.js";
import { WEBSOCKET_MESSAGE_AUTH_LOGIN, AUTH_PASSWORD, AUTH_USERNAME,
  JSON_AUTH, AUTH_IS_AUTHENTICATED, LEGACY_KEYWORD_BATCHNR, LEGACY_KEYWORD_OID, INJECTION_USAGE,
  WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_INJECTION_ORDER, WEBSOCKET_MESSAGE_FREE_INJECTION, PROP_MODAL_ORDER, PROP_WEBSOCKET, JSON_ENDPOINT, JSON_CUSTOMER, JSON_TRACER, JSON_ISOTOPE, PROP_ON_CLOSE, WEBSOCKET_MESSAGE_MODEL_EDIT, WEBSOCKET_DATA_ID } from "../../lib/constants.js";

import styles from '../../css/Site.module.css'
import { renderComment, renderTableRow } from "../../lib/rendering.js";
import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { HoverBox } from "../injectable/hover_box.js";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { compareDates } from "../../lib/utils.js";
import { getToday } from "../../lib/chronomancy.js";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box.js";
import { batchNumberValidator } from "../../lib/formatting.js";
import { Customer, DeliveryEndpoint, InjectionOrder, Isotope, Tracer } from "../../dataclasses/dataclasses.js";
import { KEYWORD_InjectionOrder_LOT_NUMBER } from "../../dataclasses/keywords.js";

export { InjectionModal }

class InjectionModal extends Component {
  constructor(props){
    super(props);

    this.state = {
      freeing : false,
      lot_number : "",
      login_message : "",
      errorMessage : "",
      errorLevel : null,
    };
  }

  acceptOrder(){
    const retFunc = () => {
      const order = {...this.props[JSON_INJECTION_ORDER].get(this.props[PROP_MODAL_ORDER])};
      order.status = 2;
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_MODEL_EDIT);
      message[WEBSOCKET_DATA] = order;
      message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
      this.props[PROP_WEBSOCKET].send(message);
    }
    return retFunc;
  }

  startFreeing(){
    if(!batchNumberValidator(this.state.lot_number)){
      this.setState({
        ...this.state,
        errorMessage : "Batch nummeret er ikke i det korrekte format",
        errorLevel : ERROR_LEVELS.error,
      });
      return;
    }

    const today = getToday();
    const /**@type {InjectionOrder} */ injectionOrder = this.props[JSON_INJECTION_ORDER].get(this.props[PROP_MODAL_ORDER])

    const orderDate = new Date(injectionOrder.delivery_date);
    if(!compareDates(today, orderDate)){
      this.setState({
        ...this.state,
        errorLevel : ERROR_LEVELS.hint,
        errorMessage : "Du er i gang med at frigive en ordre som ikke er bestilt til i dag!",
        freeing : true,
      });
      return; // This return statement is there to prevent two updates instead of one
    }

    this.setState({
      ...this.state,
      freeing : true,
    });
  }

  cancelFreeing(){
    this.setState({
      ...this.state,
      freeing : false,
    });
  }

  freeOrder(username, password){
    const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_FREE_INJECTION);
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[JSON_AUTH] = auth;
    const data = {};
    data[WEBSOCKET_DATA_ID] = this.props[PROP_MODAL_ORDER];
    data[KEYWORD_InjectionOrder_LOT_NUMBER] = this.state.lot_number;
    message[WEBSOCKET_DATA] = data;

    this.props.websocket.send(message).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        // Free The order
        this.setState({
          ...this.state,
          freeing : false,
          errorMessage : "",
          errorLevel : null})
      } else {
        this.setState({
          ...this.state,
          errorMessage : "Forkert Login",
          errorLevel : ERROR_LEVELS.error
        });
      }
    })
  }

  renderDescriptionTable(){
    const /**@type {InjectionOrder} */ injectionOrder = this.props[JSON_INJECTION_ORDER].get(this.props[PROP_MODAL_ORDER]);
    const /**@type {DeliveryEndpoint} */ endpoint = this.props[JSON_ENDPOINT].get(injectionOrder.endpoint)
    const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(endpoint.owner);
    const /**@type {Tracer} */ tracer = this.props[JSON_TRACER].get(injectionOrder.tracer);
    const /**@type {Isotope} */ isotope = this.props[JSON_ISOTOPE].get(tracer.isotope);

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
      if(injectionOrder.status == 2 && !this.state.freeing){
        tableRows.push(renderTableRow("999", [BatchHover, <FormControl
          aria-label="batchnr-input"
          value={this.state.lot_number}
          onChange={changeState("lot_number", this).bind(this)}
          />]));
      } else if (injectionOrder.status == 2){
        tableRows.push(renderTableRow("999", [BatchHover, this.state.lot_number]));
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

  renderButtonGroup(){
    const /**@type {InjectionOrder} */ injectionOrder = this.props[JSON_INJECTION_ORDER].get(this.props[PROP_MODAL_ORDER]);

    return (
      <div>
        {injectionOrder.status == 1 ? <MarginButton onClick={this.acceptOrder().bind(this)}>Accepter Ordre</MarginButton> : ""}
        {injectionOrder.status == 2 && !this.state.freeing ? <MarginButton onClick={this.startFreeing.bind(this)}>Frigiv Ordre</MarginButton> : ""}
        {injectionOrder.status == 2 && this.state.freeing ? <MarginButton onClick={this.cancelFreeing.bind(this)}>Rediger Ordre</MarginButton> : ""}
        {injectionOrder.status == 3 ? <MarginButton>Se følgeseddel</MarginButton> : ""}
        <CloseButton onClick={this.props[PROP_ON_CLOSE]}/>
      </div>
    )
  }

  render(){
    const secondaryElementExists = this.state.freeing;
    const colWidth = (secondaryElementExists) ? 6 : 12;
    let secondaryElement = null; // Remember to wrap this is a <Col md={6}>
    if(this.state.freeing){
      secondaryElement = <Col md={6}>
          <Authenticate
                  fit_in={false}
                  authenticate={this.freeOrder.bind(this)}
                  headerMessage={`Frigiv Ordre - ${this.props[PROP_MODAL_ORDER]}`}
                  buttonMessage={`Frigiv Ordre`}
                  />
        </Col>;
    }

    return(
      <Modal
        show={true}
        size="lg"
        onHide={this.props[PROP_ON_CLOSE]}
        className={styles.mariLight}
      >
        <Modal.Header>Injection Ordre {this.props[PROP_MODAL_ORDER]}</Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={colWidth}>
              {this.renderDescriptionTable()}
            </Col>
            {(secondaryElementExists) ? secondaryElement : ""}
          </Row>
          {this.state.errorLevel != null ? <AlertBox
            level={this.state.errorLevel}
            message={this.state.errorMessage}
          /> : ""}
        </Modal.Body>
        <Modal.Footer>
          {this.renderButtonGroup()}
        </Modal.Footer>
      </Modal>
    );
  }
};
