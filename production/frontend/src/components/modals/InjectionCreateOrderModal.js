
import React, {Component,} from "react";
import { Button, Col, Form, FormControl, Modal, ModalBody, Row, Table } from "react-bootstrap";
import { renderSelect } from "/src/lib/Rendering";
import { changeState } from "/src/lib/stateManagement";
import { FormatTime, FormatDateStr } from "/src/lib/formatting";
import { WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, JSON_INJECTION_ORDER, WEBSOCKET_DATA, WEBSOCKET_DATATYPE,JSON_CUSTOMER,
  JSON_TRACER, JSON_DELIVERTIME, KEYWORD_INJECTIONS, KEYWORD_USAGE, KEYWORD_COMMENT, } from "/src/lib/constants"
import { addCharacter } from "../../lib/utils";

export { CreateInjectionOrderModal }

class CreateInjectionOrderModal extends Component {
  constructor(props){
    super(props);

    var customerID;
    for(const [cid, _] of this.props.customer){customerID = cid; break;}

    var tracerID;
    for (const [tid, _] of this.props.tracers){tracerID = tid; break;}

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

  ChangeDatetime(event){
    if(event.code == "Backspace"){
      return;
    }
    if(event.target.value.length == 2){
      this.setState({...this.state, deliverTime : event.target.value + ":"})
    }
  }

  SubmitOrder(){
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
    data_object[JSON_CUSTOMER] = this.props.customer.get(Number(this.state.customer));
    data_object[JSON_TRACER] = this.props.tracers.get(Number(this.state.tracer));
    data_object[JSON_DELIVERTIME] = deliver_datetime;
    data_object[KEYWORD_INJECTIONS] = injections;
    data_object[KEYWORD_USAGE] = Number(this.state.use);
    data_object[KEYWORD_COMMENT] = this.state.comment;
    message[WEBSOCKET_DATA] = data_object;
    message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
    this.props.websocket.send(message);
    this.props.onClose();
  }

  render(){
    const customerSelect = renderSelect(
      this.props.customer.values(),
      "ID",
      "UserName",
      changeState("customer", this).bind(this),
      this.state.customer
    );
    const tracers_all = Array.from((this.props.tracers.values()));
    const tracers = tracers_all.filter(tracer => {return tracer.tracer_type == 2});
    const tracerSelect   = renderSelect(
      tracers,
      "id",
      "name",
      changeState("tracer", this).bind(this),
      this.state.tracer
    );
    const UsageOptions = [{ value : 1, name  : "Human"}, { value : 2, name  : "Dyr"}, {value: 3, name : "Andet"}];
    const usageSelect = renderSelect(UsageOptions, "value", "name", changeState("use", this).bind(this), this.state.use);

    return(
    <Modal
      show={true}
      onHide={this.props.onClose}
    >
      <Modal.Header>
        Opret ny injektion ordre
      </Modal.Header>
      <ModalBody>
        <Row> <Col>Kunde</Col> <Col>{customerSelect}</Col></Row>
        <Row><Col>Tracer</Col><Col>{tracerSelect}</Col></Row>
        <Row><Col>Brug</Col><Col>{usageSelect}</Col></Row>
        <Row><Col>Injektioner</Col><Col>
            <Form.Control value={this.state.injections} onChange={changeState("injections", this).bind(this)}></Form.Control>
          </Col></Row>
        <Row><Col>Leverings tid</Col><Col>
            <Form.Control value={this.state.deliverTime} onKeyDown={addCharacter(':', "deliverTime", [2,5], this).bind(this)} onChange={changeState("deliverTime", this).bind(this)}></Form.Control>
          </Col></Row>
        <Row><Col>Kommentar</Col><Col>
            <Form.Control value={this.state.comment} onChange={changeState("comment", this).bind(this)}></Form.Control>
          </Col></Row>
      </ModalBody>
      <Modal.Footer>
        <Button onClick={this.props.onClose}>Annuller</Button>
        <Button onClick={this.SubmitOrder.bind(this)}>Opret</Button>
      </Modal.Footer>
    </Modal>);
  }
}