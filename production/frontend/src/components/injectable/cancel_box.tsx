import React from "react";
import { Container, Modal, Row, Col } from "react-bootstrap";
import { MarginButton } from "~/components/injectable/buttons";


type CancelBoxProps = {
  show : boolean,
  confirm : () => void
  onClose : () => void
  cancelMessage? : string
}

export function CancelBox({show, confirm, onClose, cancelMessage="Vil du afvise?"}: CancelBoxProps){
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
            <Col md="auto">{cancelMessage}</Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Container>
          <Row className="justify-content-around">
            <Col>
              <MarginButton data-testid={"CancelBoxCancel"}  onClick={confirm}>Afvis</MarginButton>
            </Col>
            <Col>
              <Row className="justify-content-end">
                <Col md="auto">
                  <MarginButton data-testid={"CancelBoxBack"} onClick={onClose}>Tilbage</MarginButton>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </Modal.Footer>
    </Modal>
  )
}
