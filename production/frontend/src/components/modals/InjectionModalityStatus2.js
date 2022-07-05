import { Authenticate } from "/src/components/injectables/Authenticate.js"
import React, {Component,} from "react";
import { Button, Col, Row, Form, FormControl, Modal, Table, Container } from "react-bootstrap";
import { changeState } from "../../lib/stateManagement";
import { ajax } from "jquery";
import { AUTH_DETAIL, AUTH_PASSWORD, AUTH_USERNAME, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_EDIT_STATE,
  JSON_INJECTION_ORDER} from "/src/lib/constants.js"

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
    const message = {};

    message[AUTH_USERNAME] = username;
    message[AUTH_PASSWORD] = password;

    ajax({
      url:"auth/authenticate",
      type:"post",
      data:JSON.stringify(message)
    }).then((data) => {
      if(data[AUTH_DETAIL]){
        // Free The order
        this.props.order.status = 3;
        this.props.order.batchnr = this.state.batchnr;
        const now = new Date();
        this.props.order.frigivet_datetime = now;
        // Get the id of the user
        var employeeID;
        for(const [userID, user] of this.props.employee){
          if (user.username == username){
            employeeID = userID;
            break;
          }
        }

        this.props.order.frigivet_af = employeeID;
        const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
        message[WEBSOCKET_DATA] = this.props.order;
        message[WEBSOCKET_DATATYPE] = JSON_INJECTION_ORDER;
        this.props.websocket.send(JSON.stringify(message));
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