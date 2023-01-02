import React, { Component } from "react";
import { Container, Col, Row } from "react-bootstrap";
import PropTypes from 'prop-types'

import ErrorStyles from "../../css/Errors.module.css"
import { ERROR_TYPE_ERROR, ERROR_TYPE_HINT, ERROR_TYPE_WARNING } from "../../lib/constants";

export { ERROR_LEVELS, AlertBox }

const warning_levels = [
  ERROR_TYPE_HINT,
  ERROR_TYPE_WARNING,
  ERROR_TYPE_ERROR
]

const Warning_names = {
  hint : "Hint:",
  warning : "Advarsel:",
  error : "Fejl:",
}

const stylings = {
  hint : ErrorStyles.hint,
  warning : ErrorStyles.warning,
  error : ErrorStyles.error
}

const headerStylings = {
  hint : ErrorStyles.hintHeader,
  warning : ErrorStyles.warningHeader,
  error : ErrorStyles.errorHeader,
}

/**
 * @enum
 */
const ERROR_LEVELS = {
  hint : ERROR_TYPE_HINT,
  warning : ERROR_TYPE_WARNING,
  error : ERROR_TYPE_ERROR
}


/** Stateless Box displaying an important message
 *
 */
class AlertBox extends Component {
  static propTypes = {
    level : PropTypes.oneOf(warning_levels),
    message    : PropTypes.string
  }

  static defaultProps = {
    level : ERROR_TYPE_ERROR,
    message : ""
  }

  render(){
    return (
      <Row className={stylings[this.props.level] + " justify-content-start"}>
        <Col md={{span : 2}} className={"justify-content-start text-center " + headerStylings[this.props.level]}>{Warning_names[this.props.level]}</Col>
        <Col md={{span : 9, offset: 1}} className="p-2 justify-content-start">{this.props.message}</Col>
      </Row>
    );
  }
}