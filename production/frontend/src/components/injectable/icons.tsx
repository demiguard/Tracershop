import React from 'react'
import {Image, Button, Col, Row} from 'react-bootstrap'
import propTypes from 'prop-types'
import { ActivityOrder, InjectionOrder, IsotopeOrder } from '~/dataclasses/dataclasses'
import { ActivityOrderCollection } from '~/lib/data_structures/activity_order_collection'
import { ORDER_STATUS } from '~/lib/constants'
import { openActivityReleasePDF, openInjectionReleasePDF } from '~/lib/utils'
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context'
import { HoverBox } from '~/components/injectable/hover_box'
import { IdempotentButton } from './buttons'
import { DATA_ACTIVITY_ORDER, DATA_INJECTION_ORDER } from '~/lib/shared_constants'
import { IsotopeOrderCollection } from '~/lib/data_structures/isotope_order_collection'

interface ClickableIconProps {
  altText? : string,
  src : string,
  onClick? : any,
  onMouseDown? : any,
  label? : string,
  className? : string,
  style? : Object,
  variant? : string,
}

export function ClickableIcon ({
    altText,
    src,
    onClick,
    onMouseDown,
    label,
    className ,
    style,
    variant,
  } : ClickableIconProps){

  if(style === undefined){
    style = {
      padding : "0px",
      justifyContent : 'center',
      alignItems: 'center',
      display: 'block',
    }
  }

  if(variant === undefined){
    variant = "variant-light"
  }

  if (className) {
    className = `statusIcon ${className}`;
  } else {
    className = "statusIcon";
  }

  return (<Button
            style={style}
            variant={variant}
            aria-label={label}
            onClick={onClick}
            onMouseDown={onMouseDown}
    >
      <Image
        className={className}
        src={src}
        alt={altText}
      />
    </Button>)
}

ClickableIcon.propTypes = {
  altText : propTypes.string,
  src : propTypes.string.isRequired,
  onClick : propTypes.func
}

function statusImages(status) {
  switch (status){
    case ORDER_STATUS.ORDERED:
      return "/static/images/clipboard1.svg";
    case ORDER_STATUS.ACCEPTED:
      return "/static/images/clipboard2.svg";
    case ORDER_STATUS.RELEASED:
      return "/static/images/clipboard3.svg";
    case ORDER_STATUS.CANCELLED:
      return "/static/images/clipboard0.svg";
    case ORDER_STATUS.EMPTY:
      return "";
    case ORDER_STATUS.AVAILABLE:
      return "/static/images/clipboard0.svg";
    case ORDER_STATUS.RISOE:
      return "/static/images/clipboard0.svg";
    default:
      console.error("Unknown status encountered", status)
      return "/static/images/clipboard0.svg";
  }
}

interface StatusIconArgs {
  altText? : string,
  label? : string,
  onClick? : () => {};
  order? : ActivityOrder | InjectionOrder | IsotopeOrder
  orderCollection? : ActivityOrderCollection | IsotopeOrderCollection
}

/**
 *
 * @param {{
 *  altText : String
 *  onClick : Callable
 *  label : String
 *  order : {ActivityOrder, InjectionOrder}
 *  orderCollection : ActivityOrderCollection | IsotopeOrderCollection
 * }} param0
 * @returns
 */
export function StatusIcon ({onClick, label, order, orderCollection, altText} : StatusIconArgs) {
  const statusImagePath = (() => {
    if (orderCollection) {
      if(orderCollection instanceof ActivityOrderCollection && orderCollection.moved) {
        return "/static/images/move_top.svg";
      } else {
        return statusImages(orderCollection.minimum_status);
      }
    }
    if(order instanceof ActivityOrder && !!order.moved_to_time_slot){
      return "/static/images/move_top.svg";
    }

    return statusImages(order.status);
  })();

  if(statusImagePath === ""){
    return <div></div>;
  }

  return <ClickableIcon
    altText={altText}
    onClick={onClick}
    label={label}
    src={statusImagePath}
  />;
}

StatusIcon.propTypes = {
  onClick : propTypes.func,
  label: propTypes.string,
  order: propTypes.oneOfType([
    propTypes.instanceOf(ActivityOrder),
    propTypes.instanceOf(InjectionOrder)]),
  orderCollection : propTypes.oneOfType([
    propTypes.instanceOf(ActivityOrderCollection),
    propTypes.instanceOf(IsotopeOrderCollection)
  ]),
};

export function ActivityDeliveryIcon(props){
  const newProps = {...props};
  delete newProps['orderCollection'];
  if(props.orderCollection.minimum_status === ORDER_STATUS.RELEASED){
    return <ClickableIcon
    src="/static/images/delivery.svg"
    onClick={openActivityReleasePDF(props.orderCollection.delivering_time_slot.id,
                                    new Date(props.orderCollection.ordered_date))
            }
    {...newProps} // This is here to make props overwrite default props
  />
  }
  return <div aria-label='empty-delivery-icon'></div>;
}

