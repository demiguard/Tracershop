import React, { useRef, useState } from "react";
import { Col, Row, RowProps } from "react-bootstrap";
import PropTypes from 'prop-types'

import { ERROR_TYPE_ERROR, ERROR_TYPE_HINT, ERROR_TYPE_NO_ERROR, ERROR_TYPE_WARNING } from "~/lib/constants.js";
import { RecoverableError } from "~/lib/error_handling";
import { PADDING } from "~/lib/styles";
import { useOverflow } from "~/effects/overflow";

const Warning_names = {
  hint : "Hint:",
  warning : "Advarsel:",
  error : "Fejl:",
  no_error : ""
}

const messageStyle: React.CSSProperties = {
  textAlign : "center",
  margin : "auto",
}

const stylings : {
  hint : React.CSSProperties,
  warning : React.CSSProperties,
  error: React.CSSProperties,
  no_error : React.CSSProperties
} = {
  no_error : {
    display : "none"
  },
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

const headerBaseStyling : React.CSSProperties = {
  fontSize: 'large',
  fontFamily: 'mariPoster',
  padding: '0.5rem',
  width : "15%",
  flex : "0 0 auto",
  color: '#FFFFFF',
  textAlign : "center",
}

const headerStylings: {
  hint : React.CSSProperties,
  warning : React.CSSProperties,
  error: React.CSSProperties,
  no_error : React.CSSProperties
} = {
  no_error : {

  },
  hint : {
    ...headerBaseStyling,
    backgroundColor: 'var(--tertiary-color-1)',
  },
  warning : {
    ...headerBaseStyling,
    backgroundColor: '#c80',
  },
  error : {
    ...headerBaseStyling,
    backgroundColor: '#fc0c04',
  },
}

/**
 * @enum
 */
export const ERROR_LEVELS = {
  hint : ERROR_TYPE_HINT,
  warning : ERROR_TYPE_WARNING,
  error : ERROR_TYPE_ERROR,
  NO_ERROR : ERROR_TYPE_NO_ERROR
} as const;

type AlertBoxProps = {
  error : RecoverableError
} & RowProps

/** Stateless Box displaying an important message
 * @param {Object} param0
 * @param {string | Number} param0.testId
 * @param {RecoverableError} param0.error
 */
export function AlertBox ({error, style, ...rest} : AlertBoxProps) {
  const headerRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  function overflowingCallback(newOverflow : boolean){
    if(newOverflow){
      setOverflowing(newOverflow)
    }
  }

  // overflow is unused because I have an issue where it would flicker back an fourth
  const overflow = useOverflow(headerRef, overflowingCallback);

  const headerStyle = {
    ...headerStylings[error.level],
    display : overflowing ? "none" : "inherit"
  };

  const rowStyling = {
    ...style,
    ...stylings[error.level],
  }

  return (
    <Row
      {...rest}
      style={rowStyling}
    >
      <Col ref={headerRef} style={headerStyle}>{Warning_names[error.level]}</Col>
      <Col style={messageStyle}>{error.message}</Col>
    </Row>
  );
}
