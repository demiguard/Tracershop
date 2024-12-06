import React from 'react'
import {Image, Button, Col, Row} from 'react-bootstrap'
import propTypes from 'prop-types'
import { ActivityOrder, InjectionOrder } from '~/dataclasses/dataclasses'
import { ActivityOrderCollection } from '~/lib/data_structures'
import { ORDER_STATUS } from '~/lib/constants'
import { InjectionOrderPDFUrl, openActivityReleasePDF, openInjectionReleasePDF } from '~/lib/utils'
import { useTracershopState } from '~/components/tracer_shop_context'
import { HoverBox } from '~/components/injectable/hover_box'
import { IdempotentButton } from '~/components/injectable/buttons'

export function ClickableIcon ({
    altText,
    src,
    onClick,
    onMouseDown,
    label,
    className ,
    style,
    variant,
  }){

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

/**
 *
 * @param {{
 *  altText : String
 *  onClick : Callable
 *  label : String
 *  order : {ActivityOrder, InjectionOrder}
 *  orderCollection : ActivityOrderCollection
 * }} param0
 * @returns
 */
export function StatusIcon ({onClick, label, order, orderCollection, altText}) {

  function statusImages(status) {
    if (status == ORDER_STATUS.ORDERED) {return "/static/images/clipboard1.svg";}
    if (status == ORDER_STATUS.ACCEPTED) {return "/static/images/clipboard2.svg";}
    if (status == ORDER_STATUS.RELEASED) {return "/static/images/clipboard3.svg";}
    if (status == ORDER_STATUS.CANCELLED) {return "/static/images/clipboard0.svg";}
    if (status == ORDER_STATUS.AVAILABLE) {return "/static/images/clipboard0.svg";}
    throw `Unknown status: ${status}`;
  }

  const statusImagePath = (() => {
    if (orderCollection) {
      if(orderCollection.moved) {
        return "/static/images/move_top.svg";
      } else {
        return statusImages(orderCollection.minimum_status);
      }
    }
    if(order instanceof ActivityOrder && !!order.moved_to_time_slot){
      return "/static/images/move_top.svg";
    }
    return statusImages(order.status);
  })()
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
  orderCollection : propTypes.instanceOf(ActivityOrderCollection),
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
const ActivityDeliveryIconInheritedPropTypes = {...ClickableIcon.propTypes};
delete ActivityDeliveryIconInheritedPropTypes['src'];
delete ActivityDeliveryIconInheritedPropTypes['onClick'];

ActivityDeliveryIcon.propTypes = {
  ...ActivityDeliveryIconInheritedPropTypes,
  orderCollection : propTypes.instanceOf(ActivityOrderCollection),
}

// I feel dirty
const injectionDeliveryIconInheritedPropTypes = {...ClickableIcon.propTypes};
delete injectionDeliveryIconInheritedPropTypes['src'];
delete injectionDeliveryIconInheritedPropTypes['onClick'];


export function InjectionDeliveryIcon(props){
  const {order, ...newProps} = props;
  return <ClickableIcon
    src="/static/images/delivery.svg"
    onClick={ openInjectionReleasePDF(order)}
    {...newProps}  // This is here to make props overwrite default props
  />;
}

InjectionDeliveryIcon.propTypes = {
  ...injectionDeliveryIconInheritedPropTypes,
  order: propTypes.instanceOf(InjectionOrder).isRequired
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


export function IdempotentIcon ({
  altText,
  src,
  onClick,
  onMouseDown,
  label,
  className ,
  style,
  variant,
}){

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
