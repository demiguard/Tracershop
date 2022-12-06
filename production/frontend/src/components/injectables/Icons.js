import React, { Component } from 'react'
import {Image, Button} from 'react-bootstrap'
import PropTypes from 'prop-types'

export { ClickableIcon }

class ClickableIcon extends Component {
  static propTypes = {
    altText: PropTypes.string,
    src: PropTypes.string.isRequired,
    onClick : PropTypes.func,
    label: PropTypes.string,
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