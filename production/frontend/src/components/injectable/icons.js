import React, { Component } from 'react'
import {Image, Button} from 'react-bootstrap'
import propTypes from 'prop-types'
import { ActivityOrder, InjectionOrder } from '~/dataclasses/dataclasses'
import { IOrderCollection } from '~/lib/data_structures'
import { ORDER_STATUS } from '~/lib/constants'

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


/**
 * 
 * @param {{
 *  altText : String
 *  onClick : Callable
 *  label : String
 *  order : {ActivityOrder, InjectionOrder}
 *  orderCollection : IOrderCollection
 * }} param0 
 * @returns 
 */
export function StatusIcon ({altText, onClick, label, order, orderCollection}) {

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
    if(order instanceof ActivityOrder && order.moved_to_time_slot){
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
  altText: propTypes.string,
  onClick : propTypes.func,
  label: propTypes.string,
  order: propTypes.oneOfType([propTypes.instanceOf(ActivityOrder), propTypes.instanceOf(InjectionOrder)]),
  orderCollection : propTypes.instanceOf(IOrderCollection),
};