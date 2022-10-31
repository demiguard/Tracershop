import React, {Component,} from "react";
import { Button, Col, Row, FormControl, Modal, Container } from "react-bootstrap";

import { Authenticate } from "../injectables/Authenticate.js"

import { changeState } from "../../lib/stateManagement";
import { FormatDateStr } from "../../lib/formatting";
import { WEBSOCKET_MESSAGE_AUTH_LOGIN, AUTH_PASSWORD, AUTH_USERNAME,
  WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE,
  JSON_INJECTION_ORDER, JSON_AUTH, AUTH_IS_AUTHENTICATED } from "../../lib/constants";

import styles from '../../css/Site.module.css'

export { InjectionModalStatus2 }

class InjectionModalStatus2 extends Component {
  constructor(props){
    super(props);

    this.state = {
      batchnr : "",
      ErrorMessage : "",
    };
  }

  FreeOrder(username, password){
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[JSON_AUTH] = auth

    this.props.websocket.send(message).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        // Free The order
        this.props.order.status = 3;
        this.props.order.batchnr = this.state.batchnr;
        const now = new Date();
        this.props.order.frigivet_datetime = `${now.getFullYear()}-${FormatDateStr(now.getMonth())}-${FormatDateStr(now.getDate())} ${FormatDateStr(now.getHours())}:${FormatDateStr(now.getMinutes())}:${FormatDateStr(now.getSeconds())}`
        // Get the id of the user
        var employeeID = null;
        for(const [userID, user] of this.props.employee){
          if (user.Username == username){
            employeeID = userID;
            break;
          }
        }
        this.props.order.frigivet_af = employeeID;
        const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
        message[WEBSOCKET_DATA] = this.props.order;
        message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
        this.props.websocket.send(message);
        this.props.onClose();
      } else {
        this.setState({...this.state, ErrorMessage : "Forkert Login"});
      }
    })
  }


  render(){
    return(
      <Modal
        show={true}
        size="lg"
        onHide={this.props.onClose.bind(this)}
        className={styles.mariLight}
      >
        <Modal.Header>Frigiv Ordre {this.props.order.oid}</Modal.Header>
        <Modal.Body>
          <Container>
            <Row>
              <Col sm={6}>
                <Row>Batchnr
                  <FormControl
                    value={this.state.batchnr}
                    onChange={changeState("batchnr", this)}
                    />
                </Row>
              </Col>
              <Col sm={6}>
                <Authenticate
                  fit_in={false}
                  authenticate={this.FreeOrder.bind(this)}
                  ErrorMessage={this.state.ErrorMessage}
                  login_message={"Frigiv Ordre"}
                  />
              </Col>
            </Row>
          </Container>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onClose}>Luk</Button>
        </Modal.Footer>
      </Modal>
    );
  }
};