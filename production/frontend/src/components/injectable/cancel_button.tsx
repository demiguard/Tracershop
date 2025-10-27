import React, { useState } from "react";
import { Button, ButtonProps } from "react-bootstrap";
import { CancelBox } from "./cancel_box";
import { OrdersType, OrderType } from "~/lib/types";
import { Optional } from "./optional";
import { OrderCollection } from "~/lib/data_structures/order_collection";

type CancelButtonProps = {
  orders? : OrdersType,
  order? : OrderType
  collection? : OrderCollection,
} & Omit<ButtonProps, 'onClick'>;

export function CancelButton({
  orders,
  order,
  collection,
  ...rest
} : CancelButtonProps) {
  const [showCancelBox, setShowCancelBox] = useState(false);

  return (
    <div>
      <Optional exists={showCancelBox}>
        <CancelBox
          orders={orders}
          order={order}
          collection={collection}
          show={showCancelBox}
          onClose={() => {setShowCancelBox(false)}}
        />
      </Optional>
      <Button {...rest} onClick={() => {setShowCancelBox(true)}}>Afvis</Button>
    </div>
  );
}