import React, { Component } from 'react'
import {Image, Button} from 'react-bootstrap'
import propTypes from 'prop-types'
import { ActivityOrder, DeliveryEndpoint, InjectionOrder, Tracer } from '~/dataclasses/dataclasses'
import { ActivityOrderCollection } from '~/lib/data_structures'
import { ORDER_STATUS } from '~/lib/constants'
import { InjectionOrderPDFUrl, openActivityReleasePDF } from '~/lib/utils'

export function ClickableIcon ({
    altText,
    src,
    onClick,
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

    return <Button
              style={style}
              variant={variant}
              aria-label={label}
              onClick={onClick}
    >
      <Image
        className={className}
        src={src}
        alt={altText}
      />
    </Button>
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
    onClick={() => {openActivityReleasePDF(props.orderCollection.endpoint,
                                           props.orderCollection.tracer,
                                           new Date(props.orderCollection.ordered_date))}}
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
  const newProps = {...props}
  delete newProps['order']
  return <ClickableIcon
  src="/static/images/delivery.svg"
  onClick={() => window.location = InjectionOrderPDFUrl(props.order)}
  {...newProps}  // This is here to make props overwrite default props
  />
}

InjectionDeliveryIcon.propTypes = {
  ...injectionDeliveryIconInheritedPropTypes,
  order: propTypes.instanceOf(InjectionOrder).isRequired
}