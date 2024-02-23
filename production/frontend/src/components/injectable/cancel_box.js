import React from "react";
import { Container, Modal, Row, Col } from "react-bootstrap";
import { MarginButton } from "~/components/injectable/buttons";


export function CancelBox({show, confirm, onClose}){


  return (
    <Modal
      style={{
        fontFamily : 'mariBook',
        background: "rgba(0, 0, 0, 0.5)", /* Semi-transparent black overlay */
      }}
    show={show} onHide={onClose} centered>
      <Modal.Body>
        <Container>
          <Row className="justify-content-center">
            <Col md="auto">Vil du afvise?</Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Container>
          <Row className="justify-content-around">
            <Col>
              <MarginButton onClick={confirm}>Afvis</MarginButton>
            </Col>
            <Col>
              <Row className="justify-content-end">
                <Col md="auto">
                  <MarginButton onClick={onClose}>Tilbage</MarginButton>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </Modal.Footer>
    </Modal>
  )
}