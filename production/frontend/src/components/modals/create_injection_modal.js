
import React, {Component,} from "react";
import { Button, Col, Form, FormControl, Modal, ModalBody, Row, Table } from "react-bootstrap";

import propTypes  from "prop-types";

import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box";
import { renderSelect } from "../../lib/rendering";
import { changeState } from "../../lib/state_management";
import { FormatTime, FormatDateStr } from "../../lib/formatting";
import { addCharacter } from "../../lib/utils";
import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, JSON_INJECTION_ORDER, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,JSON_CUSTOMER,
  JSON_TRACER, JSON_DELIVER_TIME, LEGACY_KEYWORD_INJECTIONS, LEGACY_KEYWORD_USAGE, LEGACY_KEYWORD_COMMENT, LEGACY_KEYWORD_BID, LEGACY_KEYWORD_DELIVER_DATETIME, LEGACY_KEYWORD_TRACER, PROP_ON_CLOSE, JSON_TRACER_MAPPING, TRACER_TYPE_DOSE } from "../../lib/constants";

import styles from '../../css/Site.module.css'
import { Select } from "../injectable/select";
import { Customer, Tracer, TracerCatalog } from "../../dataclasses/dataclasses";


export { CreateInjectionOrderModal }

class CreateInjectionOrderModal extends Component {
  static propTypes = {
    date : propTypes.instanceOf(Date),
    customers : propTypes.instanceOf(Map).isRequired,
    tracers : propTypes.instanceOf(Map).isRequired,
    onClose : propTypes.func.isRequired
    //websocket : propTypes.instanceOf(TracerWebSocket).isRequired
  }
  constructor(props){
    super(props);

    // First we create a associative hash map, over all customer that can order
    // injection tracers

    this.tracerCatalog = new Map()

    for(const [id, _tracerCatalogPage] of this.props[JSON_TRACER_MAPPING]){
      const /**@type {TracerCatalog} */ tracerCatalogPage = _tracerCatalogPage;
      const /**@type {Tracer} */ tracer = this.props[JSON_TRACER].get(tracerCatalogPage.tracer)
      if(!(tracer.tracer_type === TRACER_TYPE_DOSE)){
        continue;
      }
      if (this.tracerCatalog.has(tracerCatalogPage.customer)){
        const customerCatalog = this.tracerCatalog.get(tracerCatalogPage.customer);
        customerCatalog.push(tracerCatalogPage.tracer);
      } else {
        const customerCatalog = [tracerCatalogPage.tracer];

        this.tracerCatalog.set(tracerCatalogPage.customer, customerCatalog);
      }
    }


    // Initialize select
    let customerID;
    let tracerID;
    for(const [cid, customerCatalog] of this.tracerCatalog){
      customerID = cid;
      tracerID = customerCatalog[0]
      break;}

    for (const [tid, _] of this.props[JSON_TRACER]){
      tracerID = tid;
      break;
    }

    this.state = {
      customer : customerID,
      tracer   : tracerID,
      use : 1,
      injections : "",
      deliverTime : "",
      comment : "",
      error : "",
    }
  }

  SubmitOrder(){
    return (_event) => {
      //Validation
      const injections = Number(this.state.injections);
      if(isNaN(injections)){
        this.setState({...this.state, error : "Injektionerne er ikke et tal"});
        return;
      }

      const deliverTime = FormatTime(this.state.deliverTime);
      if(deliverTime === null){
        this.setState({...this.state, error : "Leverings tidspunktet er ikke et valid"});
        return;
      }

      const year = this.props.date.getFullYear();
      const month = FormatDateStr(this.props.date.getMonth() + 1);
      const date = FormatDateStr(this.props.date.getDate())
      const deliver_datetime = `${year}-${month}-${date}T${deliverTime}`

      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
      const data_object = {};
      data_object[LEGACY_KEYWORD_BID] = Number(this.state.customer);
      data_object[LEGACY_KEYWORD_TRACER] = Number(this.state.tracer);
      data_object[LEGACY_KEYWORD_DELIVER_DATETIME] = deliver_datetime;
      data_object[LEGACY_KEYWORD_INJECTIONS] = injections;
      data_object[LEGACY_KEYWORD_USAGE] = Number(this.state.use);
      data_object[LEGACY_KEYWORD_COMMENT] = this.state.comment;
      message[WEBSOCKET_DATA] = data_object;
      message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
      this.props.websocket.send(message);
      this.props.onClose();
    }
  }

  render(){
    const customerOptions = []
    for(const [customerID, _customer] of this.props[JSON_CUSTOMER]){
      const /**@type {Customer} */ customer = _customer;
      customerOptions.push({
        id : customerID,
        name : customer.short_name
      })
    }

    const tracerOptions = [];
    for(const [tracerID, _tracer] of this.props[JSON_TRACER]){
      const /**@type {Tracer} */ tracer = _tracer;

    }


    const UsageOptions = [{ value : 1, name  : "Human"}, { value : 2, name  : "Dyr"}, {value: 3, name : "Andet"}];
    const usageSelect = renderSelect(UsageOptions, "value", "name", changeState("use", this).bind(this), this.state.use);

    return(
    <Modal
      show={true}
      onHide={this.props[PROP_ON_CLOSE]}
      className={styles.mariLight}
    >
      <Modal.Header>
        Opret ny injektion ordre
      </Modal.Header>
      <ModalBody>
        <Row><Col>Kunde</Col> <Col>{customerSelect}</Col></Row>
        <Row><Col>Tracer</Col><Col>{tracerSelect}</Col></Row>
        <Row>
          <Col>Brug</Col>
          <Col><Select

          /></Col>
        </Row>
        <Row>
          <Col>Injektioner</Col>
          <Col>
            <Form.Control
              aria-label="injection-input"
              value={this.state.injections}
              onChange={changeState("injections", this).bind(this)}
            />
          </Col>
        </Row>
        <Row>
          <Col>Leverings tid</Col>
          <Col>
            <Form.Control
              aria-label="delivery-input"
              value={this.state.deliverTime}
              onKeyDown={addCharacter(':', "deliverTime", [2,5], this).bind(this)}
              onChange={changeState("deliverTime", this).bind(this)}
            />
          </Col>
        </Row>
        <Row>
          <Col>Kommentar</Col>
          <Col>
            <Form.Control
              aria-label="comment-input"
              value={this.state.comment}
              onChange={changeState("comment", this).bind(this)}
            />
          </Col>
        </Row>
        { this.state.error != "" ? <Row><AlertBox
          level={ERROR_LEVELS.error}
          message={this.state.error}
           /></Row> : "" }
      </ModalBody>
      <Modal.Footer>
        <Button onClick={this.props[PROP_ON_CLOSE]}>Annuller</Button>
        <Button onClick={this.SubmitOrder().bind(this)}>Opret Ordre</Button>
      </Modal.Footer>
    </Modal>);
  }
}