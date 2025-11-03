import React from "react";
import { Container, Modal, Row, Col } from "react-bootstrap";
import { MarginButton } from "~/components/injectable/buttons";
import { useWebsocket } from "~/contexts/tracer_shop_context";
import { ORDER_STATUS } from "~/lib/constants";
import { OrderCollection } from "~/lib/data_structures/order_collection";
import { getOrderType, OrdersType, OrderType } from "~/lib/types";


type CancelBoxProps = {
  show : boolean,
  orders? : OrdersType,
  order? : OrderType,
  collection? : OrderCollection,
  onClose : () => void,
  cancelMessage? : string,
}

export function CancelBox({
  show,
  collection,
  orders,
  order,
  onClose,
  cancelMessage="Vil du afvise?"
}: CancelBoxProps
){
  const websocket = useWebsocket();

  function cancelOrder(){
    const order_array = (() => {
      if(orders !== undefined){
        return orders;
      }
      if(order !== undefined){
        return [order] as OrdersType;
      }
      if(collection !== undefined){
        return collection.orders;
      }

      return [];
    })()

    if(orders.length === 0){
      console.error("You are attempting to cancel NO orders!");
      return Promise.resolve();
    }

    const order_type = getOrderType({orders : order_array});

    const filtered_orders = order_array.filter(
      (order) => !([ORDER_STATUS.RELEASED, ORDER_STATUS.CANCELLED].includes(order.status))
    );

    const updated_orders = filtered_orders.map((order) => (
      { ...order, status : ORDER_STATUS.CANCELLED }
    ));

    const promise = websocket.sendEditModels(order_type, updated_orders);
    onClose();
    return promise;
  }


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
              <MarginButton data-testid={"CancelBoxCancel"} onClick={cancelOrder}>Afvis</MarginButton>
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
