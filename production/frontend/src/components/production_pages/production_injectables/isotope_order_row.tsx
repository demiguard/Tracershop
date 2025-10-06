import React from "react";
import { Col, Row } from "react-bootstrap";
import { Comment } from "~/components/injectable/data_displays/comment";
import { MBqDisplay } from "~/components/injectable/data_displays/mbq_display";
import { FlexMinimizer } from "~/components/injectable/flexMinimizer";
import { CancelIcon, StatusIcon } from "~/components/injectable/icons";
import { Optional } from "~/components/injectable/optional";
import { IsotopeOrder } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";

type OrderRowProps = {
  order : IsotopeOrder
}

export function IsotopeOrderRow ({
  order
}: OrderRowProps) {

  return (
  <Row>
    <FlexMinimizer><StatusIcon order={order}/></FlexMinimizer>
    <Col>Bestilt : <MBqDisplay activity={order.ordered_activity_MBq}/></Col>
    <Optional exists={(order.comment)}>
      <FlexMinimizer><Comment comment={order.comment}/></FlexMinimizer>
    </Optional>
    <Optional exists={[ORDER_STATUS.ACCEPTED, ORDER_STATUS.ORDERED].includes(order.status)}>
      <FlexMinimizer xs={1}><CancelIcon order={order}/></FlexMinimizer>
    </Optional>
  </Row>)
}