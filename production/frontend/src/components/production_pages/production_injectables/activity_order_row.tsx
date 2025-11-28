import React from "react";
import { Col, Row } from "react-bootstrap";
import { Comment } from "~/components/injectable/data_displays/comment";
import { MBqDisplay } from "~/components/injectable/data_displays/mbq_display";
import { FlexMinimizer } from "~/components/injectable/flexMinimizer";
import { CancelIcon, StatusIcon } from "~/components/injectable/icons";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { ActivityDeliveryTimeSlot, ActivityOrder } from "~/dataclasses/dataclasses";
import { fulfillmentActivity } from "~/lib/physics";
import { MARGIN } from "~/lib/styles";
import { canBeCancelled } from "~/lib/utils";


export const ORDER_ROW_STATUS_KEY = "status";
export const ORDER_ROW_ID_KEY = "id";
export const ORDER_ROW_COMMENT = "comment";
export const ORDER_ROW_NO_OVERHEAD = "no_overhead";
export const ORDER_ROW_OVERHEAD = "overhead";
export const ORDER_ROW_CANCEL = "cancel"


type ActivityOrderRowProps = {
  order : ActivityOrder,
  columns? : Array<string>,
  overhead : number,
}

type ColumnProps = {
  order : ActivityOrder
  overhead? : number
}

function StatusOrderColumn({order} : ColumnProps){
  return (
    <FlexMinimizer>
      <StatusIcon order={order} />
    </FlexMinimizer>
  )
}

function IdOrderColumn({order} : ColumnProps){
  return (
    <Col>
      {order.id}
    </Col>
  );
}

function CommentOrderColumns({order} : ColumnProps){
  return (
    <Col>
      <Comment comment={order.comment} />
    </Col>
  );
}

function NoOverheadOrderColumns({order} : ColumnProps){
  const state = useTracershopState();
  const base_activity = fulfillmentActivity(order, state);
  const display_activity = Math.floor(base_activity);

  return (
    <Col>
      <MBqDisplay activity={display_activity} />
    </Col>
  );
}


function OverheadOrderColumns({order, overhead} : ColumnProps){
  const state = useTracershopState();
  const base_activity = fulfillmentActivity(order, state);
  const display_activity = Math.floor(base_activity * overhead);

  return (
    <Col>
      <MBqDisplay activity={display_activity} />
    </Col>
  );
}

function CancelColumn({order}){
  return (
    <FlexMinimizer>
      <CancelIcon order={order}/>
    </FlexMinimizer>
  );
}


export function ActivityOrderRow({
  order,
  columns = [ORDER_ROW_STATUS_KEY,
    ORDER_ROW_ID_KEY,
    ORDER_ROW_NO_OVERHEAD,
    ORDER_ROW_OVERHEAD,
    ORDER_ROW_COMMENT,
    ORDER_ROW_CANCEL
   ],
  overhead
}: ActivityOrderRowProps){
  const renderedColumns = columns.map((key, i) => {
    switch (true){
      case key === ORDER_ROW_STATUS_KEY:
        return <StatusOrderColumn key={i} order={order}/>
      case key === ORDER_ROW_ID_KEY:
        return <IdOrderColumn key={i} order={order}/>
      case key === ORDER_ROW_COMMENT && order.comment:
        return <CommentOrderColumns key={i} order={order}/>
      case key === ORDER_ROW_OVERHEAD:
        return <OverheadOrderColumns key={i} order={order} overhead={overhead}/>
      case key === ORDER_ROW_NO_OVERHEAD:
        return <NoOverheadOrderColumns key={i} order={order}/>
      case key === ORDER_ROW_CANCEL && canBeCancelled(order):
        return <CancelColumn key={i} order={order}/>
    }
  }).filter(x => Boolean(x));

  return (
    <Row style={MARGIN.all.px10}>
      {renderedColumns}
    </Row>
  );
}