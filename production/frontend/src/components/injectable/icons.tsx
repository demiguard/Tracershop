import React, { CSSProperties, useState } from 'react'
import { Button, Col, Row} from 'react-bootstrap'
import propTypes from 'prop-types'
import { ActivityOrder, InjectionOrder, IsotopeOrder } from '~/dataclasses/dataclasses'
import { ActivityOrderCollection } from '~/lib/data_structures/activity_order_collection'
import { ORDER_STATUS, StateType } from '~/lib/constants'
import { openActivityReleasePDF, openInjectionReleasePDF, openIsotopeReleasePDF } from '~/lib/utils'
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context'
import { HoverBox } from '~/components/injectable/hover_box'
import { IdempotentButton, IdempotentButtonProps } from './buttons'
import { DATA_ACTIVITY_ORDER, DATA_INJECTION_ORDER, DATA_ISOTOPE, DATA_ISOTOPE_ORDER } from '~/lib/shared_constants'
import { IsotopeOrderCollection } from '~/lib/data_structures/isotope_order_collection'
import { Image, ImageProps } from './image'
import { OrdersType, OrderType, getOrderType } from '~/lib/types'
import { CancelBox } from './cancel_box'
import { Optional } from './optional'
import { OrderCollection } from '~/lib/data_structures/order_collection'

type ClickableIconProps = {
  src : string,
  onClick? : () => void,
  onMouseDown? : () => void
  beforeInjection? : (svg: SVGSVGElement) => void
  style? : React.CSSProperties,
  variant? : string
} & ImageProps

export function ClickableIcon ({
  "aria-label" : ariaLabel,
  src,
  onClick,
  onMouseDown,
  style={
    padding : "0px",
    justifyContent : 'center',
    alignItems: 'center',
    display: 'block',
  },
  variant="variant-light",
  beforeInjection,
  ...rest

} : ClickableIconProps){


  return (<Button
            style={style}
            variant={variant}
            onClick={onClick}
            onMouseDown={onMouseDown}
            aria-label={ariaLabel}
    >
      <Image
        beforeInjection={beforeInjection}
        style={{
          width : '24px',
          height : '24px'
        }}
        width="24"
        height="24"
        src={src}
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
    case ORDER_STATUS.UNAVAILABLE:
      return "";
    case ORDER_STATUS.AVAILABLE:
      return "";
    default:
      console.error("Unknown status encountered", status)
      return "/static/images/clipboard0.svg";
  }
}

type StatusIconArgs = {
  onClick? : () => void;
  order? : OrderType
  collection? : OrderCollection
} & Omit<ClickableIconProps, 'src'>

export function StatusIcon ({onClick, order, collection, ...rest} : StatusIconArgs) {
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

  const etherealOrder = order !== undefined && order.id <= 0;
  const empty_collection = collection !== undefined && collection.orders.length == 0

  if(statusImagePath === "" || etherealOrder || empty_collection){
    return <div data-testid="missing-status-icon" {...rest}></div>;
  }

  return <ClickableIcon
    onClick={onClick}
    src={statusImagePath}
    {...rest}
  />;
}

export function ActivityDeliveryIcon({orderCollection, ...rest}){
  if(orderCollection.minimum_status === ORDER_STATUS.RELEASED){
    return (
      <ClickableIcon
        src="/static/images/delivery.svg"
        onClick={openActivityReleasePDF(orderCollection.delivering_time_slot.id,
                                        new Date(orderCollection.ordered_date))
                }
        {...rest} // This is here to make props overwrite default props
      />);
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
} & Omit<ClickableIconProps, 'src' & 'onClick'>;

export function DeliveryIcon({
  collection,
  order,
  ...rest
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
    {...rest}
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
  className? : string,
  style? : CSSProperties
  variant? : string
} & IdempotentButtonProps;

export function IdempotentIcon ({
    altText,
    src,
    onClick,
    onMouseDown,
    style = {
      padding : "0px",
      justifyContent : 'center',
      alignItems: 'center',
      display: 'block',
    },
    variant = "variant-light",
    beforeInjection,
    ...rest
  }: IdempotentIconProps){


return (<IdempotentButton
          {...rest}
          style={style}
          variant={variant}
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

    return websocket.sendEditModels(
      order_type, updated_orders
    );
  }

  return <IdempotentIcon
    src="/static/images/thumb-up-add.svg"
    onClick={acceptOrders}
    {...rest}
  />
}

export function CalculatorIcon({ openCalculator, ...rest }){
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
