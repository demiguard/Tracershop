import React from 'react'
import { Button, ButtonProps } from 'react-bootstrap'
import { ORDER_STATUS } from '~/lib/constants'
import { OrdersType } from '~/lib/types'
import { get_minimum_status } from '~/lib/utils'

type StatusButtonProps = {
  orders : OrdersType
} & ButtonProps


const STYLE_ACCEPTED : React.CSSProperties = {
  color : "#000000",
  backgroundColor : "#eeee34ff",
  borderColor : "#000000"
}

const STYLE_RELEASED : React.CSSProperties = {
  backgroundColor : "#25b92aff",
  borderColor : "#00aa1fff",
}

const STYLE_ORDERED : React.CSSProperties = {
  backgroundColor : "#a90b0bff",
  borderColor : "#4f0101ff"
}

export function StatusButton({
  orders, style, children, ...rest
}){
  const minimum_status = get_minimum_status(orders);

  const style_ = (() => {
    switch (minimum_status){
      case ORDER_STATUS.ACCEPTED:
        return {
          ...STYLE_ACCEPTED,
          ...style
        };
      case ORDER_STATUS.RELEASED:
        return {
          ...STYLE_RELEASED,
          ...style
        };
      case ORDER_STATUS.ORDERED:
        return {
          ...STYLE_ORDERED,
          ...style,
        };
    };

    return {...style};
  })();

  return <Button style={style_} {...rest}>
    {children}
  </Button>
}