// I feel dirty



export function InjectionDeliveryIcon(props){
  const {order, ...newProps} = props;
  return <ClickableIcon
    src="/static/images/delivery.svg"
    onClick={ openInjectionReleasePDF(order)}
    {...newProps}  // This is here to make props overwrite default props
  />;
}

export function WebsocketIcon(){
  const state = useTracershopState();

  const display = <svg
    className="animated-error"
    width="60px"
    height="60px"
    viewBox="15 15 46 46"
    version="1.1"
    baseProfile="full"
    enableBackground="new 0 0 76.00 76.00"
    >
    <path
      className="animated-error"
      fill="#000000"
      fillOpacity="1"
      strokeWidth="0.2"
      strokeLinejoin="round"
      d="M 48.0542,39.5833L 53.0417,44.5708L 58.0291,39.5834L 60.1666,41.7209L 55.1792,46.7083L 60.1667,51.6958L 58.0292,53.8333L 53.0417,48.8458L 48.0542,53.8333L 45.9167,51.6958L 50.9042,46.7083L 45.9167,41.7208L 48.0542,39.5833 Z M 24,24L 27,24L 27,33L 24,33L 24,24 Z M 29,25L 32,25L 32,39L 29,39L 27,41L 27,51L 24,51L 24,41L 22,39L 19,39L 19,25L 22,25L 22,35L 29,35L 29,25 Z M 28,48L 28,44L 45.5,44L 48.0541,46.7083L 47,48L 40,48L 40,51L 44,51L 45,54L 31,54L 32,51L 36,51L 36,48L 28,48 Z M 49,30L 33,30L 33,26L 54,26L 54,40.75L 53.0416,41.7209L 49,37.75L 49,30 Z "
    />
  </svg>
  const hover = <p>Du har mistet forbindelsen til Tracershop.
    Forbind til siden igen for at forblive opdateret.</p>

  switch(state.readyState){
    case WebSocket.CLOSED:
    case WebSocket.CLOSING:
      return (
      <Row style={{
        justifyContent : 'end'
      }}>
        <HoverBox
          Base={display}
          Hover={hover}
        />
      </Row>);
    default:
      return null
  }
}


export function IdempotentIcon (props){

  let {
    altText,
    src,
    onClick,
    onMouseDown,
    label,
    className ,
    style,
    variant,
    ...rest
  } = props

if(style === undefined){
  style = {
    padding : "0px",
    justifyContent : 'center',
    alignItems: 'center',
    display: 'block',
  }
}

if(variant === undefined){
  variant = "variant-light"
}

if (className) {
  className = `statusIcon ${className}`;
} else {
  className = "statusIcon";
}

return (<IdempotentButton
          {...rest}
          style={style}
          variant={variant}
          aria-label={label}
          onClick={onClick}
          onMouseDown={onMouseDown}
  >
    <Image
      className={className}
      src={src}
      alt={altText}
    />
  </IdempotentButton>)
}



/**
 *
 * @param {{
 *  orders : Array<InjectionOrder>
 * }} props
 */
export function AcceptIconInjection(props){
  const websocket = useWebsocket();

  const {orders, ...rest} = props;

  function acceptOrders(){
    if (!websocket){
      return Promise.resolve();
    }

    const filtered_orders = orders.filter(
      order => order.status === ORDER_STATUS.ORDERED
    );
    const updated_orders = filtered_orders.map(
      order => ({...order, status : ORDER_STATUS.ACCEPTED})
    );

    return websocket.sendEditModel(
      DATA_INJECTION_ORDER, updated_orders
    );
  }

  return <IdempotentIcon {...rest} src="/static/images/thumb-up-add.svg" onClick={acceptOrders}/>;
}

export function AcceptIconActivity (props: {orders : Array<ActivityOrder>}){
  const {orders} = props;
  const websocket = useWebsocket();

  function acceptOrders(){
    if(!websocket){
      return Promise.resolve();
    }
    const filtered_orders = orders.filter(
      order => order.status === ORDER_STATUS.ORDERED
    );
    const updated_orders = filtered_orders.map(
      order => ({...order, status : ORDER_STATUS.ACCEPTED})
    );

    return websocket.sendEditModel(
      DATA_ACTIVITY_ORDER, updated_orders
    );
  }

 return <IdempotentIcon
            src="/static/images/thumb-up-add.svg"
            onClick={acceptOrders}
        />;
}

export function CalculatorIcon(props){
  const { openCalculator, ...rest } = props;

  return <ClickableIcon
    onClick={openCalculator}
    src="/static/images/calculator.svg"
    {...rest}
  />;
}
