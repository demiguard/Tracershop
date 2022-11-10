import React, { Component } from "react";
import { Container } from "react-bootstrap";
import PropTypes from 'prop-types'

import ErrorStyles from "../../css/Errors.module.css"

/**
 * @enum
 */
export const WARNING_LEVELS = [
  "hint", // Move to Constants
  "warning",
  "error"
]

const Warning_names = {
  hint : "Hint:",
  warning : "Advarsel:",
  error : "Fejl:",
}

const stylings = {
  hint : ErrorStyles.hint
}


/** Stateless Box displaying an important message
 *
 */
export class AlertBox extends Component {
  static propTypes = {
    alertLevel : PropTypes.oneOf(WARNING_LEVELS),
    Message    : PropTypes.string
  }

  static defaultProps = {
    alertLevel : "error"
  }

  render(){


    return (
      <Container>
        {this.props.Message}
      </Container>
    );
  }
}