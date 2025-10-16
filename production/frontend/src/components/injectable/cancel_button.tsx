import React, { useState } from "react";
import { Button, ButtonProps } from "react-bootstrap";
import { CancelBox } from "./cancel_box";
import { OrdersType, OrderType } from "~/lib/types";
import { Optional } from "./optional";

type CancelButtonProps = {
  orders? : OrdersType,
  order? : OrderType
} & Omit<ButtonProps, 'onClick'>;

export function CancelButton({
  orders,
  order,
  ...rest
} : CancelButtonProps) {
  const [showCancelBox, setShowCancelBox] = useState(false);

  return (
    <div>
      <Optional exists={showCancelBox}>
        <CancelBox
          orders={orders}
          order={order}
          show={showCancelBox}
          onClose={() => {setShowCancelBox(false)}}
        />
      </Optional>
      <Button {...rest} onClick={() => {setShowCancelBox(true)}}>Afvis</Button>
    </div>
  );
}