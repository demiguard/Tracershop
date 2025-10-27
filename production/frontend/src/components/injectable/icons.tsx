import React, { CSSProperties, useState } from 'react'
import { Button, Col, Row} from 'react-bootstrap'
import propTypes from 'prop-types'
import { ActivityOrder, InjectionOrder, IsotopeOrder } from '~/dataclasses/dataclasses'
import { ActivityOrderCollection } from '~/lib/data_structures/activity_order_collection'
import { ORDER_STATUS, StateType } from '~/lib/constants'
import { openActivityReleasePDF, openInjectionReleasePDF, openIsotopeReleasePDF } from '~/lib/utils'
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context'
import { HoverBox } from '~/components/injectable/hover_box'
import { IdempotentButton } from './buttons'
import { DATA_ACTIVITY_ORDER, DATA_INJECTION_ORDER, DATA_ISOTOPE, DATA_ISOTOPE_ORDER } from '~/lib/shared_constants'
import { IsotopeOrderCollection } from '~/lib/data_structures/isotope_order_collection'
import { Image } from './image'
import { OrdersType, OrderType, getOrderType } from '~/lib/types'
import { CancelBox } from './cancel_box'
import { Optional } from './optional'
import { OrderCollection } from '~/lib/data_structures/order_collection'

interface ClickableIconProps {
  altText? : string,
  src : string,
  onClick? : any,
  onMouseDown? : any,
  label? : string,
  className? : string,
  style? : Object,
  variant? : string,
  beforeInjection? : (svg: SVGSVGElement) => void
}

export function ClickableIcon (props : ClickableIconProps){
  const {
    altText,
    src,
    onClick,
    onMouseDown,
    label,
    className ,
    style={
      padding : "0px",
      justifyContent : 'center',
      alignItems: 'center',
      display: 'block',
    },
    variant="variant-light",
    beforeInjection,
    ...rest
  } = props

  const PassedClassName = className ? `statusIcon ${className}` : "statusIcon";

  return (<Button
            style={style}
            variant={variant}
            aria-label={label}
            onClick={onClick}
            onMouseDown={onMouseDown}
    >
      <Image
        beforeInjection={beforeInjection}
        style={{
          width : '24px',
          height : '24px'
        }}
        width="24"
        height="24"
        className={PassedClassName}
        src={src}
        alt={altText}
        {...rest}
      />
    </Button>)
}

ClickableIcon.propTypes = {
  altText : propTypes.string,
  src : propTypes.string.isRequired,
  onClick : propTypes.func
}

function statusImages(status : number) {
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
      return "";
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
  onClick? : () => void;
  order? : OrderType
  collection? : OrderCollection
}

export function StatusIcon ({onClick, label, order, collection, altText} : StatusIconArgs) {
  const statusImagePath = (() => {
    if (collection) {
      if(collection instanceof ActivityOrderCollection && collection.moved) {
        return "/static/images/move_top.svg";
      } else {
        return statusImages(collection.minimum_status);
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

type DeliveryIconProps = {
  collection? : OrderCollection
  order? : OrderType
};

export function DeliveryIcon({
  collection,
  order
} : DeliveryIconProps){

  const clickFunction = (() => {
    switch(true) {
      case collection instanceof ActivityOrderCollection:
        return openActivityReleasePDF(collection.delivering_time_slot.id, new Date(collection.ordered_date))
      case order instanceof InjectionOrder:
        return openInjectionReleasePDF(order);
      case collection instanceof IsotopeOrderCollection:
        return openIsotopeReleasePDF(collection);
      default:
        return () => {}
    }})();

  return <ClickableIcon
    src="/static/images/delivery.svg"
    onClick={clickFunction}
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

type IdempotentIconProps = {
  altText? : string,
  src : string,
  beforeInjection? : (svg: SVGSVGElement) => undefined,
  onClick? : (() => Promise<any>),
  onMouseDown? : () => void,
  label? : string,
  className? : string,
  style? : CSSProperties
  variant? : string
  [key: string] : any

}

export function IdempotentIcon (props: IdempotentIconProps){

  let {
    altText,
    src,
    onClick,
    onMouseDown,
    label,
    className ,
    style,
    variant,
    beforeInjection,
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
      style={{
          width : '24px',
          height : '24px'
        }}
      width = '24'
      height = '24'
      beforeInjection={beforeInjection}
      className={className}
      src={src}
      alt={altText}
    />
  </IdempotentButton>)
}



export function AcceptIcon(props : {orders : OrdersType }){
  const {orders, ...rest} = props;

  const websocket = useWebsocket();

  const order_type = getOrderType({orders : orders})

  if(order_type === undefined){
    return <div></div>;
  }

  function acceptOrders(){
    if(!websocket){
      return Promise.resolve();
    }

    const filtered_orders = orders.filter(
      order => order.status === ORDER_STATUS.ORDERED
    );
    const updated_orders = filtered_orders.map(
      (order) => ({...order, status : ORDER_STATUS.ACCEPTED})
    );

    return websocket.sendEditModel(
      order_type, updated_orders
    );
  }

  return <IdempotentIcon
    src="/static/images/thumb-up-add.svg"
    onClick={acceptOrders}
    {...rest}
  />
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

type CancelIconProps = {
  order? : OrderType,
  orders? : OrdersType,
  [key: string] : any,
};


export function CancelIcon(props : CancelIconProps){
  const {order, orders, ...rest} = props;
  const [showCancelBox, setShowCancelBox] = useState(false);

  return <div>
    <CancelBox
      show={showCancelBox}
      onClose={() => {setShowCancelBox(false);}}
      orders={orders}
      order={order}
    />

  <ClickableIcon
    {...rest}
    src={"static/images/x-circle-fill.svg"}
    onClick={() => {setShowCancelBox(true);}}
    beforeInjection={
      (svg: SVGSVGElement) => {
        svg.setAttribute('fill', 'red')
      }
    }
  />
  </div>
}

type EtherealIconProps = {
  showState : StateType<boolean>
}

export function EtherealIcon(props : EtherealIconProps){
  const { showState } = props;
  const [show, setShow] = showState;

  const showIcon = <ClickableIcon
                      src="/static/images/plus2.svg"
                      onClick={() => {setShow(true)}}
                      beforeInjection={(svg) => { svg.setAttribute('fill', 'green') }}
                    />;
  const hideIcon = <ClickableIcon
                      src="/static/images/plus2.svg"
                      onClick={() => {setShow(false)}}
                      beforeInjection={(svg) => { svg.setAttribute('fill', 'red') }}
                    />;

  return <Optional exists={show} alternative={showIcon}>
    {hideIcon}
  </Optional>
}
