import React, { Component } from 'react'
import {Image, Button} from 'react-bootstrap'
import propTypes from 'prop-types'

export { ClickableIcon, StatusIcon }

class ClickableIcon extends Component {
  static propTypes = {
    altText: propTypes.string,
    src: propTypes.string.isRequired,
    onClick : propTypes.func,
    label: propTypes.string,
  }

  render(){
    return <Button
              variant="variant-light"
              aria-label={this.props.label}
              onClick={this.props.onClick}
    >
      <Image
        className='statusIcon'
        src={this.props.src}
        alt={this.props.altText}
      />
    </Button>
  }
}

class StatusIcon extends Component {
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
    if (status == 0) {return "/static/images/clipboard0.svg";}
    throw "Unknown status"
  }

  render(){
    const statusImagePath = StatusIcon.statusImages(this.props.status);

    return (<ClickableIcon
      {...this.props}
      src={statusImagePath}
    />)
  }


}