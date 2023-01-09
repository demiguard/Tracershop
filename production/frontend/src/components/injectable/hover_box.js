import React, { Component } from 'react'
import propTypes, { element } from 'prop-types'
import styles from "../../css/Site.module.css"
import { Container } from 'react-bootstrap'
import ReactHover, { Hover, Trigger } from 'react-hover'



export { HoverBox }
/**
 * Box that is displayed in a Hover
 */

class HoverBox extends Component {
  static propTypes = {
    Base : propTypes.element.isRequired,
    Hover : propTypes.element.isRequired,
    shiftX : propTypes.number,
    shiftY : propTypes.number,
    followCursor : propTypes.bool,
  }


  static defaultProps = {
    shiftX : 30,
    shiftY : 0,
    followCursor : false,
  }

  render(){
    const TriggerOptions = {
      followCursor: this.props.followCursor,
      shiftX: this.props.shiftX,
      shiftY: this.props.shiftY
    };

    return (
    <ReactHover options={TriggerOptions}>
      <Trigger type="trigger" styles={{width : '100%'}}>
        <div>{this.props.Base}</div>
      </Trigger>
      <Hover type="Hover">
        <Container className={styles.HoverBox}>
          {this.props.Hover}
        </Container>
      </Hover>
    </ReactHover>
  );
  }
}
