import React, {Component,} from "react";
import { Button, Col, Row, FormControl, Modal, Container, Table } from "react-bootstrap";
import propTypes from 'prop-types'
import { Authenticate } from "../injectable/authenticate.js"

import { changeState } from "../../lib/state_management.js";
import { WEBSOCKET_MESSAGE_AUTH_LOGIN, AUTH_PASSWORD, AUTH_USERNAME,
  JSON_AUTH, AUTH_IS_AUTHENTICATED, KEYWORD_BATCHNR, KEYWORD_OID, INJECTION_USAGE,
  WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_INJECTION_ORDER, WEBSOCKET_MESSAGE_FREE_INJECTION } from "../../lib/constants.js";

import styles from '../../css/Site.module.css'
import { renderComment, renderTableRow } from "../../lib/rendering.js";
import { TracerWebSocket } from "../../lib/tracer_websocket.js";
import { HoverBox } from "../injectable/hover_box.js";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { compareDates } from "../../lib/utils.js";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box.js";
import { batchNumberValidator } from "../../lib/formatting.js";

export { InjectionModal }

class InjectionModal extends Component {
  static propTypes = {
    customers : propTypes.instanceOf(Map).isRequired,
    isotopes : propTypes.instanceOf(Map).isRequired,
    onClose : propTypes.func.isRequired,
    order : propTypes.object.isRequired, // InjectionOrderDataClass
    tracers : propTypes.instanceOf(Map).isRequired,
    //websocket : propTypes.instanceOf(TracerWebSocket).isRequired, // is required but  fucks tests up
  }
  constructor(props){
    super(props);

    this.state = {
      freeing : false,
      batchnr : "",
      login_message : "",
      errorMessage : "",
      errorLevel : null,
    };
  }

  acceptOrder(){
    const order = {...this.props.order};
    order.status = 2;
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
    message[WEBSOCKET_DATA] = order;
    message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
    this.props.websocket.send(message);
  }

  startFreeing(){
    if(!batchNumberValidator(this.state.batchnr)){
      this.setState({
        ...this.state,
        errorMessage : "Batch nummeret er ikke i det korrekte format",
        errorLevel : ERROR_LEVELS.error,
      });
      return;
    }

    const today = new Date();
    const orderDate = new Date(this.props.order.deliver_datetime);
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
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_FREE_INJECTION);
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[JSON_AUTH] = auth;
    const data = {};
    data[KEYWORD_OID] = this.props.order.oid;
    data[KEYWORD_BATCHNR] = this.state.batchnr;
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
    const customer = this.props.customers.get(this.props.order.BID);
    const tracer = this.props.tracers.get(this.props.order.tracer);
    const isotope = this.props.isotopes.get(tracer.isotope);

    const destinationHover = <HoverBox
      Base={<div>Destination:</div>}
      Hover={<div>Kundens brugernavn, rigtige navn og <br/>
        bestillerens profil, hvis tilgændelig.</div>}
    />;
    const destinationMessage = this.props.order.username ?
                                `${customer.UserName} - ${customer.Realname} - ${this.props.order.username}` :
                                `${customer.UserName} - ${customer.Realname}`;
    const orderTime = `${this.props.order.deliver_datetime.substring(11,13)
      }:${this.props.order.deliver_datetime.substring(14,16)} - ${this.props.order.deliver_datetime.substring(8,10)
      }/${this.props.order.deliver_datetime.substring(5,7)}/${this.props.order.deliver_datetime.substring(0,4)}`;


    const tracerLongName = (tracer.longName != "") ?
      `${tracer.longName} - ${isotope.name}`
      : "IUPAC navn for denne tracer er ikke angivet!";
    const tracerHover = <HoverBox
      Base={<div>{tracer.name}</div>}
      Hover={<div>{tracerLongName}</div>}
    />;


    const tableRows = [
      renderTableRow("1", [destinationHover, destinationMessage]),
      renderTableRow("2", [<div>Leverings tid:</div>, <div>{orderTime}</div>]),
      renderTableRow("3", [<div>Tracer:</div>, <div style={{width : "75px"}}>{tracerHover}</div>]), // So the React-hover.Trigger inherits a width that's incorrect
      renderTableRow("4", [<div>Anvendelse:</div>, <div>{INJECTION_USAGE[this.props.order.anvendelse]}</div>]),
      renderTableRow("5", [<div>Injektioner:</div>, <div>{this.props.order.n_injections}</div>]),
    ]

    if(this.props.order.comment != undefined && this.props.order.comment != ""){
      tableRows.push(renderTableRow("666", [
        "Kommentar:", <div style={{width : "25px"}}>{renderComment(this.props.order.comment)}</div> // So the React-hover.Trigger inherits a width that's incorrect
      ]));
    }

    if (this.props.order.status == 2 || this.props.order.status == 3){
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
      if(this.props.order.status == 2 && !this.state.freeing){
        tableRows.push(renderTableRow("999", [BatchHover, <FormControl
          aria-label="batchnr-input"
          value={this.state.batchnr}
          onChange={changeState("batchnr", this).bind(this)}
          />]));
      } else if (this.props.order.status == 2){
        tableRows.push(renderTableRow("999", [BatchHover, this.state.batchnr]));
      } else {
        tableRows.push(renderTableRow("999", [BatchHover, this.props.order.batchnr]));
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
    return (
      <div>
        {this.props.order.status == 1 ? <MarginButton onClick={this.acceptOrder.bind(this)}>Accepter Ordre</MarginButton> : ""}
        {this.props.order.status == 2 && !this.state.freeing ? <MarginButton onClick={this.startFreeing.bind(this)}>Frigiv Ordre</MarginButton> : ""}
        {this.props.order.status == 2 && this.state.freeing ? <MarginButton onClick={this.cancelFreeing.bind(this)}>Rediger Ordre</MarginButton> : ""}
        {this.props.order.status == 3 ? <MarginButton>Se følgeseddel</MarginButton> : ""}
        <CloseButton onClick={this.props.onClose}/>
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
                  headerMessage={`Frigiv Ordre - ${this.props.order.oid}`}
                  buttonMessage={`Frigiv Ordre`}
                  />
        </Col>;
    }

    return(
      <Modal
        show={true}
        size="lg"
        onHide={this.props.onClose}
        className={styles.mariLight}
      >
        <Modal.Header>Frigiv Ordre {this.props.order.oid}</Modal.Header>
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
