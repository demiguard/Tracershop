import React, { Component } from 'react'
import {Image, Button} from 'react-bootstrap'
import propTypes from 'prop-types'

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

export class StatusIcon extends Component {
  static propTypes = {
    altText: propTypes.string,
    onClick : propTypes.func,
    label: propTypes.string,
    status: propTypes.number.isRequired,
  }

  static statusImages(status) {
    if (status == 1) {return "/static/images/clipboard1.svg";}
    if (status == 2) {return "/static/images/clipboard2.svg";}
    if (status == 3) {return "/static/images/clipboard3.svg";}
    if (status == 4) {return "/static/images/clipboard0.svg";}
    if (status == 0) {return "/static/images/clipboard0.svg";}
    throw `Unknown status: ${status}`
  }

  render(){
    const statusImagePath = StatusIcon.statusImages(this.props.status);

    return (<ClickableIcon
      {...this.props}
      src={statusImagePath}
    />)
  }


}