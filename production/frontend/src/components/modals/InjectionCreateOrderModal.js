
import React, {Component,} from "react";
import { Button, Col, Form, FormControl, Modal, ModalBody, Row, Table } from "react-bootstrap";


export default class TracerModal extends Component {
  constructor(props){
    super(props);
  }
  /** */
  renderCustomerSelect(){

  }


  render(){
    <Modal>
      <Modal.Header>
        Opret ny injektion ordre
      </Modal.Header>
      <ModalBody>
        <Row>
          <Col>Kunde</Col>
          <Col>{}</Col>
        </Row>
      </ModalBody>
      <Modal.Footer>
        <Modal.Button>Annuller</Modal.Button>
        <Modal.Button>Opret</Modal.Button>
      </Modal.Footer>

    </Modal>
  }
}