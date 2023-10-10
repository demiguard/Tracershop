import React from "react";
import { Col, Row } from "react-bootstrap";
import propTypes from 'prop-types'

import ErrorStyles from "../../css/Errors.module.css"
import { ERROR_TYPE_ERROR, ERROR_TYPE_HINT, ERROR_TYPE_WARNING } from "~/lib/constants.js";

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
export const ERROR_LEVELS = {
  hint : ERROR_TYPE_HINT,
  warning : ERROR_TYPE_WARNING,
  error : ERROR_TYPE_ERROR
}


/** Stateless Box displaying an important message
 *
 */
export function AlertBox ({message, level}) {
    return (
      <Row
        style={{
          padding : '0px'
        }}
        className={stylings[level] + " justify-content-start"}>
        <Col md={{span : 2}} className={"justify-content-start text-center " + headerStylings[level]}>{Warning_names[level]}</Col>
        <Col md={{span : 10}} className="p-2 justify-content-start">{message}</Col>
      </Row>
    );
}

AlertBox.propTypes = {
  level : propTypes.oneOf(warning_levels),
  message : propTypes.oneOfType([propTypes.string, propTypes.element])
}

AlertBox.defaultProps = {
  level : ERROR_TYPE_ERROR,
  message : ""
}