import React from "react";
import { Col, Modal, Row } from "react-bootstrap";
import { IsotopeOrderCollection } from "~/lib/data_structures/isotope_order_collection";
import { CloseButton } from "../injectable/buttons";
import { FONT } from "~/lib/styles";

type IsotopeOrderModalProps = {
  collection : IsotopeOrderCollection,
  onClose : () => void
}


export function IsotopeOrderModal({
  collection, onClose
}: IsotopeOrderModalProps){


  return (
  <Modal
    show={true}
    style={FONT.light}
    onHide={onClose}
  >
    <Modal.Header>
      Isotope Ordre til
    </Modal.Header>
    <Modal.Body>

    </Modal.Body>
    <Modal.Footer>
      <Row>
        <Col><CloseButton onMouseDown={onClose}/></Col>
      </Row>
    </Modal.Footer>
  </Modal>);
}
