import React from "react";
import { Col, Row } from "react-bootstrap";
import propTypes from 'prop-types'

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
  hint : {
    borderColor: 'var(--tertiary-color-1)',
    fontFamily: 'mariRegular',
    margin: '15px',
    border: '3px',
    borderStyle: 'solid',
    borderRadius: '5px',
  },
  warning : {
    borderColor: '#cc8800',
    fontFamily: 'mariRegular',
    margin: '15px',
    border: '3px',
    borderStyle: 'solid',
    borderRadius: '5px',
    backgroundColor: '#FFDD99',
  },
  error : {
    fontFamily: 'mariRegular',
    display: 'block',
    margin: '15px' ,
    border: '3px',
    borderStyle: 'solid',
    borderColor: '#fc0c04',
    borderRadius: '5px',
    backgroundColor: '#ffcaca',
  },
}

const headerStylings = {
  hint : {
    fontSize: 'large',
    fontFamily: 'mariPoster',
    backgroundColor: 'var(--tertiary-color-1)',
    color: '#FFFFFF',
    verticalAlign: 'middle',
    padding: '0.5rem',
  },
  warning : {
    fontSize: 'large',
    fontFamily: 'mariPoster',
    backgroundColor: '#c80',
    color: '#FFFFFF',
    verticalAlign: 'middle',
    padding: '0.5rem',
  },
  error : {
    fontSize: 'large',
    fontFamily: 'mariPoster',
    backgroundColor: '#fc0c04',
    color: '#FFFFFF',
    padding: '0.5rem',
  },
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
export function AlertBox ({testId, message = "", level = ERROR_TYPE_ERROR}) {
    return (
      <Row
        data-testid={testId}
        style={{
          padding : '0px',
          ...stylings[level]
        }}
        className={"justify-content-start"}>
        <Col style={headerStylings[level]} md={{span : 2}} className={"justify-content-start text-center"}>{Warning_names[level]}</Col>
        <Col md={{span : 10}} className="p-2 justify-content-start">{message}</Col>
      </Row>
    );
}

AlertBox.propTypes = {
  level : propTypes.oneOf(warning_levels),
  message : propTypes.oneOfType([propTypes.string, propTypes.element])
}
